# Your First Change / はじめの変更

## English

No programming experience is required to suggest an idea. Use the
[help form](https://github.com/kibo-org/kibou-game-community/issues/new?template=help.yml)
if you get stuck. All Issues and PRs are public. Never paste tokens, private email
addresses, full logs, personal file paths or screenshots of other accounts.
`private: true` in package.json prevents accidental npm publishing; it does not
make your GitHub Fork private. No password or API key is needed to run this demo.

### Before Running Code

1. Fork this repository on GitHub. A Fork is your own copy; no invitation is needed.
2. Install Node.js 22 LTS and Git through their official distribution channels.
3. In GitHub Settings -> Emails, enable email privacy and copy your exact noreply
   address. In your clone, set `git config user.name YOUR_LOGIN` and
   `git config user.email YOUR_GITHUB_NOREPLY_ADDRESS`. Replace both placeholders.
   Verify them with `git config user.name` and `git config user.email` before committing.
4. Clone your Fork using its GitHub URL, enter its folder and create a branch:
   `git switch -c docs/my-first-change`. Inspect code before executing it.

### Ten-Minute Task

Choose a small wording improvement in `src/fixtures.ts`, and discuss it in an
Issue first so it does not overlap with a pending PR. Change ONE fictional quest's
`text` sentence. Keep IDs, dates, property names and quotation marks unchanged.
Do not introduce real people, URLs, personal contacts or external services.

```sh
npm ci --ignore-scripts
npm run dev
```

Open `http://127.0.0.1:5175`. Use Noticeboard to reach your quest, then refresh
after editing. Movement is optional. Stop the server with Ctrl+C when finished.
If port 5175 is busy, stop your own existing server; do not kill unfamiliar processes
or change the host to expose it to the network.

```sh
npm run check:boundary
npm run typecheck
npm test
npm run build
git diff -- src/fixtures.ts
git add -- src/fixtures.ts
git diff --cached
git commit -m "docs: clarify a fictional quest"
git push -u origin docs/my-first-change
```

On your Fork, choose Compare & pull request, with the base repository
`kibo-org/kibou-game-community` and base branch `main`. Explain your change and
which checks actually ran. A Draft PR is welcome when you want early feedback.
Waiting for maintainer CI approval is normal; it is not a failed or passed test.
Maintain the same PR when responding to feedback. A different maintainer must approve
before merge. Submitting a PR never updates the production Game automatically.

### Troubleshooting

- `npm ci` fails: check Node version with `node --version`. Do not use `sudo npm`,
  delete the lockfile or disable checks. Ask for help with a sanitized short error.
- Changes do not appear: save your file and reload. Hot reload is deliberately disabled.
- 3D is unavailable: use Noticeboard and Next step; the local simulation remains usable.
- Boundary check fails: review the named file. Do not remove the safety checker.
- A commit identity check fails: stop pushing; ask a maintainer how to correct history.
  Adding another commit does not hide the previous email. Never force-push upstream.
- A save cannot be read: it stays protected. Reset demo deletes only fictional progress;
  reset deliberately, not as a troubleshooting step that could lose wanted progress.
- Another tab changed the save: export progress first, then choose Load other tab save.
  Download original save preserves unreadable data as text. See [recovery and browser checks](BROWSER_ACCEPTANCE.md).

## 日本語

アイデアだけの参加も歓迎します。困ったら
[はじめ方の相談](https://github.com/kibo-org/kibou-game-community/issues/new?template=help.yml)
を使ってください。Issue と PR は誰でも読めます。Token、個人メール、端末のパス、
ログ全文、別アカウントの画面は載せないでください。

1. GitHub の Fork で自分用のコピーを作ります。招待は不要です。
2. Node.js 22 LTS と Git を公式の配布元から準備します。
3. GitHub の Settings -> Emails でメールを非公開にし、自分の noreply アドレスを確認します。
   clone の中で上の `git config` を自分の値に置き換えて設定します。
4. Fork を clone して作業用ブランチを作ります。詳しい手順は
   [開発ガイド](DEVELOPMENT_GUIDE_JA.md) の3〜5節を参照してください。
5. まず Issue で相談し、`src/fixtures.ts` の架空のクエスト説明を一文だけ改善します。
   ID、日付、項目名や引用符は変更せず、実在の人物・連絡先・外部サービスは追加しません。
6. 上の npm コマンドで確認します。告示板から目的の場所を開けるので、正確な移動は不要です。
   編集後はページを再読み込みし、終了時は Ctrl+C でサーバーを止めます。
7. 差分を読み、変更したファイルだけを commit・push して main 向けの PR を作ります。
   実施した確認と未実施の確認を正直に書きます。Draft PR で早めに相談しても大丈夫です。

CI の実行承認待ちは通常の状態です。別の管理者が確認してから merge し、本番ゲームには
自動反映しません。保存データが読めないときは上書きせず保護します。リセットは進捗を
削除するため、必要な場合だけ行ってください。安全チェックを削除したり、`sudo npm`、
外部公開、無関係なプロセスの終了で問題を回避せず、短い説明で相談してください。
