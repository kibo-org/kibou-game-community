# Contributing

Welcome! An Issue idea is as valuable as a code PR. Use English or Japanese and
read DEVELOPMENT_GUIDE_JA.md for step-by-step Japanese instructions.

## Public Fork Workflow

1. Choose a small task in COMMUNITY_TASKS.md and discuss scope in an Issue.
2. Fork into your own account. No invitation or upstream write access is needed.
3. Configure a public GitHub username and the noreply address shown in your GitHub
   email settings BEFORE committing. Personal emails are rejected by CI.
4. Clone your Fork and create a focused branch. Inspect unfamiliar code before
   running it in a workspace without production credentials.
5. Make only agreed changes and list actual checks, including checks not run.
6. Open a PR against `kibo-org/kibou-game-community:main`, using the PR template.
7. A maintainer inspects workflows/configuration before approving external CI.
   Respond to feedback on the same branch. Another maintainer reviews the final SHA.
8. A maintainer merges after required checks and approvals. Nothing auto-deploys.

Do not ask for upstream Write/Maintain/Admin just to submit a PR. Forks and all
submitted content/history are public. Never put private correspondence in them.

## Privacy

Use newly created fictional data, not real members or Hosts with renamed fields.
No legal names, addresses, schools, faces, account/document IDs, private messages,
bookings, production logs, credentials or environment files. No production clients,
external telemetry, account integrations, arbitrary network targets or uploads.
Use textContent for user-visible strings, never executable HTML.

If a commit contains a credential, stop and report privately through SECURITY.md.
Deleting the current file does not remove history or revoke an exposed credential.
Do not publicly post the credential or an unredacted scanner report.

## Rights And Attribution

Contribute only work you can license. Code/documentation use MIT; original artwork
and fictional narrative use CC BY 4.0. Record creator, source, license and required
credit in ASSET_MANIFEST.json. AI output does not automatically establish rights.
Brand use is governed separately by BRAND.md. Copyright stays with contributors.
Publish only an agreed pseudonym/GitHub handle, never a private legal identity.
Arrange guardian assistance when needed without submitting age or identity records.

## Checks And Permissions

Use the standalone lockfile and `npm ci --ignore-scripts`. Run check:boundary,
typecheck, tests and build. Relevant UI changes also need keyboard/mobile evidence
with fictional content. Do not claim a check passed if it was skipped or not run.

CI runs on disposable GitHub-hosted runners using pull_request, never privileged
pull_request_target or self-hosted production runners. Checkout credentials are not
persisted; the Token is read-only and no production Secrets or Environments exist.
Every external contributor requires maintainer approval to run CI. Installation
hooks are disabled, but repository tests/build configuration still execute code.
Review changed workflows, dependencies, scripts and tests before authorizing them.

## Without A Fork

Ideas/translations/assets can use Issue forms. A focused source-only patch is also
welcome after agreeing a private channel; maintainers inspect it as text and open
a reviewed PR. Never send a full repository, credentials or personal information.

## Formal Game Adoption

Production adoption is a separate review in the private Game. Do not carry local
simulated identity, approvals or storage assumptions into real authorization.
See PRODUCTION_ADOPTION.md; community contributors receive no production access.
