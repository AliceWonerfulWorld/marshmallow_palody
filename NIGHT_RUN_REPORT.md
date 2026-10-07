# Release readiness run

実施日: 2026-10-08（Asia/Tokyo）
対象: AliceWonerfulWorld/marshmallow_palody
作業ブランチ: `codex/release-readiness-run`

開始時working treeはclean。originをfetch、mainをpull --ff-only後、最新mainから専用ブランチを作成。mainへの直接commit/push、force push、履歴rewriteは実施していない。

## 完了Issue

指定順の #20 → #19 → #17 → #18 を独立commitで実装。対象外Issueへの拡張なし。

| Issue | 内容 | commit SHA |
| --- | --- | --- |
| #20 | mobile-first UI、共通tokens・ボタン・フォーム・カード・状態表示、トップCTA、Auth周辺 | `ad4898f` |
| #19 | URLコピー、Web Share/fallback、QRカード、受信箱の初回ガイド、公開範囲の説明 | `3be6958` |
| #17 | 本番手順・環境変数、標準webpack production build、安全なroot error表示 | `747e786` |
| #18 | 10分の受け入れチェック、3モード通しシナリオ、ページ/validation/error、browser/production smoke | `726417f`（受け入れ整備） / `fd1aab3`（hover contrast修正） / `225fdd6`（CI環境調整） |

未完了Issue（コード・ドキュメント）: なし。
実Clerk/Convex接続・Production deploy・本番GET検査は人間の残作業。外部設定が完了した実利用確認を代替するものではない。

## 実装概要

- neutral base + 紫accent。CSS tokensを中心に既存Tailwindを維持し、巨大UI依存を追加せず本文と余白を整理。primary/secondary/danger、focus、16px入力、44px操作、reduced-motionを統一。
- 公開プロフィール→投稿→公開未回答→Q&Aの構造を維持。Inboxのfilter/危険操作、Settingsの選択、Auth周辺、loading/empty/errorを改善。
- 共有は`window.location.origin + /u/ + encodeURIComponent(username)`。localhost固定なし。qrcode.react 4.2.0のSVG 240px、4 modules余白、白黒/M訂正でローカル生成。URLとコピーを残し、閉じる/Escapeでfocus復帰。Web Share非対応/失敗はCopy、キャンセルも通知。
- 既存Headerリンクに加えて受信箱のOwnerGuideから自分の質問箱へ移動できる。参加者側にも匿名性と公開される場合を説明。
- 最終CSSレビューで選択済みInbox filterのhoverが淡色へ戻り白文字のcontrastを落とす問題を修正。#18の最小限UI修正としてhoverの背景/文字色をbrowser testへ追加。
- backend schema・認証・query/mutation挙動は変更なし。検証中に生成API型のhelper module参照と並び順の差分を検出し、公開APIの変化がないことをレビューして取り込んだ。

## 最終品質チェック

- `npm ci`: #17で成功（lockfile再インストール）。#18のPlaywright追加はnpm installでlockfile更新。
- `npm run lint`: 成功。
- `npm run typecheck`: 成功。Nextルート型生成、アプリ/Convexのstrict検査。
- `npm test -- --run`: 成功、15 files / 58 tests。
- `npm run build`: 成功。Next公式bundled webpackを標準に使用。
- `npm run test:smoke`: 成功、キーなしproduction build + 代表fixture生成 + Playwright 10 tests。
- `git diff --check`: 成功。
- 最新headのCI初回はUbuntu aptミラー低速（32.5MB/13分37秒）で15分job上限に達し、browser install中にtimeout。npm ci/lint/typecheck/test/buildは成功済み。全検査を維持したままCIをUbuntu 24.04へ固定し、job上限を20分へ調整して再検証。経緯はPRコメントに記録。
- [最終実装のGitHub CI](https://github.com/AliceWonerfulWorld/marshmallow_palody/actions/runs/37668087119): `225fdd6`でnpm ci / lint / typecheck / 58 tests / build / 10 browser smokeまで全step成功（2分4秒）。
- aptミラー低速でtimeoutした`a6505ae`も、[同一commitの再実行](https://github.com/AliceWonerfulWorld/marshmallow_palody/actions/runs/37665018572)で全成功（4分24秒）。テストを省略せず原因調査・再検証した。
- production smoke: 実本番origin未確定のため未実施。GET `/`・`/sign-in`だけを行うコマンドと8件のローカル自動検証を用意。

初期のTurbopack buildはローカルport binding制限で失敗し、sandbox外でも同じ原因だった。#17でサポート済みwebpack方式を標準コマンドにしたため、現在の`npm run build`は成功する。

## UI確認

320 / 375 / 390 / 430 / 1440pxで以下をChromium自動検査:

- 実Next server: `/`、sign-in/upの設定不足表示、公開質問箱の設定不足表示、inbox/settingsの保護、HTTP 404。
- 実Reactコンポーネント + テスト用Clerk/Convex doubles + 実production CSS: 本文あり公開箱・QR・Q&A、回答フォーム/削除確認を開いたInbox、Settings、empty/loading/error、所有者Header。
- 横スクロールなし、textarea 16px以上、ボタン44px以上。トップCTAのkeyboard focusを確認。
- 375pxと1440pxの公開箱・Inbox・Settingsのスクリーンショットを生成し、6枚を目視レビュー。画像はGit対象外`test-results/browser/`へ生成。再現方法はdocs/acceptance-test.md。

実Clerk標準UI・実機keyboard・カメラ読み取り・ネイティブWeb Share・実Convex realtime transportは未実施。詳細は[mobile-validation](docs/mobile-validation.md)。

## セキュリティ・匿名性

- private Question/Answerを公開queryから除外するテスト成功。
- 登録・同期→匿名投稿→Inbox分離→公開管理→回答→非公開→削除を3モードで通して検証。
- ログイン中の投稿でもQuestionに投稿者のClerk ID/name/username/email/IP/clientIdがないことを、許可フィールドの完全一致で検証。公開Question/Answer payloadにも投稿者情報なし。
- 認可は検証済みidentityと所有者判定。別所有者の回答等を拒否。client supplied userIdへ依存しない。
- HTML風の投稿はReactテキストとして描画。dangerouslySetInnerHTMLなし。
- page/root error、回答失敗で内部error/stack/digestを描画しないテスト成功。
- `.env.local`は追跡なし。追跡envは`.env.example`のみ。secret取得/推測/生成を行っていない。
- 公開bundleでsk_live/sk_test/Convex deploy keyのmarkerは0件。Clerk SDKには`CLERK_SECRET_KEY`という変数名の診断文字列があるが、値の埋め込みではない。実本番キー設定後にも公開response/bundleを人間が確認する。

## 必要な環境変数

| 設定先 | 変数 |
| --- | --- |
| Vercel Production | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL` |
| Convex Production | `CLERK_JWT_ISSUER_DOMAIN` |
| 任意のVercel自動backend deploy | `CONVEX_DEPLOY_KEY`（secret、Production scopeのみ） |
| ローカル開発のみ | `CONVEX_DEPLOYMENT` |

## 人間が行う残作業

1. PRをレビューする。自動mergeはしていない。
2. Clerk: Production instance、所有ドメイン/DNS/証明書、認証方法、Production keys、Convex integration、JWT claims/audience、origin/pathsを設定する。**Clerk Productionは*.vercel.appだけでは構成できない**。既存の所有ドメインがなければ本番公開前に人間が準備する（購入・DNS変更・課金は今回未実施）。
3. Convex: 正しいteam/projectのProductionへClerk Production issuerを設定し、レビュー済みコードでschema/functions/auth/生成APIをdeployする。開発・本番issuerを混ぜない。
4. Vercel: repository/Next.js/Node22/main、Production scopeの3変数、Clerkと整合する本番domainを設定してdeployする。Previewに本番キー/DBを流用しない。
5. 実originで`npm run smoke:production -- https://<production-domain>`を実行し、[約10分のacceptance checklist](docs/acceptance-test.md)を完了してから部会へ配布する。

具体的なDashboard順序・コマンド・切り分けは[deployment.md](docs/deployment.md)。本番Dashboardの変更、課金、本番データ削除、DNS変更、不明projectへのdeployは実施していない。

## 既知の制限

- 外部実認証・本番deploy未実施。ブラウザ代表fixtureは接続E2Eではない。
- production GET smokeは200–399の到達確認だけ。3xxの転送先・認証成功は手動で確認する。
- test:smokeは`.next`をキーなしで再buildするため、通常接続へ戻すには通常build/devを再実行する。
- 匿名browser IDの削除/変更でrate limitは回避可能。期限切れlimit行の整理、公開Q&Aページの非公開除外による件数減少は既存MVPの制限。
- npm auditのhigh 5件は既存lint間接依存のbraces → micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-next。破壊的force fix/Next14へのdowngradeは行っていない。修正版への更新は別途必要。

## Pull Request

[PR #21: Release readiness: polish UI, sharing, deployment, and acceptance tests](https://github.com/AliceWonerfulWorld/marshmallow_palody/pull/21)

main向け1本を作成済み。Closes #20 / #19 / #17 / #18を記載。全Issueへcommitと検証結果をコメント済み。全実装をoriginの専用ブランチへ通常push済み。PR作成前の最終lint/typecheck/58 tests/buildとgit status/logも確認し、working treeはclean。CIの結果はPRのChecksから確認できる。自動mergeなし。
