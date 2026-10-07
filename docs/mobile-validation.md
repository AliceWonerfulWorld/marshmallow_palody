# モバイル表示の検証（Issue #15）

2026-10-08、既存コンポーネントをTesting Libraryで描画した代表状態を一時HTMLに書き出し、実際のTailwind/PostCSS生成CSSを適用してローカルChromeで確認した。既存ブラウザプロファイル・秘密値・外部DBは使用していない。新しいE2E依存は追加していない。

| viewport幅 | トップ | 公開質問箱 | Inbox | Settings | 認証未設定表示 |
| --- | --- | --- | --- | --- | --- |
| 320px | 横スクロールなし | 同左 | 同左 | 同左 | sign-in / sign-upとも同左 |
| 375px | 横スクロールなし | 同左 | 同左 | 同左 | 同左 |
| 390px | 横スクロールなし | 同左 | 同左 | 同左 | 同左 |
| 430px | 横スクロールなし | 同左 | 同左 | 同左 | 同左 |
| 768px | 横スクロールなし | 同左 | 同左 | 同左 | 同左 |
| 1280px | 横スクロールなし | 同左 | 同左 | 同左 | 同左 |

確認した代表状態:

- 全ナビゲーションリンクとユーザーメニュー
- 長い表示名・username・自己紹介
- 長文質問・回答、改行のない長いURL
- 公開質問とQ&Aカード
- Inboxの公開切替・削除確認・開いた回答フォーム
- Settingsの公開モード選択
- 主要ボタンとヘッダーリンクの幅・高さは44px以上
- 質問・回答textareaのフォントは16px、画面内に収まる
- 375pxの公開ページ、390pxのInbox、1280pxのデスクトップを画像でも確認

フォームの送信中ロック・成功時クリア・失敗時保持は既存Vitest/Testing Libraryで検証した。

## 実環境での確認手順

READMEに従いClerk/Convexの開発環境を設定した後、ブラウザのResponsive Design Modeで上記の幅を指定する。自分の質問箱へ匿名投稿し、Inboxで公開切替・回答・削除キャンセルを操作する。別の未ログイン画面で公開一覧が再読み込みなしで更新されることを確認する。sign-in / sign-upのClerk標準UIを開き、フォームが画面内に収まることを確認する。

今回のブラウザ検証は代表データを使ったレイアウト検証であり、Clerkの実認証画面・Convex実接続・iPhone実機のソフトウェアキーボード表示は未検証。これらは人間による外部サービス設定後の確認事項である。

## Release readiness UI（#20）

320 / 375 / 390 / 430 / 1440pxを想定し、全主要画面のCSSとコンポーネント構造をレビューした。共通の最大幅・min-width:0・長文折り返し、16px入力、44px操作、折り返すボタン列、画面内の削除確認、Clerkカードのmax-widthを維持。回答フォームの操作列も折り返すよう修正した。focus-visible、label、文字によるstatus、reduced-motion対応を確認。loading / empty / errorにも共通の余白・背景を適用。

今回のブラウザ接続にはDOM操作対応のbrowser surfaceがなく、指定viewportの新デザインのブラウザ目視確認は未実施。前回#15の確認結果は今回の目視結果ではない。実Clerk画面を含め、設定後に上記viewportで再確認すること。

## 共有UI（#19）

同じ5 viewport想定で、URLのbreak-all、共有操作のflex-wrap、240px QRのmax-width:100%を構造レビュー。QRはモーダルではなく画面内カードのため、focus trapは不要。開くと閉じるへfocus、閉じる/Escapeでトリガーへfocusを戻す。URL・コピーも常に利用可能。コピー/共有の成功・失敗・非対応・キャンセル、QRへ渡すURLとfocus復帰は自動テストで確認。ブラウザ目視・カメラ読み取り・実Web Shareは環境設定後の手動確認事項。

## 最終受け入れ検査（#18）

#20/#19時点で接続できなかったブラウザ検査を、隔離Playwright Chromiumのキーなしproduction serverと代表markupで補完した。

| viewport | 実Next serverのトップ・Auth設定不足・公開箱設定不足・保護ルート・404 | 実コンポーネントの公開箱/QR/Q&A・Inbox・Settings・empty/loading/error |
| --- | --- | --- |
| 320px | 自動smoke成功、横スクロールなし | 実production CSSで成功、横スクロールなし |
| 375px | 同上 | 同上 |
| 390px | 同上 | 同上 |
| 430px | 同上 | 同上 |
| 1440px | 同上 | 同上 |

本文ありの代表状態は実Reactコンポーネントをテスト用Convex/Clerk doublesで描画し、生成したmarkupに実production CSSを適用。長い表示名・本文・URL、公開質問とQ&A、QRを開いたカード、回答フォームと削除確認を開いたInbox、公開モード選択、loading/empty/errorを確認した。textarea 16px以上、ボタン44px以上を自動検証。トップCTAのfocus-visibleも実ブラウザで検証。375px/1440pxの公開箱・Inbox・Settingsは画像を生成して目視確認した。

再現: `npx playwright install chromium` → `npm run test:smoke`。画像はGit対象外の`test-results/browser/`に生成される。実Clerk標準UI、実認証/Convex transport、実機keyboard、カメラ読み取り、ネイティブWeb Shareは代表markupでは検証できないため、[受け入れチェックリスト](acceptance-test.md)で人間が確認する。

最終CSSレビューで選択済みInbox filterのhover contrastを修正し、暗い背景と白文字が維持されることを5 viewportのbrowser smokeで検査した。
