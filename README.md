# marshmallow_palody
マシュマロの代替アプリ

MVPの仕様・実装方針は [プロダクト仕様書](docs/product-spec.md) を参照してください。

## ローカル起動

Node.js 22.12以上の22系、または24系・26以上とnpmを使用します。`.nvmrc` はNode.js 22系を指定しています。

```bash
npm install
cp .env.example .env.local
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くと、アプリ名と説明が表示されます。キーが空でも公開ページは起動できますが、ログインや認証必須ページの利用には以下の設定が必要です。

## 外部サービスの設定

1. Clerk Dashboardでアプリを作成し、サインイン方法（メールなど）を有効にします。`.env.local` の `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` と `CLERK_SECRET_KEY` に取得したキーを設定します。
2. Clerk DashboardのIntegrationsからConvex連携を有効化します。JWTテンプレートを使う構成では、Convex用テンプレートの名前を `convex`、audienceを `convex` にします。公開プロフィール用に `name: {{user.full_name}}`、`preferred_username: {{user.username}}`、`picture: {{user.image_url}}` のclaimを設定します。ユーザー名・氏名がない場合も同期でき、メールはUserに保存しません。設定の最新手順は [Convex公式Clerk統合ガイド](https://docs.convex.dev/auth/clerk) を参照してください。
3. ClerkのFrontend API URL（`https://….clerk.accounts.dev` など）をコピーし、Convex Dashboardの開発デプロイメントの環境変数に `CLERK_JWT_ISSUER_DOMAIN` として設定します。`.env.example` にも変数名を記載していますが、**Next.jsの `.env.local` だけに設定してもConvexには反映されません**。
4. プロジェクトルートで `npx convex dev` を実行してログインし、開発プロジェクトを選択・作成します。初回に環境変数未設定のエラーが出る場合は手順3の設定後に再実行します。CLIが設定する `NEXT_PUBLIC_CONVEX_URL` と `CONVEX_DEPLOYMENT` を `.env.local` に保持します。全schema・関数・auth設定が正常に同期されたことを確認します。
5. `npx convex dev` を起動したまま、別ターミナルで `npm run dev` を実行します。本番ではClerk本番instanceに対応するissuerをConvex本番デプロイメントに設定し、Next.js側にも本番のキーとConvex URLを設定します。開発・本番のissuerを混在させないでください。

`.env.local` などの環境変数ファイルはGitの対象外です。`.env.example` には変数名と用途のみを記載し、秘密値をコミットしないでください。

## 認証とUser同期

- `/sign-in`・`/sign-up` はClerk標準UIを使用し、ログイン後は `/inbox` に遷移します。ヘッダーのユーザーメニューからログアウトできます。
- `/inbox`・`/settings` は `src/proxy.ts` のClerk認証と所有者用のサーバーレイアウトで保護します。キー未設定でも保護を解除しません。`/`・`/u/[username]` はログイン不要です。
- ClerkProviderの内側にConvexProviderWithClerkを配置し、Convexの認証完了後に `users.upsert` を呼びます。失敗時はエラー表示から再試行できます。
- Convexは検証済みidentityの `subject` をClerk User IDとして使用します。クライアントからユーザーIDやプロフィール情報を受け取らず、同じidentityは既存Userを更新します。usernameは初回作成後に維持します。
- usernameはClerk username、表示名、`user` の順でASCII英数字・ハイフンに変換します。衝突時は6文字のランダムsuffixを付けます。Clerk IDとusernameのインデックス検索・挿入を同一mutation内で実行し、並行実行の競合はConvexのトランザクション再試行で解決します。
- User同期時に、所有者ごとのQuestionBoxを1件だけ準備します。初期公開モードは `approval` です。質問・回答・rate limitのschemaと関数も `npx convex dev` で同期してください。

手動確認: 未ログインで `/inbox`・`/settings` にアクセスしてログインへ誘導されること、`/u/test` が表示されることを確認します。Clerkで新規登録・ログイン後、Convex Dashboardの `users` に対応Userが1件だけあることを確認し、再読み込み・再ログインでも増えないことを確認します。ユーザーメニューでログアウトし、認証必須ページへ再アクセスできないことも確認してください。

## 構成

- `src/app`: App Routerのページ・レイアウト・グローバルCSS
- `src/components`: 共通コンポーネント
- `src/lib`: 共通処理
- `src/types`: 共通型定義
- `src/test`: Vitestのセットアップ
- `convex`: バックエンド関数・スキーマの配置先

TypeScriptはstrictを有効化しています。Tailwind CSSはPostCSS経由で使用し、テストにはVitest・React Testing Libraryを使用します。

## 検証と本番ビルド

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm run start
```

`npm run typecheck` はNext.jsのルート型を生成してから、アプリとConvexそれぞれの設定で型検証します。`npm test` のみで実行すると監視モードになります。`npm run start` は本番ビルド後に実行してください。

GitHub Actionsの [CI](.github/workflows/ci.yml) は、Pull Requestと `main` へのpush時に `npm ci`、lint、型チェック、テスト、本番ビルドを実行します。Node.jsのバージョンは `.nvmrc` に合わせ、外部サービスの秘密値は使用しません。

`npm run build` はNext.jsがサポートするwebpack production buildを使用します。TurbopackのPostCSS処理がローカルport binding制限で失敗する環境でも、同じ標準コマンドで検証・デプロイできます。Turbopackを検査する場合は `npx next build --turbopack` を使用してください。

初期環境の依存関係では、Next.js公式ESLint設定のプラグインが対応するESLint 9を使用しています。インストール時にESLint 9のサポート終了警告と、lint用の間接依存 `braces` に由来する脆弱性警告が出ます。2026年10月8日の確認時点で `braces` の修正版は公開されておらず、対応版の公開後に更新が必要です。

## 匿名投稿の荒らし対策

質問はtrim後1〜1000文字に制限し、Reactのテキストとして表示します。初回投稿時にブラウザへランダムな匿名clientIdを保存し、Convexで「同じclientId + 同じ質問箱」ごとに60秒の固定window内3件まで許可します。制限の確認・カウント更新・質問作成は同一transactionです。clientIdをClerkアカウントに紐付けず、questionsへ保存せず、生IPも保存しません。

ブラウザストレージの削除や別clientIdの利用で回避できる最低限のMVP対策です。ストレージが使えない場合はページのセッション内だけIDを保持します。将来はTurnstile等を検討できますが、今回外部サービスは追加しません。rate limit行はbox/client単位で再利用されます。古い匿名IDの行を期限付きで整理する運用は今後の課題です。

## MVPの使い方

ログイン後、ヘッダーの「自分の質問箱」から公開ページへ移動し、「質問箱のURLをコピー」で共有できます。投稿者はログイン不要です。匿名質問はtrim後1〜1000文字、回答は1〜2000文字です。

Settingsで公開・承認制・非公開を選べます。変更は今後の質問の初期公開状態にだけ適用し、既存質問を一括変更しません。Inboxでは自分宛ての質問を未回答・回答済みに分けて確認し、個別に公開・非公開を変更できます。削除には確認があり、対応する回答も削除されます。回答すると、質問と回答が公開されます。公開したくない内容には回答せず、非公開のまま管理してください。回答後でもInboxで非公開に戻せます。

公開ページの「みんなの質問」と回答済みQ&AはConvexのreactive queryで更新します。公開queryはバックエンドで非公開質問を除外し、回答一覧は回答の存在と対応する公開質問を確認します。Inboxは質問の新着順、公開Q&Aは回答の新着順で、いずれもページングします。

スマートフォン表示の検証範囲と実環境での確認手順は [モバイル検証記録](docs/mobile-validation.md)、各Issueのコミットと最終結果は [Night run report](NIGHT_RUN_REPORT.md) を参照してください。

## 部会で質問を募集する

1. ログイン後の受信箱で「自分の質問箱を開く」を選びます（ヘッダーからも移動できます）。
2. URLをコピー、端末の共有メニュー、または「QRコードを表示」で参加者へ共有します。QRカード内にもURL・コピー・閉じるがあり、QRを読めなくても利用できます。
3. 参加者はログインなしで質問を送信します。所有者は受信箱で確認・公開・回答します。初期設定は承認制です。回答すると質問と回答が公開されます。

共有URLは閲覧中のoriginから生成します。開発環境で共有したQRは開発環境を指すため、部会では本番URLを開いて共有してください。Web Share非対応・失敗時はコピーへ切り替え、コピーも利用できない場合は表示URLを手動で選択できます。

本番公開の前提・環境変数・Dashboard手順は [デプロイ手順](docs/deployment.md) を参照してください。Clerk Productionには所有ドメインの設定が必要です。

## 部会前の受け入れ検査

[約10分のチェックリスト](docs/acceptance-test.md)で登録・共有・匿名投稿・Inbox・公開モード・回答・匿名性・スマホを確認します。

```bash
npx playwright install chromium
npm run test:smoke
npm run smoke:production -- https://your-production-domain
```

ブラウザsmokeは明示的にキーなしでproduction buildし、外部DBへ接続しません（実サービス接続へ戻すときは通常build/devを再実行）。本番smokeはGET `/` と `/sign-in`だけを確認し、投稿・削除はしません。
