# Vercel公開テスト環境（Issue #24）

2026-10-08、PR #27マージ済みmainから `codex/issue24-vercel-public-test` を作成して実施。

## 公開先とdeploy結果

- 公開URL: https://marshmallow-palody.vercel.app
- Team: Alice's projects（`alices-projects-7ef4ec3a`）
- プラン: Hobby。無料プランをAPIで確認。有料機能・ドメイン購入・DNS変更は実施していない。
- Project: `marshmallow-palody`
- GitHub repository: `AliceWonerfulWorld/marshmallow_palody`
- Production Branch: `main`
- Deploy対象commit: `9b94d23`（PR #27のmerge commit）
- Deployment ID: `dpl_DFh24hseVPBmX9mrhhzgientiaim`
- Deployment URL: https://marshmallow-palody-329fiker7-alices-projects-7ef4ec3a.vercel.app
- Vercel状態: Ready

VercelではProduction Deploymentという名称だが、これは部会向け公開テスト。Clerk・Convexの接続先はDevelopmentのままであり、正式Production運用ではない。

## Project設定

| 項目 | 設定 |
| --- | --- |
| Framework | Next.js |
| Root Directory | repository root |
| Node.js | 22.x |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | Next.js default |

既存Vercel projectがないことを確認して新規作成し、GitHubに接続した。環境変数はこのprojectのProduction scopeに次の3項目だけを設定した。

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk Development
- `CLERK_SECRET_KEY`: 同じClerk Development（Vercel sensitive設定）
- `NEXT_PUBLIC_CONVEX_URL`: Issue #23のConvex Development

Productionキー、`CONVEX_DEPLOYMENT`、`CONVEX_DEPLOY_KEY`は設定していない。値を文書・commit・Issueへ記載していない。Previewには認証・DB設定を追加していないので、Previewを実利用検査に使用しない。

`.vercel/`をGit除外へ追加。CLIを使う開発者のローカルproject連携情報をcommitしない。

## 検証

- ローカル `npm run build`: 成功（Development設定）。
- 遠隔deploy: mainのGit sourceから成功、Readyと安定URLへのaliasを確認。
- `npm run smoke:production -- https://marshmallow-palody.vercel.app`: 成功。GET `/`・`/sign-in`が200。
- `/sign-up`: HTTP 200。
- Chrome: ホームとClerkのログイン画面、Development mode表示を確認。
- ホームHTMLと参照JavaScript 12件を取得し、使用中のClerk secret文字列が含まれないことを確認（この限定した範囲の検査）。Convex Developmentの接続先を確認。
- GitHubログイン: 利用者によるOAuth承認後、`/inbox`への遷移と自分の質問箱リンクを確認。Clerk認証・Convex User/QuestionBox取得が成功。
- 公開質問箱: 未ログインGETでHTTP 200・匿名質問フォームを確認。応答にclerkUserId・receiverUserId・clientIdのフィールド名が含まれないことを限定確認。
- Inbox内の共有URLとQRカードのリンクが `https://marshmallow-palody.vercel.app/u/wazap` を指すことを確認。
- `npm test -- --run src/components/share-button.test.tsx`: 6テスト成功（コピー・共有のfallback・QR）。実端末のWeb Share・クリップボード内容・QR読み取りは未確認。

未ログインの単純なGETでは保護ルートが404になる応答を観測した。Clerk Developmentのブラウザ認証を含む遷移は実ログイン後に確認する。存在しない質問箱もNext.jsのストリーミング応答ではHTTP 200が返る場合があるため、HTTPステータスだけで404表示を判定しない。

## 残作業

Chromeの操作が反応しなくなったため、Settings表示とコピー・Web Shareの実操作は利用者へ確認を依頼中。Issue #25では別端末のQR読み取り・匿名投稿・公開切替・回答・非公開データの除外を含めて受け入れ検査を行う。

deploy・smoke・ログイン・Convex接続は確認済み。共有の実操作に関する最終確認が残っているため、Issue全体の完了はまだ確定していない。
