# Browser Acceptance / ブラウザ確認

Build first. Use an already reviewed local Playwright installation with matching
Chromium installed. The script does not install packages or download browsers.

```sh
npm run build
node scripts/browser-acceptance.mjs /path/to/node_modules/playwright
```

The tool starts a preview on loopback port 5175 and refuses an occupied port.
Disposable contexts block non-local requests. Browser and server close in `finally`.
Never use a real account or profile. Fictional screenshots stay in a temporary directory.

Coverage: desktop/narrow touch portrait, horizontal overflow, actual canvas pixels,
keyboard/Escape, two-tab conflicts, reset protection, export downloads, fictional
Host acceptance/conversation, return navigation and WebGL fallback.
Chromium mobile emulation is not real iPhone Safari acceptance.
CI still runs unit tests/build. Browser acceptance is a separate explicit check
until maintainers approve a pinned dependency and browser installation policy.

## Save Recovery

- Existing v1 progress is readable; writes use a revisioned v2 envelope.
- UI mutations use Web Locks. Browsers without locks use session-only play.
- Storage events mark stale tabs as conflicted. Export current progress, then
  explicitly load the latest save. Conflicts block writes and reset without
  overwriting either the original disk save or this tab's in-memory progress.
- Protected raw data downloads as `.txt`; never execute or upload it.
- Reset writes an empty revisioned save, preventing stale tabs from restoring old
  progress. External deletion also triggers a conflict.
- Direct store consumers must acquire the same `STORAGE_KEY` Web Lock before
  write/reset. Version comparison alone is not an atomic cross-tab lock.
- Unsaved/conflicted sessions request standard leave confirmation. Mobile browsers
  may not display it; export progress rather than relying on this warning.

## 日本語

上のコマンドで確認します。追加の依存関係やブラウザは自動取得しません。
本機内の一時サーバーと架空データだけを使い、終了時に閉じます。
別タブの保存を検出したら、進捗をエクスポートし、必要なら最新の保存を
明示的に読み込みます。壊れた保存はテキストとして取得できます。
スマートフォン表示は模擬環境です。実機 Safari の確認は別途必要です。
