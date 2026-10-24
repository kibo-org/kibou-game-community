import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FAILURE = "Public commit history requires GitHub noreply author and committer addresses and valid CI context. Configure your public identity and amend affected commits before submitting; do not print personal emails in CI.";
const SHA = /^[a-f0-9]{40}$/;
const permitted = (email) => /^[^\s@]+@users\.noreply\.github\.com$/i.test(email)
  || email === "noreply@github.com";

function runGit(args) {
  // Inspect original objects, not a local replacement or mailmap identity.
  return execFileSync("git", ["--no-replace-objects", ...args], {
    encoding: "utf8", timeout: 20000, maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function verifiedMerge(env, git, readEvent) {
  if (env.GITHUB_EVENT_NAME !== "pull_request") return null;
  const match = /^refs\/pull\/([1-9]\d*)\/merge$/.exec(env.GITHUB_REF ?? "");
  if (!match || !SHA.test(env.GITHUB_SHA ?? "") || typeof env.GITHUB_EVENT_PATH !== "string"
    || !env.GITHUB_EVENT_PATH) throw new Error(FAILURE);
  const event = readEvent(env.GITHUB_EVENT_PATH);
  const number = event?.number;
  const pr = event?.pull_request;
  const base = pr?.base?.sha, head = pr?.head?.sha;
  if (!Number.isSafeInteger(number) || number < 1 || String(number) !== match[1]
    || pr?.number !== number || !SHA.test(base ?? "") || !SHA.test(head ?? "") || base === head) {
    throw new Error(FAILURE);
  }
  const checkout = String(git(["rev-parse", "--verify", "HEAD^{commit}"])).trim();
  const topology = String(git(["rev-list", "--parents", "-n", "1", "HEAD"])).trim().split(/\s+/);
  if (!SHA.test(checkout) || checkout !== env.GITHUB_SHA || topology.length !== 3
    || topology[0] !== checkout || topology[1] !== base || topology[2] !== head) {
    throw new Error(FAILURE);
  }
  return checkout;
}

/** Validate every real public commit; only verified current GitHub PR merge identity is temporary. */
export function checkPublicAuthors({ git = runGit, env = process.env,
  readEvent = path => JSON.parse(readFileSync(path, "utf8")) } = {}) {
  try {
    const exempt = verifiedMerge(env, git, readEvent);
    // --all retains side refs; explicit HEAD retains detached checkout history.
    // Lowercase %ae/%ce intentionally inspect raw identities without mailmap.
    const raw = String(git(["log", "--all", "HEAD", "--format=%H%x00%ae%x00%ce", "-z"]));
    if (!raw.endsWith("\0")) throw new Error(FAILURE);
    const fields = raw.slice(0, -1).split("\0");
    if (!fields.length || fields.length % 3 !== 0) throw new Error(FAILURE);
    const seen = new Set();
    let checked = 0, observedExempt = false;
    for (let index = 0; index < fields.length; index += 3) {
      const [commit, author, committer] = fields.slice(index, index + 3);
      if (!SHA.test(commit) || seen.has(commit)) throw new Error(FAILURE);
      seen.add(commit);
      if (commit === exempt) { observedExempt = true; continue; }
      if (!permitted(author) || !permitted(committer)) throw new Error(FAILURE);
      checked++;
    }
    if (!checked || (exempt && !observedExempt)) throw new Error(FAILURE);
    return { checked_commits: checked, synthetic_merge_identity_exempted: observedExempt };
  } catch {
    // Git failures and malformed event payloads may contain private data.
    throw new Error(FAILURE);
  }
}

export function runCli({ check = checkPublicAuthors, stdout = console.log, stderr = console.error } = {}) {
  try {
    const result = check();
    stdout(result.synthetic_merge_identity_exempted
      ? "Public author metadata check passed: all real commits use GitHub noreply identities; verified temporary PR merge metadata excluded."
      : "Public author metadata check passed: GitHub noreply identities only.");
    return 0;
  } catch {
    stderr(FAILURE);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runCli();
}
