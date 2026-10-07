# Night run report

作業ブランチ: `codex/night-run`（最新 `origin/main` から作成）

## 既存実装の確認

- #1: 仕様書とREADME参照で完了条件を満たす。変更なし。既存コミットはmain履歴参照。
- #10: 初期環境・scripts・環境変数例・起動手順を確認。変更なし。
- #11: Clerk認証・保護ルート・identity基準のUser同期・重複防止・手動設定手順を確認。変更なし。実サービス確認には人間のキー設定が必要。
- 検証: lint / typecheck / test 成功（17 tests）。

## 実装

- #9: データモデル・インデックス・所有者確認helper・User同期時のQuestionBox作成。
- #8: 共通最大幅・モバイル折り返し、ローディング・404・エラー境界、自分の質問箱リンク。既存認証保護を維持。
- #2: 公開プロフィール専用query（Clerk ID除外）、共有URLコピー、投稿フォームと一覧の土台、不存在時notFound。
