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
- #3: 匿名投稿MutationとServer Action、trim後1〜1000文字の両側検証、箱から受信者を決定、モード別初期公開、送信中ロックと成功・失敗表示。
- #6: identity基準のInbox（新着順・ページング・状態フィルタ）、所有者限定公開切替と確認付き削除、関連回答の同時削除、回答導線。
- #7: 匿名ブラウザID（アカウント非連携）、Convex固定window 60秒3件、原子的カウントと投稿、共通本文validator、制限メッセージとREADMEの限界説明。生IP保存なし。
- #4: public AND unansweredのインデックスqueryとreactive一覧、所有者限定のモード設定。モード変更は新規投稿だけに適用、既存visibilityを保持。匿名閲覧用ConvexProviderを追加。
- #5: 所有者限定・1質問1回答の原子的保存、trim後1〜2000文字、回答時public/answeredへ遷移、Inbox回答フォーム、公開Q&Aのreactive一覧（回答作成日時順）。private・孤児Answerはbackendで除外。
