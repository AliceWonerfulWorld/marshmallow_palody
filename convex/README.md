# Convex

バックエンド関数とスキーマの配置先です。最小の `users` schemaとClerk identityを使用する同期関数を実装しています。質問箱・質問・回答テーブルはIssue #9で追加します。

初回設定はプロジェクトルートで `npx convex dev` を実行し、Convexにログインして開発プロジェクトを選択・作成してください。生成される `convex/_generated/` はCLIで管理し、手書きしません。

CLIが `.env.local` に設定する `CONVEX_DEPLOYMENT`（CLIのデプロイ先識別子）と `NEXT_PUBLIC_CONVEX_URL`（アプリからの接続先）はローカル設定として保持してください。環境変数ファイルはGitの対象外です。

Convex Dashboardの環境変数に `CLERK_JWT_ISSUER_DOMAIN` を設定します。Clerk Dashboardの連携・JWT設定を含む手順はプロジェクトルートのREADMEを参照してください。

`_generated/` はConvex CLIによる生成物で、キーなしの型チェック・CIに必要なためコミットします。今回の初期生成は未接続環境でCLIのローカル生成モードを使用しています。デプロイメント設定後は `npx convex dev` で再生成・同期してください。
