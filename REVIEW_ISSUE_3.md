# Panel Focus Review

Issue #3: focus the panel heading when opening, preserve the external trigger
across rerenders, and restore it on Close/Escape. Detached, hidden, inert or
disabled triggers fall back to the stable Next step navigation button.
Opening a different panel from outside navigation updates the return target.
Escape respects already-handled events and input composition.

The existing aside is non-modal. No modal role or Tab trap is introduced:
navigation stays usable with the panel open, with existing visible focus styles.
Native buttons preserve Enter/Space access. No dependencies, remote calls,
personal information or production integration were added.

Pure controller regression cases are included but not run; fake elements do not
prove browser accessibility. Build, typecheck, scans and browser tests are not
run. Before approval, check Tab/Shift+Tab, Enter/Space, Escape, panel rerenders,
navigation between panels, disconnected triggers, focus visibility and screen
reader heading announcements on desktop/mobile. Another maintainer must review
the final SHA before merge.
