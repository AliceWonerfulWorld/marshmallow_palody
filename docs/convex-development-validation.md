# Convex Development公開テスト準備（Issue #23）

2026-10-08に、PR #26マージ済みmain `a596017` から `codex/issue23-convex-development` を作成して実施した。

## 使用する既存環境

- Team: `gomaazarasi1789`
- Project: `marshmallow-palody`
- Development deployment: `cool-monitor-583`（CLIでもDevelopment表示を確認）
- Dashboard: https://dashboard.convex.dev/d/cool-monitor-583
- Vercelへ設定する `NEXT_PUBLIC_CONVEX_URL`: `https://cool-monitor-583.ap-southeast-2.convex.cloud`

このURLは公開クライアント用の接続先であり、秘密キーではない。今回の部会向け公開テストはClerk Development + Convex Developmentを使う。正式運用時はProduction DBへ分離する。

## 設定・同期結果

- 既存ローカル設定のDevelopment識別子・接続先・projectを照合し、新規projectを作成していない。
- Clerk Development publishable keyから対応するDevelopment issuerを導出し、Convex Developmentの `CLERK_JWT_ISSUER_DOMAIN` に設定した。値はこの文書・Gitに保存していない。
- 遠隔環境変数を再取得してClerk Development issuerとの一致を確認した。環境変数値や認証用secretはログへ出力していない。
- `npx --no-install convex dev --once --typecheck enable --tail-logs disable` が成功し、`Convex functions ready!` を確認した。schema・index・関数・`convex/auth.config.ts`を同期し、生成APIも再生成した（追跡ファイルの差分なし）。
- 認証設定は `applicationID: "convex"` と上記issuerを使用する。実ユーザーのJWTでのログイン・User同期はIssue #25の受け入れ検査で確認する。
- 同期後の `npm test -- --run` は15ファイル・58テスト成功。`git diff --check` も成功。

## 遠隔環境の読み取り検証

`convex function-spec` で12関数のmetadataを確認した。

| モジュール | 関数 |
| --- | --- |
| users | upsert, current |
| profiles | byUsername |
| boxes | current, setMode |
| questions | submit, inbox, setVisibility, remove, publicUnanswered |
| answers | create, publicAnswered |

`convex run --inline-query` の読み取り専用queryで、次の5テーブル・8indexへのアクセス成功を確認した。取得した文書の本文・ユーザー情報は返さず、利用可否だけを出力した。mutationやテストデータの追加・削除は行っていない。

| テーブル | 確認したindex |
| --- | --- |
| users | by_clerk_user_id, by_username |
| questionBoxes | by_owner_user_id |
| questions | by_receiver_status_created, by_box_visibility_status_created |
| questionRateLimits | by_box_client |
| answers | by_question_id, by_author_created |

## 後続の作業

Issue #24でVercel公開テスト環境へ上記URLと同じClerk Development instanceのキーを設定し、Frontendをdeployする。Vercelの環境変数を変更したら再buildする。Convex Production deploy keyや `npx convex deploy` は今回の構成では使用しない。

Issue #25で実際の公開URLにおける登録・再ログイン・匿名投稿・Inbox・回答・公開切替の反映を確認する。今回の検証はバックエンドの設定・同期・読み取りを対象とし、この実利用検査の代わりにはならない。

Productionへの変更、Developmentデータ削除、データ移行、課金操作は実施していない。

- [Convex CLI公式資料](https://docs.convex.dev/cli/overview)
- [ConvexとClerkの連携](https://docs.convex.dev/auth/clerk)
