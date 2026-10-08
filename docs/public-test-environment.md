# 部会向け公開テスト環境（Issue #22）

独自ドメインを購入せず、Vercelの `*.vercel.app` + Clerk Development + Convex Developmentを使用する。正式なProduction運用ではなく、部会向けMVPの実利用テストとして扱う。Vercel側の「Production」scopeはホスティング先の区分であり、Clerk / ConvexのProduction instanceを意味しない。

継続利用時の独自ドメイン・Production移行は[本番デプロイ手順](deployment.md)を参照する。公開URLはIssue #24のdeploy後に確定する。

## Clerk Developmentの準備

1. Clerk Dashboardで対象アプリのDevelopment instanceを選ぶ。メールなど利用するサインイン方法が有効であることを確認する。
2. API keysでDevelopment publishable key（`pk_test_`）とsecret key（`sk_test_`）を人間が管理する。値はGit対象外の環境ファイルまたはサービスの環境変数にだけ保存し、Issue・README・commitへ記載しない。
3. Configure → Developers → IntegrationsからConvex integrationが有効であることを確認する。JWT templateを使用する場合は名前・audienceを `convex` とし、次のプロフィールclaimを設定する。

```json
{
  "name": "{{user.full_name}}",
  "preferred_username": "{{user.username}}",
  "picture": "{{user.image_url}}"
}
```

4. 同じDevelopment instanceのFrontend API URLを、Issue #23でConvex Developmentの `CLERK_JWT_ISSUER_DOMAIN` に設定する。`convex/auth.config.ts` はこのissuerと `applicationID: "convex"` を使用する。Next.jsの環境変数だけではConvex側へ反映されない。
5. Issue #24でVercelの公開テスト用環境に、同じDevelopment instanceの2つのClerkキーとConvex Development URLを設定する。通常の `npm run build` を使い、Production用の `npx convex deploy` やProduction deploy keyは使用しない。

コード側は `/sign-in`、`/sign-up`、ログイン後 `/inbox`、`ConvexProviderWithClerk`、認証完了後のUser同期を設定済み。実際の公開URLでのログイン・登録・再ログインはIssue #25で確認する。

## Developmentの制限

Clerk Developmentは100ユーザー上限があり、Developmentの表示やメール表記、共有OAuth設定、セッションの仕組みがProductionと異なる。ユーザーがProductionへ自動移行する前提にしない。部会の参加規模とサービスの無料枠を確認し、独自ドメイン購入・DNS設定・Production有効化・課金は今回行わない。

Clerk公式はホスト提供の `*.vercel.app` 等のPreview URLにDevelopmentキーを使用する方法を案内している。実URLでの利用可否はdeploy後の検査で確定する。

## 確認記録（2026-10-08）

| 項目 | 結果 |
| --- | --- |
| 起点 | PR #21マージ済みmain `93d8b27` |
| 作業ブランチ | `codex/issue22-clerk-development` |
| Clerk Developmentキー | ローカル設定の2キーのprefixがDevelopmentであることを値を出力せず確認。DashboardにもDevelopment publishable keyと伏せられた既存secret keyあり |
| Convex Development | ローカルの `CONVEX_DEPLOYMENT` はDevelopment識別子。遠隔の認証設定は未確認 |
| 認証コード | Clerkのパス・ログイン後遷移・Convex provider・issuer/audienceの設定あり |
| Clerk instance | Clerk Backend APIで `environment_type: development` を確認 |
| サインイン方法 | Clerkの公開環境設定でusername/password、GitHub・Google・Xの有効化を確認。登録はpublic。実ログインはIssue #25で検査 |
| Convex integration | Backend APIで既存の `convex` JWT templateとaudience、name・picture claimを確認。不足していた `preferred_username: {{user.username}}` を既存claimを保持して追加し、保存結果を確認 |
| 公開テスト方針 | Vercel URL + Clerk Development + Convex Developmentで確定 |
| 公開テストのdeploy | Issue #24で実施予定。今回未実施 |

Clerk側の準備は完了し、Issue #23へ進める。Issue #23では同じDevelopment issuerをConvexに設定してbackendを同期し、Issue #24では人間が管理するDevelopmentキーをVercelに設定する。Issue #25で実サービスの受け入れ検査を行う。既存キーの新規発行・ローテーションやProduction設定は行っていない。Dashboard設定ページが空白になったため、最終確認とclaim追加にはClerk公式APIを使用した。

## 公式資料

- [Clerkの環境別設定・Preview環境・Development制限](https://clerk.com/docs/guides/development/managing-environments)
- [ConvexとClerkの連携・環境別issuer](https://docs.convex.dev/auth/clerk)
