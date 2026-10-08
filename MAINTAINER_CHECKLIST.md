# Maintainer Review And Publication

## Publication Gate

- Use a clean allowlisted export and new Git history with GitHub noreply identities.
- Scan every public branch, commit and public-facing record; review asset provenance.
- Verify current dependency audit, clean install, tests, typecheck and build results.
- Verify no accessible repository/organization Secrets, variables, deployment
  Environments or deploy keys. Community Actions must not access production systems.
- Keep Actions disabled through the visibility change. Apply/read back main branch
  protection and approval for all external contributors before enabling CI.
- Keep the existing private archive private; do not link old private PR metadata
  into public history. Do not change organization-wide private Fork settings.
- Inspect PUBLICATION_AUDIT.md. No public-hosted playable deployment is implied.

## Public Participation

Anyone may read, Fork, propose an Issue or submit a PR. No invitation or upstream
write permission is needed. Do not grant contributor Write/Maintain/Admin or
production/team membership to make contribution easier.

## Before Running Contributor Code

Inspect the agreed scope and every workflow, dependency, build configuration, test
and script change. Review personal data, credentials, URLs, executable HTML and
asset licenses as well as application behavior. Never run submitted code in a
workspace with real credentials or on a production/self-hosted runner.

Approval of CI execution is not approval to merge. Required reviews must cover the
final SHA; stale approvals are dismissed and the last pusher cannot approve their
own change. CODEOWNERS must include at least two verified maintainers so authors
can obtain another maintainer's approval. Do not bypass rules or fabricate checks.

## Merge And Adoption

Confirm all required checks, conversation resolution and one final CODEOWNER
approval. Merge using squash/rebase to preserve linear history; no force pushes.
Check the final public author identity before merging. Private email addresses or
private correspondence must not appear in commit metadata or PR descriptions.
Production adoption requires a separate PR and authorization/security review.

## Ongoing Review

Recheck Secrets/variables, collaborators, deploy keys, Actions settings and branch
protection periodically. Scanner results do not guarantee absence of all sensitive
data. On exposure, keep details private, revoke credentials and coordinate history
remediation. Do not upload raw audit logs or private API responses into this repo.
