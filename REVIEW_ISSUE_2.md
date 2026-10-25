# Garden Quest Review

Issue #2 scope: an original fictional seed-and-water activity. Choose one of two
predefined seeds, plant it, then water it. Planting alone does not complete the
quest. Watering records the existing grow completion flag through the local adapter.
Existing completed saves remain complete; no schema migration is needed.
Intermediate seed choice is deliberately not persisted and restarts on leaving
the Garden. Completed state follows the existing saved/session/protected status.

English/Japanese narrative is original community Demo content, credited in
ASSET_MANIFEST.json under CC BY 4.0; implementation code is MIT. No personal
data, new external assets, production interfaces or network calls were added.
Dependencies, workflows and permissions are unchanged.

Regression cases are included but not run. Build, typecheck, scans and browser
checks are not run. Maintainer acceptance must check both seed options, no
completion before watering, save/reload/reset, blocked storage, keyboard focus
after each step and mobile wrapping. Another maintainer must review the final SHA.
