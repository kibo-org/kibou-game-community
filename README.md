# Kibou Game Community

An offline-first 3D PlayCanvas village for making rooms, quests and playful ideas.
All characters, applications and conversations are fictional and local to your
device. There are no real accounts, Hosts, bookings, uploads or production APIs.

## Join In

New to coding or GitHub? Start with [a ten-minute first change / はじめの10分](START_HERE.md).
You can also [ask for help without writing code](https://github.com/kibo-org/kibou-game-community/issues/new?template=help.yml).

You do not need an invitation or upstream write access. Start with an Issue,
Fork the repository into your own account, make a small change and open a PR.
Maintainers review the final revision before merging. External contributor CI
requires approval; a waiting workflow is not an error or a passing check.

Read [CONTRIBUTING.md](CONTRIBUTING.md), [COMMUNITY_TASKS.md](COMMUNITY_TASKS.md)
and the detailed [Japanese development guide](DEVELOPMENT_GUIDE_JA.md).
Source, documentation and contributions use English or Japanese.
Use a GitHub noreply commit identity; Issues, PRs and commit metadata are public.

## Run Locally

Node.js 22 or newer is required. Inspect the code before running unfamiliar changes.
Keep development separate from production credentials and personal files.

```sh
npm ci --ignore-scripts
npm run dev
```

Open http://127.0.0.1:5175. The server binds only to your own computer, with no
external tunnel. HMR is disabled; reload after changes. Noticeboard and Next step
provide access without precise movement. Mouse, touch and keyboard share actions.

```sh
npm run check:boundary
npm run typecheck
npm test
npm run build
```

PlayCanvas is pinned to 2.20.6. The independent lockfile pins the complete toolchain.
`--ignore-scripts` disables installation hooks, not execution of tests/build tools.
The large engine bundle is a known performance consideration; real iPhone Safari
and assistive-technology acceptance remain separate from source publication.
See [PUBLICATION_AUDIT.md](PUBLICATION_AUDIT.md) for actual checks and limitations.

## Make Something

- `src/fixtures.ts`: fictional places, house rules, dialogue and quest content.
- `src/world.ts`: original 3D primitive rooms, trees and fictional character.
- `src/scene.ts`: PlayCanvas lifecycle, camera, movement and interactions.
- `src/demoAdapter.ts`: local quest/application simulation, never real bookings.
- `src/contracts.ts`: contribution interfaces and bounded save schema.
- `src/style.css`: responsive layout and accessibility styling.
- `src/ui.ts`: plain-text DOM helpers and action error handling.

Begin with one agreed task. The demo stores only bounded fictional progress under
`kibou-community-fiction:v1`. Reset deletes that key only. Unreadable saves remain
untouched until an explicit successful reset. No names, emails, identity documents
or arbitrary chat messages are requested. Local approvals grant no real authority.

## Review Boundary

Fork -> contributor branch -> PR to main -> checks -> another maintainer's review
-> maintainer merge. Do not submit personal information, credentials, production
code/data or assets without licensed provenance. No contributor receives production
permissions. There is no automatic hosting or production deployment from this repo.
This repository must never be served inside an authenticated Website origin.

Reviewed changes may be adapted to the private formal Game through a separate PR;
see [PRODUCTION_ADOPTION.md](PRODUCTION_ADOPTION.md). Shared engines do not imply
shared identity, storage, authorization or automatic compatibility.

## Licensing

Software/documentation: MIT. Original artwork and fictional content listed in
ASSET_MANIFEST.json: CC BY 4.0. Dependency licenses are separate; brand rights
remain reserved. Read LICENSE, ASSET_LICENSE.md, THIRD_PARTY_NOTICES.md and BRAND.md.
Privacy or vulnerability reports go privately to the monitored contact in SECURITY.md.
