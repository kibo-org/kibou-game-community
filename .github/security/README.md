# Public Contribution Controls

These files describe desired GitHub settings. Only an administrator applying them
and inspecting API readback establishes enforcement. Never store administrator
credentials in this repository or in its Actions settings.

Publish only after the documented privacy gates pass. Keep Actions disabled while
changing visibility; configure and read back `main` protection and all-external
contributor workflow approval before enabling CI. Do not change organization-wide
private Fork policy. Public Forks do not grant upstream write access.

- `main-protection.json`: one CODEOWNER approval, last-push approval, stale review
  dismissal, up-to-date offline-community check, admin enforcement, linear history,
  conversation resolution, no force pushes or branch deletion.
- `actions-permissions.json` and `selected-actions.json`: reviewed SHA-pinned
  checkout and setup-node only.
- `workflow-permissions.json`: read-only default Token; no automated PR approval.
- `public-fork-approval.json`: maintainer approval for every external contributor.
- `repository-participation.json`: Fork/Issue participation, no automatic merge.

Audit repository and accessible organization Secrets, variables, deployment
Environments, deploy keys, collaborators and workflow logs before publication.
No production deployment belongs here. CI does not upload build artifacts.
Keep personal metadata and administrator API responses out of public reports.
