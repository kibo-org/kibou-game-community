# First Community Tasks

Choose one small idea, open an Issue and agree on scope before writing code. Tasks
are proposals, not claims that functionality or validation has already been finished.
Use the small-development-task form to record the goal, starting files, exclusions,
acceptance and risks. Keep one task per PR and describe real verification honestly.

| Task | Starting Point | Acceptance |
| --- | --- | --- |
| Write a fictional welcome | src/fixtures.ts | Original NPC text; no real identities or contact details; keep predefined replies |
| Design a 3D village room | src/world.ts | Original PlayCanvas primitive design; add/retain asset credit; no borrowed production assets |
| Improve Japanese wording | src/fixtures.ts, src/main.ts | Keep fictional/local-only labels clear; no external translation service at runtime |
| Improve keyboard navigation | src/main.ts, src/style.css | No mouse-only action or focus trap; describe actual checks, not assumed results |
| Suggest a tiny quest | Issue first | Explain the idea with fictional data; agree on bounded local state and interaction before implementation |

Non-code proposals are welcome. Maintainers can record acceptance details and invite
someone to implement them. Do not upload recordings/screenshots containing account
names, personal data, local paths or browser notifications.

For code changes: public Fork -> contributor branch -> upstream-main PR -> approved
CI -> another maintainer's final review -> maintainer merge. See CONTRIBUTING.md.
No invitation or upstream write permission is required. Submissions do not deploy
anything; external contributor CI requires maintainer approval before execution.
