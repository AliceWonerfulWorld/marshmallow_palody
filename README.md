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

[http://localhost:3000](http://localhost:3000) を開くと、アプリ名と説明が表示されます。現在のトップページは外部サービスのキーが空でも起動できます。

## 外部サービスの設定

ClerkとConvexの依存関係は導入済みです。認証・ユーザー同期はIssue #11、データモデルはIssue #9で実装します。

- Clerk: Clerk Dashboardでアプリを作成し、`.env.local` の `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` と `CLERK_SECRET_KEY` に取得したキーを設定します。秘密キーはブラウザ側で使用しません。
- Convex: プロジェクトルートで `npx convex dev` を実行してログインし、開発プロジェクトを選択・作成します。CLIが設定する `NEXT_PUBLIC_CONVEX_URL` と `CONVEX_DEPLOYMENT` を `.env.local` に保持します。詳細は [convex/README.md](convex/README.md) を参照してください。

`.env.local` などの環境変数ファイルはGitの対象外です。`.env.example` には変数名と用途のみを記載し、秘密値をコミットしないでください。

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

`npm run typecheck` はNext.jsのルート型を生成してから型検証します。`npm test` のみで実行すると監視モードになります。`npm run start` は本番ビルド後に実行してください。

GitHub Actionsの [CI](.github/workflows/ci.yml) は、Pull Requestと `main` へのpush時に `npm ci`、lint、型チェック、テスト、本番ビルドを実行します。Node.jsのバージョンは `.nvmrc` に合わせ、外部サービスの秘密値は使用しません。

実行環境のポート制限によりTurbopackの本番ビルドが失敗する場合は、`npm run build -- --webpack` でビルドできます。

初期環境の依存関係では、Next.js公式ESLint設定のプラグインが対応するESLint 9を使用しています。インストール時にESLint 9のサポート終了警告と、lint用の間接依存 `braces` に由来する脆弱性警告が出ます。2026年10月8日の確認時点で `braces` の修正版は公開されておらず、対応版の公開後に更新が必要です。
