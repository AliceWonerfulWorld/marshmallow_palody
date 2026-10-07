# Release readiness run

実施日: 2026-10-08 / 作業ブランチ: `codex/release-readiness-run`
開始時working treeはclean。fetch、mainのpull --ff-only後に専用ブランチを作成。

## 進捗

- #20: UI共通tokens、ボタン・フォーム・カード・状態表示、トップCTA、Auth周辺、Inbox操作を整理。backend/schema/認証の変更なし。
- #19 / #17 / #18: 順番に着手予定。

## #20検証

lint / typecheck / 9 files・31 tests / webpack production build成功。
通常 `npm run build` はTurbopackのport bindingが実行環境に拒否され失敗（既存の環境制限）。
`git diff --check`成功。非公開除外・所有者認可・匿名保存の既存テスト成功。secret値を読み出し・追加していない。追跡envは.env.exampleのみ。

UI: 320 / 375 / 390 / 430 / 1440pxを想定してCSS構造を検査。今回DOMブラウザ接続なしのため目視未実施。詳細はdocs/mobile-validation.md。

## #19

共有導線: ヘッダーの既存リンク + 受信箱のOwnerGuide（3ステップ、質問箱リンク、共有操作）。
QR実装: qrcode.react 4.2.0（追加runtime依存1件、外部画像サービスなし）、SVG 240px・4 modulesの余白・白黒・M訂正。カード表示、閉じる/Escapeとfocus復帰。
URL: window.location.origin + encoded username、URLテキストを常時表示。Web Share非対応/失敗時copy fallback、キャンセルは状態を通知。
#20 commit: `ad4898f`（push/Issueコメント済み）。

#19検証: lint/typecheck/10 files・37 tests/webpack production build成功。通常buildはsandbox外でも同じport制限。非localhost originでURL/QR/Shareをテスト。セキュリティの既存backendテストも全成功、backend変更なし。

## #17

変更: docs/deployment.md、README、.env.example、package.jsonの標準webpack build、root provider障害用の固定文言global-error。
本番構成: Browser → Vercel Next.js + Clerk Production → Convex Production。Clerk Productionには所有ドメイン/DNS準備が必要（*.vercel.appのみでは不可）。DNS・購入・契約は行っていない。
必要変数: Vercel ProductionのNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY / NEXT_PUBLIC_CONVEX_URL、Convex ProductionのCLERK_JWT_ISSUER_DOMAIN。CONVEX_DEPLOY_KEYは任意の自動backend deploy専用。CONVEX_DEPLOYMENTはローカル専用。
手動作業: Clerk Production認証・ドメイン・証明書・Convex連携とclaims、Convex Production issuer/backend同期、Vercel環境変数と本番domain/deploy、実接続検査。詳細はdocs/deployment.md。
検証: npm ci / lint / typecheck / 37 tests / npm run buildすべて成功。Next標準のwebpackを使用しTurbopack環境制限を回避。localhostの固定共有URLなし。secretを取得/生成/コミットせず、公開queryと認可の既存テスト成功。
依存警告: npm auditでlint専用のbraces → micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-nextにhigh 5件（既存）。force fixやNext14へのdowngradeは行っていない。
#19 commit: `3be6958`（push/Issueコメント済み）。
