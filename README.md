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
4. プロジェクトルートで `npx convex dev` を実行してログインし、開発プロジェクトを選択・作成します。初回に環境変数未設定のエラーが出る場合は手順3の設定後に再実行します。CLIが設定する `NEXT_PUBLIC_CONVEX_URL` と `CONVEX_DEPLOYMENT` を `.env.local` に保持します。`users` schema・関数・auth設定が正常に同期されたことを確認します。
5. `npx convex dev` を起動したまま、別ターミナルで `npm run dev` を実行します。本番ではClerk本番instanceに対応するissuerをConvex本番デプロイメントに設定し、Next.js側にも本番のキーとConvex URLを設定します。開発・本番のissuerを混在させないでください。

`.env.local` などの環境変数ファイルはGitの対象外です。`.env.example` には変数名と用途のみを記載し、秘密値をコミットしないでください。

## 認証とUser同期

- `/sign-in`・`/sign-up` はClerk標準UIを使用し、ログイン後は `/inbox` に遷移します。ヘッダーのユーザーメニューからログアウトできます。
- `/inbox`・`/settings` は `src/proxy.ts` のClerk認証と所有者用のサーバーレイアウトで保護します。キー未設定でも保護を解除しません。`/`・`/u/[username]` はログイン不要です。
- ClerkProviderの内側にConvexProviderWithClerkを配置し、Convexの認証完了後に `users.upsert` を呼びます。失敗時はエラー表示から再試行できます。
- Convexは検証済みidentityの `subject` をClerk User IDとして使用します。クライアントからユーザーIDやプロフィール情報を受け取らず、同じidentityは既存Userを更新します。usernameは初回作成後に維持します。
- usernameはClerk username、表示名、`user` の順でASCII英数字・ハイフンに変換します。衝突時は6文字のランダムsuffixを付けます。Clerk IDとusernameのインデックス検索・挿入を同一mutation内で実行し、並行実行の競合はConvexのトランザクション再試行で解決します。
- 今回のschemaは `users` のみです。受信箱・設定・公開URLの画面は最小限の骨組みで、質問箱・質問・回答テーブルや公開プロフィールの実装は後続Issueの対象です。

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

実行環境のポート制限によりTurbopackの本番ビルドが失敗する場合は、`npm run build -- --webpack` でビルドできます。

初期環境の依存関係では、Next.js公式ESLint設定のプラグインが対応するESLint 9を使用しています。インストール時にESLint 9のサポート終了警告と、lint用の間接依存 `braces` に由来する脆弱性警告が出ます。2026年10月8日の確認時点で `braces` の修正版は公開されておらず、対応版の公開後に更新が必要です。
