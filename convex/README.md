# Convex

バックエンド関数とスキーマの配置先です。データモデルはIssue #9で実装します。

初回設定はプロジェクトルートで `npx convex dev` を実行し、Convexにログインして開発プロジェクトを選択・作成してください。生成される `convex/_generated/` はCLIで管理し、手書きしません。

CLIが `.env.local` に設定する `CONVEX_DEPLOYMENT`（CLIのデプロイ先識別子）と `NEXT_PUBLIC_CONVEX_URL`（アプリからの接続先）はローカル設定として保持してください。環境変数ファイルはGitの対象外です。
