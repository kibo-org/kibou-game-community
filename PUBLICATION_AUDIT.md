# Pre-Publication Audit - 2026-10-07

## Scope

Source publication of the fictional offline PlayCanvas community repository, not
the Website, private formal Game, production database or a hosted playable release.
The owner approved source publication only after removing personal author emails.
An existing private repository is retained privately; its history/PR records and
logs are not imported into this replacement repository.

## Completed Before Publication

- Reviewed all eight source commits, the three unmerged task branches and original
  artwork/data/license manifests. No production history or assets were imported.
- Gitleaks 8.30.1 scanned all eight commits (224,743 bytes), all task branch histories,
  Issue/PR/comment text and four complete Actions logs: zero detected credentials.
- Reviewed source/configuration: fictional bounded saves, no production client,
  account/user uploads, arbitrary chat text, telemetry or external runtime URLs.
  CSP blocks connections, frames and form submission. Only local loopback development
  addresses appear; loopback is not a production server or user IP.
- Verified zero repository Secrets, accessible organization Secrets, Actions
  variables, deployment Environments and deploy keys in the source repository.
- Clean `npm ci --ignore-scripts` using the committed standalone lockfile passed.
  Current npm audit: zero known vulnerabilities. Vitest 4.1.11 ran sixteen tests;
  TypeScript 5.9.3 and Vite 6.4.3 production build passed.
- Found private author emails in source history. They are deliberately excluded
  by exporting only approved files into fresh Git history under a GitHub noreply
  identity. Personal addresses are not included in this report or public commits.
- Added ongoing public-author identity and SHA-verified Gitleaks history checks
  to CI. Contributor changes still require human privacy/license/code review.

## Final Source Checks And Server Evidence

The clean allowlisted replacement has fresh Git history. All three task changes
were recreated on separate branches, without importing commit metadata. Gitleaks
and author checks passed across main and all three branches. Main passed sixteen
tests; the welcome, garden and focus branches passed eighteen, twenty and twenty-two
tests respectively, plus each branch's typecheck, build and boundary checks.
Replacement repository Secrets, accessible organization Secrets, Actions variables,
Environments and deploy keys were each verified empty before publication.

Final record scan, public visibility, protected main, all-external-contributor CI
approval and real GitHub CI results are recorded in
[audit Issue #7](https://github.com/kibo-org/kibou-game-community/issues/7).
Publication is not complete until that record verifies the live gates. Configuration
JSON alone is not evidence of server-side enforcement. No raw API responses/logs
or personal email addresses belong in this public report.

## Limits

No independent penetration test or new real iPhone Safari/assistive-technology
acceptance was performed. Previously recorded emulated Chromium checks are not
claimed as new tests here. The approximately 1.95 MB engine bundle is a known
performance limitation. No application server remains running from this audit.
Scanner results and a static network boundary are not a guarantee that arbitrary
future contributor code is safe. Do not execute unfamiliar changes with credentials.

GitHub sees visitors' network IPs when they visit/clone the repository; source
publication cannot conceal a visitor's IP from GitHub. This offline demo does not
collect or transmit user IPs to a production service. Keep private data out of all
public Issues/PRs/attachments and use the private security contact for disclosures.
