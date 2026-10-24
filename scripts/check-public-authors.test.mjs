import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPublicAuthors, runCli } from "./check-public-authors.mjs";

const SAFE = "fictional-contributor@users.noreply.github.com";
const PRIVATE = "identity-canary@example.invalid";

function repository(t) {
  const directory = mkdtempSync(join(tmpdir(), "community-author-check-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const git = args => execFileSync("git", ["--no-replace-objects", ...args], {
    cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  git(["init", "--quiet"]);
  const tree = git(["mktree"]).trim();
  let tick = 0;
  const commit = ({ author = SAFE, committer = SAFE, parents = [] } = {}) => {
    tick++;
    return execFileSync("git", ["commit-tree", tree, ...parents.flatMap(parent => ["-p", parent]), "-m", "Fictional test commit"], {
      cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_AUTHOR_NAME: "Fictional contributor", GIT_AUTHOR_EMAIL: author,
        GIT_COMMITTER_NAME: "Fictional contributor", GIT_COMMITTER_EMAIL: committer,
        GIT_AUTHOR_DATE: `${1700000000 + tick} +0000`, GIT_COMMITTER_DATE: `${1700000000 + tick} +0000` },
    }).trim();
  };
  return { directory, git, commit };
}

function pullRequest(t, identities = {}) {
  const repo = repository(t);
  const base = repo.commit(identities.base);
  const head = repo.commit({ parents: [base], ...identities.head });
  const merge = repo.commit({ author: PRIVATE, parents: [base, head], ...identities.merge });
  repo.git(["update-ref", "refs/heads/main", base]);
  repo.git(["update-ref", "refs/remotes/contributor/change", head]);
  repo.git(["checkout", "--quiet", "--detach", merge]);
  const event = { number: 10, pull_request: { number: 10, base: { sha: base }, head: { sha: head } } };
  const eventPath = join(repo.directory, "event.json");
  writeFileSync(eventPath, JSON.stringify(event));
  const env = { GITHUB_EVENT_NAME: "pull_request", GITHUB_REF: "refs/pull/10/merge",
    GITHUB_SHA: merge, GITHUB_EVENT_PATH: eventPath };
  return { ...repo, base, head, merge, event, env };
}

function rejectsWithoutIdentity(operation) {
  assert.throws(operation, error => {
    assert.equal(error.message.includes(PRIVATE), false);
    assert.match(error.message, /Public commit history requires GitHub noreply/);
    return true;
  });
}

test("verified GitHub pull-request merge exempts only the detached synthetic identity", t => {
  const fixture = pullRequest(t);
  assert.deepEqual(checkPublicAuthors(fixture), { checked_commits: 2, synthetic_merge_identity_exempted: true });
});

test("real base, contributor head and side-reference identities remain checked", t => {
  for (const target of ["base", "head"]) {
    const fixture = pullRequest(t, { [target]: { author: PRIVATE } });
    rejectsWithoutIdentity(() => checkPublicAuthors(fixture));
  }
  const fixture = pullRequest(t);
  const side = fixture.commit({ author: PRIVATE, parents: [fixture.base] });
  fixture.git(["update-ref", "refs/heads/other-public-branch", side]);
  rejectsWithoutIdentity(() => checkPublicAuthors(fixture));
});

test("real committer identities and raw addresses cannot be hidden by mailmap", t => {
  const fixture = pullRequest(t, { head: { committer: PRIVATE } });
  writeFileSync(join(fixture.directory, ".mailmap"), `Fictional <${SAFE}> <${PRIVATE}>\n`);
  rejectsWithoutIdentity(() => checkPublicAuthors(fixture));
});

test("local, push, workflow dispatch and pull_request_target receive no synthetic exception", t => {
  const fixture = pullRequest(t);
  for (const name of [undefined, "push", "workflow_dispatch", "pull_request_target"]) {
    rejectsWithoutIdentity(() => checkPublicAuthors({ ...fixture,
      env: name ? { ...fixture.env, GITHUB_EVENT_NAME: name } : {},
      readEvent: () => assert.fail("Non-PR runs must not read event files"),
    }));
  }
});

test("ordinary noreply history succeeds without CI context or event reads", t => {
  const repo = repository(t);
  const first = repo.commit();
  const second = repo.commit({ parents: [first], author: "noreply@github.com", committer: "noreply@github.com" });
  repo.git(["update-ref", "refs/heads/main", second]);
  repo.git(["checkout", "--quiet", "--detach", second]);
  assert.deepEqual(checkPublicAuthors({ ...repo, env: {}, readEvent: () => assert.fail("No event expected") }),
    { checked_commits: 2, synthetic_merge_identity_exempted: false });
});

test("wrong PR refs, numbers and checkout SHA fail closed even if identities otherwise pass", t => {
  const fixture = pullRequest(t, { merge: { author: SAFE } });
  for (const patch of [
    { GITHUB_REF: "refs/pull/10/head" }, { GITHUB_REF: "refs/pull/11/merge" },
    { GITHUB_REF: "refs/pull/010/merge" }, { GITHUB_REF: "refs/heads/main" },
    { GITHUB_SHA: fixture.head }, { GITHUB_SHA: "not-a-sha" }, { GITHUB_EVENT_PATH: "" },
  ]) rejectsWithoutIdentity(() => checkPublicAuthors({ ...fixture, env: { ...fixture.env, ...patch } }));
  for (const event of [
    {}, { ...fixture.event, number: "10" }, { ...fixture.event, number: 11 },
    { ...fixture.event, pull_request: { ...fixture.event.pull_request, number: 11 } },
    { ...fixture.event, pull_request: { ...fixture.event.pull_request, base: { sha: "bad" } } },
    { ...fixture.event, pull_request: { ...fixture.event.pull_request, head: { sha: fixture.base } } },
  ]) rejectsWithoutIdentity(() => checkPublicAuthors({ ...fixture, readEvent: () => event }));
});

test("one-parent, octopus, reordered and mismatched merges cannot masquerade as GitHub PR merges", t => {
  const fixture = pullRequest(t);
  const other = fixture.commit({ parents: [fixture.base] });
  for (const parents of [[fixture.head], [fixture.base, fixture.head, other],
    [fixture.head, fixture.base], [fixture.base, other]]) {
    const counterfeit = fixture.commit({ author: PRIVATE, parents });
    fixture.git(["checkout", "--quiet", "--detach", counterfeit]);
    rejectsWithoutIdentity(() => checkPublicAuthors({ ...fixture, env: { ...fixture.env, GITHUB_SHA: counterfeit } }));
  }
});

test("an unrelated real merge on a side ref is never exempted", t => {
  const fixture = pullRequest(t);
  const other = fixture.commit({ parents: [fixture.base] });
  const realMerge = fixture.commit({ committer: PRIVATE, parents: [fixture.base, other] });
  fixture.git(["update-ref", "refs/heads/real-merge", realMerge]);
  rejectsWithoutIdentity(() => checkPublicAuthors(fixture));
});

test("malformed event JSON, Git errors and malformed metadata never reveal private payloads", t => {
  const fixture = pullRequest(t);
  writeFileSync(fixture.env.GITHUB_EVENT_PATH, `{${PRIVATE}`);
  rejectsWithoutIdentity(() => checkPublicAuthors(fixture));
  rejectsWithoutIdentity(() => checkPublicAuthors({ ...fixture, git: () => { throw new Error(PRIVATE); } }));
  for (const raw of ["", `${PRIVATE}\0`, `${"a".repeat(40)}\0${SAFE}\0${SAFE}`,
    `${"a".repeat(40)}\0${SAFE}\0${SAFE}\0${"a".repeat(40)}\0${SAFE}\0${SAFE}\0`]) {
    rejectsWithoutIdentity(() => checkPublicAuthors({ env: {}, git: () => raw }));
  }
});

test("CLI success describes the exception; CLI errors are generic and never echo exception bodies", () => {
  const messages = [];
  const io = { stdout: value => messages.push(value), stderr: value => messages.push(value) };
  assert.equal(runCli({ ...io, check: () => ({ synthetic_merge_identity_exempted: true }) }), 0);
  assert.match(messages[0], /verified temporary PR merge metadata excluded/);
  assert.equal(runCli({ ...io, check: () => { throw new Error(PRIVATE); } }), 1);
  assert.ok(messages.every(value => !value.includes(PRIVATE)));
});
