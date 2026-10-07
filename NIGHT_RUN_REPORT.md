# NIGHT RUN REPORT

実施日: 2026-10-08（Asia/Tokyo）
対象: AliceWonerfulWorld/marshmallow_palody
ブランチ: `codex/night-run`（開始時の最新origin/main `cd70b92`から作成）

## 完了したIssueとコミット

指定順で確認・実装した。#1・#10・#11は既存実装が完了条件を満たすため変更せず、不要なコミットを作成しなかった。新規実装はIssueごとに独立コミットにした。

| Issue | 結果 | commit SHA |
| --- | --- | --- |
| #1 | 既存仕様書とREADME参照を確認 | `057d78e`（既存） |
| #10 | 既存初期環境、scripts、設定例・起動手順を確認 | `7f090f2`（既存） |
| #11 | 既存Clerk認証、保護ルート、User同期・重複防止を確認 | `fbb872c`（既存） |
| #9 | データモデル・index・所有者helper・1User1QuestionBox | `a1cdf0f` |
| #8 | 最大幅付き共通UI、loading/404/error、自分の質問箱リンク | `c611bd7` |
| #2 | 公開プロフィールquery、共有URL、投稿・一覧UIの土台 | `f278186` |
| #3 | 匿名投稿、本文検証、モード別visibility、送信中ロック | `3765801` |
| #6 | 所有者限定Inbox・公開切替・確認付き削除、関連回答削除 | `d840be7` |
| #7 | 匿名ブラウザIDによる60秒3件のrate limit、本文validator、XSS対策 | `d9d662e` |
| #4 | 公開未回答reactive一覧・所有者限定モード設定 | `bc7dd6d` |
| #5 | 原子的回答保存・1対1・公開Q&A一覧・回答フォーム | `7642d89` |
| #15 | モバイル余白・44px操作領域・16px入力・長文折り返し | `9bef3df` |

## 未完了Issue

指定Issueのコード実装に未完了はない。実Clerk/Convex接続の手動確認と本番デプロイは実施していない。人間による環境設定後、下記の確認が必要。

## 最終検証

- `npm run lint`: 成功
- `npm run typecheck`: 成功（Next.jsルート型生成、アプリ・Convexのstrictチェック）
- `npm test -- --run`: 成功、9 files / 31 tests
- `npm run build -- --webpack`: 成功
- [GitHub Actions CI](https://github.com/AliceWonerfulWorld/marshmallow_palody/actions/runs/37656791996): `6437187` に対してnpm ci / lint / typecheck / test / 通常Turbopack buildすべて成功。ローカルのport制限はCIでは発生しなかった。
- `npm run build`: TurbopackのPostCSS処理でローカルポート作成が拒否され失敗。sandbox制限外での再試行も同じエラー。READMEに既存の回避手順がある。ソースの型・コンパイルはwebpackで検証済み。
- Chromeの代表状態: 320 / 375 / 390 / 430 / 768 / 1280pxで横スクロールなし。主要ボタン・ヘッダーリンク44px以上、textarea16px。長文・長いURL・回答フォーム・削除確認を含む。詳細: [mobile-validation](docs/mobile-validation.md)
- 認可、非公開データ除外、匿名保存、文字数境界、rate limit、XSS描画、重複回答、関連回答削除、送信中ロック・失敗時保持をテスト。
- `git diff --check`: 成功。追跡対象のenvファイルは `.env.example` のみ。追加内容に秘密値なし。

## 必要な環境変数

秘密値は生成・取得せず、既存の `.env.local` の内容を読み出していない。

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk公開キー
- `CLERK_SECRET_KEY`: Clerkサーバー専用キー
- `NEXT_PUBLIC_CONVEX_URL`: ConvexデプロイメントURL
- `CLERK_JWT_ISSUER_DOMAIN`: Convex側へ設定するClerk issuer URL
- `CONVEX_DEPLOYMENT`: `npx convex dev` が設定する開発デプロイメント識別子

## 必要な手動設定と確認

1. READMEの手順に従ってClerkの認証方法とConvex連携を設定する。JWTテンプレートを使う場合は名前/audienceを `convex` にし、name・preferred_username・picture claimを設定する。
2. Convexの開発環境に `CLERK_JWT_ISSUER_DOMAIN` を設定する。
3. `.env.local` へ人間が取得したキーとURLを設定し、`npx convex dev` でschema・関数・認証設定・生成APIを同期する。
4. 新規登録・再ログインでUser/QuestionBoxが1件だけ作成されることを確認する。
5. 別の未ログイン画面から匿名投稿、Inboxで公開切替・回答、公開一覧のリアルタイム反映を確認する。実Clerk標準画面と実機キーボードのモバイル表示も確認する。

本番Dashboard変更、課金、既存ユーザーデータ削除は行っていない。

## Pull Request

[PR #16: MVP: implement anonymous shared question box](https://github.com/AliceWonerfulWorld/marshmallow_palody/pull/16)

main向け1件を作成済み。全指定IssueのCloses行を記載。自動mergeは行っていない。

## GitHub操作

- mainへ直接コミット・pushしていない。force push・履歴rewrite・hard resetを使用していない。
- 全実装コミットをoriginの専用ブランチへ通常push済み。
- 全指定Issueへ確認・実装結果をコメント済み。途中のGitHub Internal Server Errorで失敗したpush/コメントは再試行して成功。
- Issueを手動でcloseしていない（#1・#10・#11は開始時からclosed）。

## 気になった点 / 技術的負債

- ブラウザIDの削除・変更でrate limitは回避可能。MVP仕様の限界。古い匿名IDのrate limit行の期限付き整理は将来課題。
- 公開Q&Aのページングは回答を新着順で読み、関連質問の公開状態をbackendで確認するため、非公開回答の多いページでは表示件数が少なくなる。続きは「回答をもっと読む」で取得可能。
- Convex CLI codegenは外部接続不能で失敗したため、追加APIモジュール型を既存生成ファイルの形式で更新した。実開発デプロイメントへ同期時に再生成すること。
- 実Clerk/Convex接続、実機キーボード、公開プロフィールの実HTTP 404は外部サービス設定後の手動確認事項。代表状態によるブラウザ検証とbackend/UIテストは完了。
- 既存README記載のESLint間接依存に関する警告は今回の変更対象外。
