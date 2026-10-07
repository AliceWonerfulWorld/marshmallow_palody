# 部会前の受け入れテスト（#18）

所要目安10分。Clerk/Convex/Vercelの設定は[deployment.md](deployment.md)を先に完了する。
チェック欄は実施した人が記入する。未実施を成功として扱わない。

記録: 日時 ____ / commit ____ / origin ____ / ブラウザ・端末 ____ / 実施者 ____

用意: 所有者Aと別の所有者B、ログインしていないprivate window C。開発または独立Previewでテストする。本番で試す場合は、人間が自分の質問箱へ無害なテスト投稿を行う判断をする。この自動smokeは本番への投稿・削除を行わない。

## 0–2分: Scenario A アカウントと共有

- [ ] Aが新規登録でき、ログイン後に受信箱へ移動する。
- [ ] usernameがURLで使える形で生成され、自分の質問箱をヘッダー/受信箱から1〜2操作で開ける。
- [ ] 再読み込み・ログアウト/再ログインでUser/QuestionBoxが重複しない。Convex Dashboardで所有者の行数を確認する。
- [ ] URLコピー成功のfeedbackが出る。コピーしたURLは本番/検証中のorigin + `/u/<username>`。
- [ ] QRを別端末で読み取り同じ質問箱が開く。表示URLからも開ける。閉じる/Escapeでfocusが戻る。
- [ ] 対応スマホでは共有メニューが開く。非対応ではコピーにfallback。拒否・キャンセルにも説明がある。

## 2–4分: Scenario B 匿名質問 / C Inbox

- [ ] CからAの質問箱を開き、宛先・匿名性・公開される場合があることが理解できる。
- [ ] ログイン不要で質問を送り、成功表示とtextareaのクリアを確認する。
- [ ] 空白だけ・1001文字は送れない。1000文字は送れる。送信中は再投稿できない。失敗時は本文が残る。
- [ ] AのInboxに届き、BのInboxには混ざらない。未ログインの`/inbox`と`/settings`はログインへ誘導される。
- [ ] Aが公開/非公開を切り替えるとCの公開一覧へ反映される。
- [ ] 削除の確認をキャンセルすると残る。使い捨ての質問で削除を確定すると消える（本番の既存投稿は削除しない）。

## 4–6分: Scenario D 公開モード

Settingsで各モードへ切り替え、別々の新しい質問をCから投稿する。60秒で4件以上はrate limitになるため、必要なら1分待つ。

- [ ] public: 投稿直後からCの「みんなの質問」に表示される。
- [ ] approval: 投稿直後はAだけ見える。Aが「公開する」を選ぶとCに見える。
- [ ] private: 投稿直後はAだけ見える。回答すると公開Q&Aに出る。
- [ ] 設定変更で既存質問の公開範囲は一括変更されない。privateでもAが個別公開すれば見える（厳密な「回答まで絶対非公開」ではない）。

## 6–8分: Scenario E 回答 / F 匿名性

- [ ] Inboxから回答。公開される旨が表示される。空白・2001文字は不可、2000文字は可。
- [ ] 質問が未回答から外れ、回答済みに移る。Cの公開プロフィールに質問と回答が表示される。
- [ ] 回答後に非公開へ戻すとCのQ&Aから消える。使い捨て質問の削除では関連回答も消える。
- [ ] 公開UI/NetworkのQuestion/Answer payloadに**投稿者**のClerk ID / username / displayName / email / raw IP / anonymous clientIdがない。
- [ ] Convex DashboardのQuestion行も投稿者識別情報を保存していない。receiverUserIdは受信者、AnswerのauthorUserIdは回答者であり投稿者ではない。
- [ ] 所有者の公開プロフィールにusername/displayNameがあるのは仕様。これを投稿者情報の漏洩と混同しない。
- [ ] HTML風の質問が文字として表示され、スクリプトを実行しない。ブラウザエラー画面にstack/JWT/secret/内部DB詳細がない。

## 8–10分: Scenario G スマホ

375px前後の実機またはResponsive Design Modeで質問箱閲覧 → 投稿 → 公開一覧 → Q&A → Inbox → 回答を通す。

- [ ] 本文・改行・長いURLが読みやすい。textareaは16px以上、実機keyboardで入力しやすい。
- [ ] 主要操作は44px以上、focusが見える。削除確認・QRカードが画面内に収まり、横スクロールがない。
- [ ] `/`・`/u/<username>`・`/inbox`・`/settings`・`/sign-in`・`/sign-up`を320 / 375 / 390 / 430 / 1440pxでも確認する。
- [ ] loading / empty / error / 送信中 / 保存失敗も崩れない。長文の回答フォームとClerk標準UIも確認する。

不具合記録: 画面 ____ / 操作 ____ / 期待 ____ / 実際 ____ / 再現幅 ____
秘密値・JWT・個人情報をスクリーンショットや報告へ含めない。

## 自動テスト

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
npx playwright install chromium
npm run test:smoke
```

- Vitest/convex-test: 3モードの通しシナリオ、User重複防止、匿名保存、所有者認可、private除外、回答の原子的状態遷移、削除、validation/rate limit、XSS描画、共有fallback/focus、公開ページ・404・設定不足・安全なerrorを検証。
- Playwright: 秘密値を空にしたproduction build + ローカルNext server。`/`・sign-in/up・質問箱の設定不足表示・inbox/settingsの保護・HTTP 404を5 viewportで検証。横スクロール、CTA 44px、keyboard focusも確認。さらに実Reactコンポーネントの代表markup + 実production CSSで、本文あり公開箱/QR/Q&A・回答/削除を開いたInbox・Settings・loading/empty/error、16px入力・44pxボタンを5 viewportで検査。Clerk/Convexへの外部リクエストを許可しない。
- `test:smoke`は`.next`をkeyless設定で再buildする。実サービスのローカル接続へ戻る場合は通常のbuild/devを再実行する。既存serverの再利用を禁止し、別プロファイルのChromiumを使用する。
- CIは同じテストを秘密値なしで実行する。Playwrightが起動できない環境では、理由を記録してCI結果と手動viewport確認で補う。skipやassertion弱体化はしない。

Playwrightの[webServer](https://playwright.dev/docs/test-webserver)と[CI設定](https://playwright.dev/docs/ci-intro)に従い、検証用serverの起動とbrowserインストールを構成した。

## Production smoke（read-only）

```bash
npm run smoke:production -- https://your-production-domain
# または SMOKE_BASE_URLを環境変数へ設定して npm run smoke:production
```

指定originのGET `/`とGET `/sign-in`のみ。本文・cookie・秘密値は出力せず、HTTP statusを表示する。200–399を成功、400以上/接続失敗を失敗としexit code 1。リダイレクトは追跡しないため3xxは到達確認のみであり、転送先や認証成功は手動で確認する。HTTPSのoriginのみを受け付け、credentials/query/hash/path付きURLは拒否する。

本番URLが未確定の今回実行ではproduction smoke未実施。外部設定後、人間が実originへこのコマンドと上記チェックを実行してから配布する。
