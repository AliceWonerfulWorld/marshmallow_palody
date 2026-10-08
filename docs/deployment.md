# 本番デプロイ手順

2026-10-08確認。対象はこのリポジトリのNext.js 16.4 / Clerk / Convex。
コードの準備とローカルproduction buildは完了。本番Dashboard変更・deploy・秘密値取得は未実施。

## Prerequisites

- GitHub PRをレビューし、必要な確認後に人間がmainへmergeする。
- Node.js 22.12以上の22系（`.nvmrc`）、npm、Vercel / Clerk / Convexへの人間の管理権限。
- 本番originを決める。Clerk Productionには所有ドメインとDNS設定が必要。`*.vercel.app`だけでは本番認証を構成できない。所有ドメイン未準備なら本番公開は保留し、独立した開発環境で受け入れ確認する。購入・DNS設定・課金をこのエージェントは行っていない。[Clerk本番前提](https://clerk.com/docs/guides/development/deployment/production)、[ConvexのVercel認証注意](https://docs.convex.dev/production/hosting/vercel#authentication)
- 環境ごとの対応を揃える: Production = Clerk Production + Convex Production。Preview / Development = 独立したClerk Development + Convex DevelopmentまたはPreview。Previewから本番DBへ接続しない。

## Environment variables

| 変数 | 設定先 | 用途・扱い |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel Production | Clerk Production公開キー（pk_live）。公開される値 |
| `CLERK_SECRET_KEY` | Vercel Production | 同じinstanceのサーバー専用秘密キー。公開prefix禁止 |
| `NEXT_PUBLIC_CONVEX_URL` | Vercel Production | Convex Production deployment URL（HTTPS）。ビルド時に埋め込まれる |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex Production環境変数 | Clerk ProductionのFrontend API URL。Nextの設定だけでは反映されない |
| `CONVEX_DEPLOY_KEY` | 任意: Vercel Productionのbuild | 自動backend deployを選ぶ場合のみ。Production deploy key、secret |
| `CONVEX_DEPLOYMENT` | ローカルのみ | convex devが設定。本番Vercelへコピーしない |

`.env.example` は名前のみ。実値はDashboardまたはGit対象外の環境ファイルへ人間が設定する。ログ、PR、IssueへキーやJWTを貼らない。設定変更後はVercelを再ビルドする。

## Clerk Production setup

1. Clerk Dashboardで対象アプリとProduction instanceを選ぶ。新規登録方法は部会に必要なものだけ有効にする。Developmentのユーザー・設定が自動移行するとは扱わず、本番でテストアカウントを作成する。
2. DomainsとDashboardの本番チェックリストを確認する。所有ドメインのDNS・証明書が必要なら人間が作業し、検証が完了するまで一般配布しない。新ドメイン購入・DNS変更は今回の自動作業の範囲外。
3. API KeysからProductionの公開キー・secretをVercel Productionへ設定する（同じinstanceの組）。Frontend API URLはConvexのissuerとして記録する。
4. Production instanceでConvex integrationを有効化する。JWTテンプレートを使う構成は名前とaudienceを`convex`にする。このコードのUser同期に必要な公開プロフィールclaimは `name: {{user.full_name}}`、`preferred_username: {{user.username}}`、`picture: {{user.image_url}}`。質問投稿者の情報をQuestionへ保存しない。[Convex公式Clerk設定](https://docs.convex.dev/auth/clerk)
5. 本番Web originとDashboardのDomains / Paths / 許可するorigin設定を整合させる。利用するサブドメインだけを許可する。サインイン `/sign-in`、サインアップ `/sign-up`、ログイン後 `/inbox` はコード側で設定済み。OAuthを使う場合は本番providerのcallback設定を確認する。ネイティブアプリ向けSSO redirect設定はこのWebアプリには不要。[Clerk本番設定](https://clerk.com/docs/guides/development/deployment/production)

## Convex Production setup

1. Convex Dashboardで対象team/projectを確認し、Production deploymentを選択・準備する。新規作成で契約や課金が必要になったら人間が判断する。
2. ProductionのEnvironment Variablesに`CLERK_JWT_ISSUER_DOMAIN`を設定。値は手順で記録したProduction Frontend API URL。`convex/auth.config.ts`はaudience `convex`とこのissuerで検証する。
3. 人間の認証済みCLIでプロジェクト・対象deploymentを再確認し、レビュー済みコードから `npx convex deploy` を実行する。開発用`CONVEX_DEPLOYMENT`があってもこのコマンドはプロジェクトのproductionを対象にするため、識別子を先に照合する。schema/index/functions/authと`convex/_generated`を同期する。生成ファイルに差分があればレビューし別の通常commitで反映する。[Convex環境別認証](https://docs.convex.dev/auth/clerk#configuring-dev-and-prod-instances)
4. Production URLをVercelの`NEXT_PUBLIC_CONVEX_URL`へ設定。開発データをコピー・削除する操作は不要。

## Vercel project setup

- 対象GitHub repositoryをImport、Framework PresetはNext.js、Root Directoryはリポジトリルート、Production Branchはmain。
- Node.jsは`.nvmrc`に合わせて22系を選択。Install Command `npm ci`、Build Command `npm run build`、Output DirectoryはNext.jsの既定値。`vercel.json`は不要。Server Actions / Proxyを使うためstatic exportにしない。[Vercel Next.js対応](https://vercel.com/docs/frameworks/full-stack/nextjs)
- Production scopeへ上表の3つのNext側変数を設定。Preview scopeへ本番secret/DB URLを流用しない。Clerk側と同じ本番ドメインを人間が設定・確認する。
- 自動Convex deployを採用する場合のみ、Production scopeの`CONVEX_DEPLOY_KEY`を人間が設定し、Build Commandを次に変更する。キーの対象deployment・deploy権限を確認する。これは本番backendを書き換えるため、エージェントは実行していない。

```bash
npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'
```

手動backend deploy方式ならこのoverrideは不要。以後もfrontendより先に互換性のあるbackendをdeployする。Previewの自動backend deployは独立Preview key・Clerk Development issuerの設定後に限る。[Convex Vercel連携](https://docs.convex.dev/production/hosting/vercel)

## First deployment

1. ローカルまたはCIで次を通す。秘密値なしでもコードのbuildは検証できるが、認証接続の成功を意味しない。

```bash
npm ci
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

2. 人間がClerkの本番準備、Convex Production設定・backend deploy、Vercel変数設定を完了する。
3. 人間がVercel Productionのdeployを開始。ログで成功を確認し、実際のHTTPS originで下記チェックを実施する。
4. 受け入れチェックを完了してから部会へURL/QRを配布する。本番キー未設定のまま配布しない。

## Post-deploy checks

- `/`、`/sign-in`、`/sign-up`、存在しない質問箱の404。未ログインの`/inbox`・`/settings`が保護される。
- 新規登録 → `/inbox` → User/QuestionBox各1件 → 再読み込み・再ログインで重複しない。
- 自分の質問箱のURL/QRが本番originを指す。別端末からQRを読め、ログインなしで質問できる。
- 初期承認制の質問は所有者だけに見える。公開切替、回答、非公開への戻しが別ブラウザへ反映される。
- 質問テーブルに投稿者のClerk ID / name / email / IP / clientIdがない（receiverUserIdは受信者）。公開queryはprivate Question/Answerを返さない。
- 320 / 375 / 390 / 430 / 1440pxで全主要画面、実機keyboard、Web Share、QR、長文、empty/loading/errorを確認する。
- `.next/static`やブラウザresponseにsecret/JWT/stack/internal DB情報がない。エラー本文は固定の利用者向け説明だけ。

詳細な実利用チェックリストは[acceptance-test.md](acceptance-test.md)を参照する。

## Troubleshooting

| 症状 | 確認すること |
| --- | --- |
| ログイン不可・質問箱利用不可 | Vercelの変数名/scope/再build、キーのinstance、Clerkのドメイン検証を照合。秘密値をブラウザに表示して調査しない |
| Clerkログイン後ずっと読み込み | ConvexのissuerがProductionと一致するか、integration/audience `convex`、backend deploy済みか、UserSync再試行を確認 |
| 別環境の質問が表示 | `NEXT_PUBLIC_CONVEX_URL`とキー・issuerの組を確認し、適切な環境へ再deploy。データを削除して解決しない |
| 共有URLが開発環境を指す | 本番ページを開き直して共有。originは閲覧中ページから生成する |
| コピー・共有できない | HTTPSと端末対応を確認。表示URLの手動コピーを利用 |
| Turbopackのport bindingエラー | 標準buildはbundled webpackを使用済み。`next build --turbopack`の失敗と区別する |
| frontendだけ戻したい | 人間がVercelで以前のdeployへ戻す。backendのデータ削除・schemaの破壊的rollbackはしない。古いfrontendと現backendの互換性を先に確認 |

## 今回の検証範囲

外部productionへ接続・deployしていない。キー値を読み出し・生成していない。一般公開を承認した状態ではなく、レビューとDashboard設定後に人間が最終接続検査を行う状態。
