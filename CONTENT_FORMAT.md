# Portable Fictional Content / 架空コンテンツ形式

`src/contentFormat.ts` defines version 1 of a data-only map and quest pack.
`src/fixtures.ts` validates the current village pack at startup. The private Game
has the same parser and contract tests, checked before a maintainer adapts content.

```json
{
  "schema": 1, "fictional": true,
  "places": [{ "id": "garden", "name": "Imaginary garden", "x": 0.2,
    "y": 0.3, "color": "#47a873", "quest": "grow" }],
  "quests": [{ "id": "grow", "place": "garden", "name": "Plant",
    "text": "Imagine a seed.", "action": "Plant a seed" }]
}
```

- Unique lowercase IDs; normalized coordinates between 0 and 1; six-digit hex colors.
- Maximum 32 places and 64 quests; names/actions up to 80 characters, narrative 1000.
- References must resolve. A place's quest must refer back to that place.
- Unknown fields, markup, URLs, scripts and authority fields are rejected.
- The fictional flag is a declaration, not a privacy/copyright audit. Review content
  and asset provenance separately. No Host identity, roles or booking rules belong here.
- The current Demo uses fixed IDs. Arbitrary new IDs require scene adaptation and tests;
  parsing a pack does not automatically make it playable.

Maintainer-only local comparison:

```sh
node scripts/check-content-compatibility.mjs /path/to/reviewed-game-checkout
```

Do not post private checkout paths or source in public PRs. Record reviewed commits
and actual check results only. Production adoption remains a separate PR, without
automatic import or deployment and with independent authorization/release tests.

## 日本語

地図とクエスト本文だけを共有する形式です。実在の利用者情報、Host の権限、
予約条件、API は含めません。参照 ID は一意にし、未知の項目や URL は拒否します。
`fictional` だけで個人情報・著作権の確認が済むわけではありません。
正式ゲームへの反映には管理者による独立した PR と動作確認が必要です。
