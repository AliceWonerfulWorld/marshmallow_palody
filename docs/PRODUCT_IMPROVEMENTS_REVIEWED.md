# 精査済みプロダクト改善レポート

## 1. エグゼクティブサマリー

2026-10-14（Asia/Tokyo）、HEAD `71d31d14a02b995017948efb227551547e003795`、作業ブランチ `chore/register-roadmap-issues-20261014`。第1段階は`9210259`対象だが、現在HEADで23件を再検証した。ソース・設定・既存テストを変更せず、GitHub読み取りとMarkdown設計だけを行った。

Critical 0。回答新着順とprivate回答管理、公開範囲説明を優先する。連投防御は回避可能性が明確でも既存MVP仕様が許容するためEnhancementとした。共有設定競合は実2タブ未実施でもuseStateと全項目patchから上書き経路が成立しConfirmedへ変更した。外部tokenログはNeeds Verification。MT-001/002は未解決だが既存Open Issueへ集約しDuplicateとした。

## 2. 検証対象・検証方法

対象: src/app・src/components・src/lib、Convex全mutation/queryとschema/認可、関連テスト、README/product-spec/acceptance/mobile/deployment/環境記録、package/lock、CI・smoke scripts。関数と分岐を追い、入力→認可→保存→取得→表示を照合した。根拠行は現在HEADで取得し、各項目に再現条件・限界・影響/回帰を記した。Next 16.4同梱error.mdのretry APIも確認し、旧API知識で誤判定していない。

GitHub: `gh issue list --state all --limit 1000 --json number,title,body,state,url,labels`で全26件（Open 2: #25/#34、Closed 24）を取得し、タイトルだけでなく本文の目的・スコープ・完了条件を比較。既存ラベル10種を読み取り、候補にはその集合のみ使用。GitHubの作成/更新/コメントは0件。

| 今回の検証 | 結果と限界 |
| --- | --- |
| `npm test -- --run` | 25ファイル・108テスト成功。mock/convex-testであり実Clerk JWT/遠隔DB成功を示さない |
| `npm ls braces --all` | eslint-config-next→@next/eslint-plugin-next→fast-glob→micromatch→braces 3.0.3 |
| `npm audit --json` | 終了1、High 5/Critical 0、同一GHSA経路。修正せず診断結果として扱った |
| 静的コード/仕様照合 | 全23項目の対象存在・分岐・index・表示・関連契約テストを確認 |
| build/lint/typecheck/browser smoke | 今回再実行していない。第1段階の成功は履歴としてのみ扱う。コード変更なしのため全build再実行をレビュー成立条件にしない |

脆弱性根拠は[GitHub Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)を2026-10-14再確認（<=3.0.3、修正版未掲載）。監査のHigh値をプロダクト優先度へ直結させず、公開入力到達は未確認とする。

## 3. 検証結果の集計

各IDに主分類を1つだけ付け、既存Issue重複をDuplicateとして集計した。Duplicateでも指摘事実が有効な場合は理由へ明記した。

| 分類 | 件数 |
| --- | ---: |
| Confirmed | 10 |
| Needs Verification | 1 |
| Resolved | 0 |
| False Positive | 0 |
| Duplicate | 2 |
| Enhancement | 10 |
| 合計 | 23 |

新規Issue候補: 21件 = Confirmed 10 + Enhancement 10 + 検証用1。既存Issue再利用対象は2項目で、MT-001/MT-002を#34中心に扱う。21件は登録数ではない。任意のrefactor1件と需要調査3件も含むがLowとして後回しにする。

## 4. 有効な改善点一覧

全23件の追跡表（無効/重複/追加検証も落とさない）。

| ID | 分類 | 再評価優先度 / 工数 | Issue方針 |
| --- | --- | --- | --- |
| [FE-001](#fe-001) | Confirmed | Medium / M | 新規候補（未登録） |
| [FE-002](#fe-002) | Confirmed | Medium / M | 新規候補（未登録） |
| [FE-003](#fe-003) | Enhancement | Low / M | 新規候補（未登録） |
| [BE-001](#be-001) | Confirmed | High / M | 新規候補（未登録） |
| [BE-002](#be-002) | Enhancement | Medium / M | 新規候補（未登録） |
| [BE-003](#be-003) | Enhancement | Medium / L | 新規候補（未登録） |
| [UX-001](#ux-001) | Confirmed | High / M | 新規候補（未登録） |
| [UX-002](#ux-002) | Confirmed | High / S | 新規候補（未登録） |
| [UX-003](#ux-003) | Confirmed | Medium / M | 新規候補（未登録） |
| [SEC-001](#sec-001) | Enhancement | High / L | 新規候補（未登録） |
| [SEC-002](#sec-002) | Confirmed | Medium / S | 新規候補（未登録） |
| [SEC-003](#sec-003) | Needs Verification | Medium / M | 検証専用候補 |
| [PERF-001](#perf-001) | Confirmed | Medium / L | 新規候補（未登録） |
| [PERF-002](#perf-002) | Enhancement | Medium / L | 新規候補（未登録） |
| [PV-001](#pv-001) | Enhancement | Low / M | 新規候補（未登録） |
| [PV-002](#pv-002) | Enhancement | Low / L | 新規候補（未登録） |
| [PV-003](#pv-003) | Enhancement | Low / M | 新規候補（未登録） |
| [MT-001](#mt-001) | Duplicate | High / L | 既存#34/#25へ集約 |
| [MT-002](#mt-002) | Duplicate | Medium / S | 既存#34/#25へ集約 |
| [MT-003](#mt-003) | Enhancement | Medium / L | 新規候補（未登録） |
| [AX-001](#ax-001) | Confirmed | Medium / M | 新規候補（未登録） |
| [AX-002](#ax-002) | Confirmed | Medium / M | 新規候補（未登録） |
| [AX-003](#ax-003) | Enhancement | Medium / M | 新規候補（未登録） |

<a id="fe-001"></a>

### FE-001 ユーザー同期の準備状態を画面全体で共有する

- 判定: **Confirmed** / 優先度: Medium / 工数: M
- 判定理由・成立条件: UserSyncは失敗alertと再試行を既に持つがfailedは内部状態で各画面へ共有されない。users.currentがnullの場合はInbox/設定/一覧が通常のloadingを継続する。同期不能と通常待機の区別が課題。
- 根拠: [src/components/user-sync.tsx:12](<../src/components/user-sync.tsx>)、[src/components/auth-provider.tsx:13](<../src/components/auth-provider.tsx>)、[src/components/inbox.tsx:36](<../src/components/inbox.tsx>)、[src/components/box-settings.tsx:29](<../src/components/box-settings.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 認証providerとInbox/箱一覧/設定/招待受諾。アカウント切替で旧データ/旧失敗状態を残さない。DB変更不要。
- 既存Issue比較: [#11](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/11)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: user-sync.test.tsxとowner画面のmocked Reactテストでupsert失敗/遅延/回復を検査する。実認証は#34の通し検証で補う。
- 候補本文: [FE-001](GITHUB_ISSUES.md#fe-001)。受け入れ条件・依存・タスクはリンク先。

<a id="fe-002"></a>

### FE-002 共有設定の競合更新と古いフォーム値を扱う

- 判定: **Confirmed** / 優先度: Medium / 工数: M
- 判定理由・成立条件: 初回useStateだけでinitialを読む。親keyは箱IDなので外部更新でもdraftは維持され、updateSharedは版確認なしに全項目をpatchする。A/Bが同じ初期値を読みAがモード、Bが名前を保存するとBの旧モードで戻せる。実2タブ再現は未実施だが上書き経路は静的に確定できる。
- 根拠: [src/components/shared-box-form.tsx:24](<../src/components/shared-box-form.tsx>)、[src/components/shared-box-settings.tsx:18](<../src/components/shared-box-settings.tsx>)、[convex/boxes.ts:88](<../convex/boxes.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 共有箱設定、getForMember/updateSharedとquestionBoxes。入力消失、公開モードの意図しない変更、旧クライアント互換が回帰リスク。
- 既存Issue比較: [#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: convex/box-management.test.tsで同じ版を読む2保存の競合、Reactテストでinitial更新とdirty状態を追加。隔離環境で2タブ手動確認を行う。
- 候補本文: [FE-002](GITHUB_ISSUES.md#fe-002)。受け入れ条件・依存・タスクはリンク先。

<a id="fe-003"></a>

### FE-003 反復する認証待ち・操作状態を小さな共通処理へ整理する

- 判定: **Enhancement** / 優先度: Low / 工数: M
- 判定理由・成立条件: performや認証queryの反復はあるが現行誤動作や再レンダリング問題を示す証拠はない。任意の小規模整理としてのみ扱い、FE-001と同じready状態の抽出を二重実装しない。
- 根拠: [src/components/inbox.tsx:47](<../src/components/inbox.tsx>)、[src/components/box-members.tsx:22](<../src/components/box-members.tsx>)、[src/components/box-settings.tsx:20](<../src/components/box-settings.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 所有者UI内の操作feedback。公開警告/role/フォーム固有validationを過度に汎用化しない。DB/API変更不要。
- 既存Issue比較: [#11](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/11)、[#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: 既存inbox/box-management/invitation-ui/answer-formテストで成功/失敗/pendingを回帰確認。性能改善とは主張しない。
- 候補本文: [FE-003](GITHUB_ISSUES.md#fe-003)。受け入れ条件・依存・タスクはリンク先。

<a id="be-001"></a>

### BE-001 公開Q&Aを回答日時順にする

- 判定: **Confirmed** / 優先度: High / 工数: M
- 判定理由・成立条件: publicAnsweredは質問createdAtのindexでpaginate後にanswer.createdAtを付加する。質問Aを先に投稿しB→Aの順で回答してもB→Aになり、READMEの回答新着順と不一致。
- 根拠: [convex/answers.ts:24](<../convex/answers.ts>)、[convex/schema.ts:39](<../convex/schema.ts>)、[README.md:86](<../README.md>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 公開個人/共有Q&A、questions/answersと既存データ補完。ページcursor互換・移行途中の欠落が回帰リスク。
- 既存Issue比較: [#5](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/5)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: convex/answers.test.tsに時刻制御した逆順回答と2ページ以上のケースを追加。personal/shared両方で確認し、移行fixtureと既存公開privacyテストを実行する。
- 候補本文: [BE-001](GITHUB_ISSUES.md#be-001)。受け入れ条件・依存・タスクはリンク先。

<a id="be-002"></a>

### BE-002 期限切れレート制限・招待の保持期限を定める

- 判定: **Enhancement** / 優先度: Medium / 工数: M
- 判定理由・成立条件: 異なるclientIdの行とaccepted/revoked/expired招待の削除処理・cronはリポジトリにない。同一IDは再利用される。蓄積は確認できるが容量超過/外部cleanup不在は断定できず、保持ポリシーの品質改善として扱う。
- 根拠: [convex/questions.ts:20](<../convex/questions.ts>)、[convex/invitations.ts:32](<../convex/invitations.ts>)、[convex/schema.ts:45](<../convex/schema.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: questionRateLimits/boxInvitationsと内部定期処理。現行レート制限とaccepted再試行、削除Memberの再参加拒否を維持する。
- 既存Issue比較: [#7](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/7)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: fake clockで期限境界とバッチ続行を検査。invitations.test.tsのaccepted/revoked/expired/removed-member契約を実行する。
- 候補本文: [BE-002](GITHUB_ISSUES.md#be-002)。受け入れ条件・依存・タスクはリンク先。

<a id="be-003"></a>

### BE-003 共有操作の追跡に必要な監査情報を残す

- 判定: **Enhancement** / 優先度: Medium / 工数: L
- 判定理由・成立条件: Answer.authorUserIdはあるが、setVisibility/remove/updateSharedに操作履歴tableへのinsertはない。監査必須の現行仕様はないため新機能として扱う。
- 根拠: [convex/answers.ts:15](<../convex/answers.ts>)、[convex/questions.ts:72](<../convex/questions.ts>)、[convex/questions.ts:79](<../convex/questions.ts>)、[convex/boxes.ts:95](<../convex/boxes.ts>)、[convex/schema.ts:8](<../convex/schema.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 共有管理mutation、追加監査table/Owner閲覧。削除本文復元・投稿者識別の副作用を避ける。
- 既存Issue比較: [#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: Convexテストで操作とeventの整合性、Member/非参加者拒否、機微field不在と保持期限を検査する。
- 候補本文: [BE-003](GITHUB_ISSUES.md#be-003)。受け入れ条件・依存・タスクはリンク先。

<a id="ux-001"></a>

### UX-001 回答済みInboxから非公開の回答も確認できるようにする

- 判定: **Confirmed** / 優先度: High / 工数: M
- 判定理由・成立条件: questions.inboxの戻り値はQuestionと箱名/削除可否のみ。InboxCardは回答本文を表示せず、publicAnsweredはprivateを除外するため、回答後に非公開へ戻すと管理画面でも回答が読めない。
- 根拠: [convex/questions.ts:64](<../convex/questions.ts>)、[src/components/inbox.tsx:40](<../src/components/inbox.tsx>)、[convex/answers.ts:24](<../convex/answers.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 個人/共有Inboxと認可済み管理query。回答joinによる読取増、参加解除後の漏洩、公開APIへの混入を防ぐ。
- 既存Issue比較: [#6](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/6)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: convex/shared-inbox.test.tsとsrc/components/inbox.test.tsxで回答→非公開→管理閲覧→参加解除を検証する。公開queryの既存テストを維持する。
- 候補本文: [UX-001](GITHUB_ISSUES.md#ux-001)。受け入れ条件・依存・タスクはリンク先。

<a id="ux-002"></a>

### UX-002 投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する

- 判定: **Confirmed** / 優先度: High / 工数: S
- 判定理由・成立条件: 公開queryはvisibilityModeを返すが個人/共有ページはboxIdだけをComposerへ渡す。共通説明は現在モードを特定せず、共有箱のprivateも全メンバーが読む点を投稿者に伝えない。説明自体が皆無という指摘ではない。
- 根拠: [src/components/question-composer.tsx:8](<../src/components/question-composer.tsx>)、[src/app/b/[slug]/page.tsx:20](<../src/app/b/[slug]/page.tsx>)、[src/app/u/[username]/page.tsx:13](<../src/app/u/[username]/page.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 個人/共有公開ページと投稿フォーム。DB変更不要。表示中のモード変更による説明と実際の投稿結果の不一致に注意。
- 既存Issue比較: [#3](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/3)、[#4](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/4)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: question-composer.test.tsxと公開routeテストで6組合せとモード更新を検査する。投稿validationと失敗時入力保持も回帰確認する。
- 候補本文: [UX-002](GITHUB_ISSUES.md#ux-002)。受け入れ条件・依存・タスクはリンク先。

<a id="ux-003"></a>

### UX-003 無効な箱フィルターを全箱表示へ黙って置換しない

- 判定: **Confirmed** / 優先度: Medium / 工数: M
- 判定理由・成立条件: 選択IDがboxesにない/取得前だとboxIdがundefinedになり、userがあれば全箱queryが動く。不正URLや参加解除時に全箱へ黙って切り替わる。backendは認可を維持し、他人の情報漏洩ではない。
- 根拠: [src/components/inbox.tsx:15](<../src/components/inbox.tsx>)、[src/components/inbox.tsx:20](<../src/components/inbox.tsx>)、[src/app/(owner)/inbox/page.tsx:2](<../src/app/(owner)/inbox/page.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: InboxのURL/箱filter/データ購読。箱間の誤操作、読込中の不要購読、戻る操作が回帰リスク。DB変更不要。
- 既存Issue比較: [#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: inbox.test.tsxでboxes undefined→取得、不正ID、選択箱消失、URL変更のケースを追加し、shared-inbox認可テストを維持する。
- 候補本文: [UX-003](GITHUB_ISSUES.md#ux-003)。受け入れ条件・依存・タスクはリンク先。

<a id="sec-001"></a>

### SEC-001 匿名clientIdを替える連投への防御を追加する

- 判定: **Enhancement** / 優先度: High / 工数: L
- 判定理由・成立条件: submitは形式の合うclientIdごとに60秒3件を数える。別IDなら別枠になることはコード上明確だが、READMEと#7はMVP制約を許容している。追加耐性の提案であり、現実の攻撃・主要停止は未確認。
- 根拠: [convex/questions.ts:17](<../convex/questions.ts>)、[src/lib/anonymous-client.ts:4](<../src/lib/anonymous-client.ts>)、[README.md:78](<../README.md>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 匿名投稿Server Action/直接Convex API、questionRateLimits、個人/共有公開箱。匿名性、誤拒否、外部challenge障害とアクセシビリティが回帰リスク。
- 既存Issue比較: [#7](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/7)、[#3](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/3)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: convex/questions.test.tsでAPI直接呼出しとID切替をfixtureで実行する。外部challenge検証は隔離環境で#34へ証跡を追加。実公開箱へ攻撃負荷を掛けない。
- 候補本文: [SEC-001](GITHUB_ISSUES.md#sec-001)。受け入れ条件・依存・タスクはリンク先。

<a id="sec-002"></a>

### SEC-002 lint依存のbraces脆弱性を追跡する

- 判定: **Confirmed** / 優先度: Medium / 工数: S
- 判定理由・成立条件: lockとnpm lsはbraces 3.0.3をlint依存から確認。今回のnpm auditもHigh 5/Critical 0、同一GHSA経路を返す。修正版なしのadvisoryを再確認。本番投稿入力からglobへの到達は確認できない。
- 根拠: [package-lock.json:3873](<../package-lock.json>)、[package.json:40](<../package.json>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 開発/CIのeslint依存。無検証overrideやNext用lint configのmajor downgradeによる互換破壊を避ける。
- 既存Issue比較: [#10](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/10)、[#17](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/17)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: npm audit --jsonとnpm ls braces --allで比較。依存変更時のみlint/typecheck/test/buildを実行。公開経路の到達性はコードとbuild依存を照合する。
- 候補本文: [SEC-002](GITHUB_ISSUES.md#sec-002)。受け入れ条件・依存・タスクはリンク先。

<a id="sec-003"></a>

### SEC-003 招待トークンがURLログへ残る経路を検証する

- 判定: **Needs Verification** / 優先度: Medium / 工数: M
- 判定理由・成立条件: 256bit乱数/hash保存/no-referrer/no-store/noindexは実装済み。一方raw tokenはinvite pathとforceRedirectUrlを通る。外部ログ設定は未取得で、漏洩の事実は断定しない。#34のログ非出力要件に関連するが、各事業者のログ設定監査と証跡収集は独立した検証範囲。
- 根拠: [convex/invitationTokens.ts:16](<../convex/invitationTokens.ts>)、[src/proxy.ts:10](<../src/proxy.ts>)、[src/app/invite/[token]/page.tsx:6](<../src/app/invite/[token]/page.tsx>)、[src/components/invite-accept.tsx:25](<../src/components/invite-accept.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 招待URL、Clerk復帰URL、Vercel/Clerk/計測ログ。調査中のtoken再露出と本番設定変更を避ける。
- 既存Issue比較: [#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)、[#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: 事業者Dashboard/API設定のread-only確認と隔離環境の合成token照合。今回のレビューでは未実施。検証のみを完了条件とし、漏洩修正を先に断定しない。
- 候補本文: [SEC-003](GITHUB_ISSUES.md#sec-003)。受け入れ条件・依存・タスクはリンク先。

<a id="perf-001"></a>

### PERF-001 Inboxの増大windowと全箱ファンアウトを制限する

- 判定: **Confirmed** / 優先度: Medium / 工数: L
- 判定理由・成立条件: numItemsをMath.maxのみで扱いアプリ上限がない。UIも20ずつ無制限拡大し、box指定時にも全membershipをcollect、全箱は各箱count+1件取得後にmergeする。アプリ側boundedというコメントは総量上限を保証しない。実測遅延/基盤制限の突破は未確認。
- 根拠: [convex/questions.ts:36](<../convex/questions.ts>)、[convex/questions.ts:53](<../convex/questions.ts>)、[src/components/inbox.tsx:17](<../src/components/inbox.tsx>)、[src/components/inbox.tsx:37](<../src/components/inbox.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 全箱/箱別Inbox、membership/質問index、購読window。最新更新時の重複/欠落/認可が重要な回帰リスク。
- 既存Issue比較: [#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: shared-inbox.test.tsの69/86/99行のケースを維持。隔離fixtureで基準値を測り、予算未達はIssueを完了にしない。実測前に仮想化や集約tableを必須化しない。
- 候補本文: [PERF-001](GITHUB_ISSUES.md#perf-001)。受け入れ条件・依存・タスクはリンク先。

<a id="perf-002"></a>

### PERF-002 箱・メンバー・招待一覧に取得上限とページングを設ける

- 判定: **Enhancement** / 優先度: Medium / 工数: L
- 判定理由・成立条件: listMine/members/pendingにcollectと関連box/user取得がある。公開feedのpaginateは既にあるので対象外。現在規模の遅延証拠はなく、大量利用への一覧品質改善。発行rate制限は本Issueに詰め込まず、測定後の別判断。
- 根拠: [convex/boxes.ts:57](<../convex/boxes.ts>)、[convex/invitations.ts:69](<../convex/invitations.ts>)、[convex/invitations.ts:84](<../convex/invitations.ts>)、[src/components/box-members.tsx:62](<../src/components/box-members.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 箱一覧・メンバー・未使用招待API/UI。paginationでOwnerや選択中の箱を見失う、filter用listMineの契約破壊に注意。
- 既存Issue比較: [#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: boxes/invitationsテストで固定fixtureとcursor traversalを検査し、box-list/box-members/inboxのUI連携を確認する。
- 候補本文: [PERF-002](GITHUB_ISSUES.md#perf-002)。受け入れ条件・依存・タスクはリンク先。

<a id="pv-001"></a>

### PV-001 イベントでの受付終了・アーカイブ需要を検証する

- 判定: **Enhancement** / 優先度: Low / 工数: M
- 判定理由・成立条件: schemaに受付終了属性がなくsubmitは存在する箱へ投稿できる。これは現行MVPの不具合ではなく需要仮説。今回は需要調査と仕様判断のみのIssueにし、実装は採用後の別候補とする。
- 根拠: [convex/schema.ts:20](<../convex/schema.ts>)、[convex/questions.ts:13](<../convex/questions.ts>)、[docs/product-spec.md:11](<../docs/product-spec.md>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: イベント運用と受付終了の将来仕様。既存Q&A/公開モード/再開/直接APIを維持する設計判断が必要。DB変更は調査段階では行わない。
- 既存Issue比較: [#1](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/1)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: 調査結果のレビューで対象数・困り事・採否・仕様の整合性を確認。採用後の別実装では終了/再開/直接API/データ保持テストを計画する。
- 候補本文: [PV-001](GITHUB_ISSUES.md#pv-001)。受け入れ条件・依存・タスクはリンク先。

<a id="pv-002"></a>

### PV-002 共有参加の退出・所有者引継ぎの方針を定める

- 判定: **Enhancement** / 優先度: Low / 工数: L
- 判定理由・成立条件: removeMemberはOwner自身削除を拒否し、本人退出/Owner移譲APIはない。#31も他Owner追加をMVP対象外とする。現行欠陥ではなく継続運用の方針策定とする。退出と移譲の実装は独立するため今回一括実装を指示しない。
- 根拠: [convex/invitations.ts:103](<../convex/invitations.ts>)、[convex/lib/access.ts:50](<../convex/lib/access.ts>)、[docs/product-spec.md:158](<../docs/product-spec.md>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 共有運営の権限モデルと将来membership/ownerUserId移行。最後のOwner消失・過去Answer削除・権限残存を避ける。
- 既存Issue比較: [#29](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/29)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: 現行role契約との設計照合と権限表レビュー。実装前に同時操作・途中失敗・受諾/拒否・退出後のprivate拒否のテスト計画を分割する。
- 候補本文: [PV-002](GITHUB_ISSUES.md#pv-002)。受け入れ条件・依存・タスクはリンク先。

<a id="pv-003"></a>

### PV-003 ターゲット別の成功指標を設定して価値を検証する

- 判定: **Enhancement** / 優先度: Low / 工数: M
- 判定理由・成立条件: リポジトリは用途/導線を示すが成功指標や調査計画を定めない。外部分析基盤不在や市場不適合は断定しない。利用価値の検証計画を作る提案。
- 根拠: [docs/product-spec.md:7](<../docs/product-spec.md>)、[src/app/page.tsx:3](<../src/app/page.tsx>)、[README.md:90](<../README.md>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 部会試用・調査計画。匿名性/同意・質問本文/tokenを収集しないことを優先。
- 既存Issue比較: [#1](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/1)、[#25](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/25)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: 測定仕様レビューと匿名化集計fixtureで計算を検証。実試用結果は#25と対応を記録する。
- 候補本文: [PV-003](GITHUB_ISSUES.md#pv-003)。受け入れ条件・依存・タスクはリンク先。

<a id="mt-001"></a>

### MT-001 実サービス接続を含む主要フローの検証を整備する

- 判定: **Duplicate** / 優先度: High / 工数: L
- 判定理由・成立条件: CI/E2Eはkeylessかつ外部通信を遮断し、共有通しの実通信証跡がない点は有効。ただしOpen #34が同じ個人/共有/招待/権限/最終検査、Open #25が実Vercel環境の受け入れを既に要求するため、新規Issueは作らず既存に隔離実接続の証跡条件を補足する案とする。
- 根拠: [e2e/smoke.spec.ts:8](<../e2e/smoke.spec.ts>)、[.github/workflows/ci.yml:44](<../.github/workflows/ci.yml>)、[docs/vercel-public-test-validation.md:1](<../docs/vercel-public-test-validation.md>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 既存#34/#25のリリース検証。unit成功を実JWT/DB成功と混同しない。
- 既存Issue比較: [#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)、[#25](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/25)。同じ改善目的を既存Openに集約し新規作成しない。
- 改善案・検証: #34/#25の実通信検査と仕様同期を行う。追加チェックはGITHUB_ISSUES.mdの既存Issue追記案へ記載。

<a id="mt-002"></a>

### MT-002 仕様・受け入れ手順を共有質問箱の実装状態へ更新する

- 判定: **Duplicate** / 優先度: Medium / 工数: S
- 判定理由・成立条件: product-specに準備中/後続実装の記述、READMEのsrc/types、個人中心のacceptanceが残る。問題は成立するがOpen #34のDocs節が仕様/acceptanceを最終仕様へ同期する同一目的を含むため新規作成しない。README構成の小修正も同じ文書同期タスクとして補足する案。
- 根拠: [docs/product-spec.md:153](<../docs/product-spec.md>)、[docs/product-spec.md:140](<../docs/product-spec.md>)、[README.md:50](<../README.md>)、[src/components/box-list.tsx:38](<../src/components/box-list.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 仕様/受け入れ/README。履歴と現行仕様を区別し、過去検証成功を再実施済みと扱わない。
- 既存Issue比較: [#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)。同じ改善目的を既存Openに集約し新規作成しない。
- 改善案・検証: #34/#25の実通信検査と仕様同期を行う。追加チェックはGITHUB_ISSUES.mdの既存Issue追記案へ記載。

<a id="mt-003"></a>

### MT-003 監視・復旧・環境分離の運用手順を具体化する

- 判定: **Enhancement** / 優先度: Medium / 工数: L
- 判定理由・成立条件: deploymentには環境分離とfrontend rollbackがあり、完全な運用手順不在という指摘は過大。追加で通知/RPO/RTO/DB復元演習の実施記録が見当たらない点に絞る。Dashboard設定は未確認。
- 根拠: [docs/deployment.md:13](<../docs/deployment.md>)、[docs/deployment.md:94](<../docs/deployment.md>)、[docs/public-test-environment.md:3](<../docs/public-test-environment.md>)、[src/app/error.tsx:2](<../src/app/error.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 運用文書・監視・DBバックアップ/復元と隔離検証環境。本番データ上書きやtokenログ出力を避ける。
- 既存Issue比較: [#17](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/17)、[#22](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/22)、[#23](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/23)、[#24](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/24)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: 復元演習の結果と認可/行数/公開privateをレビュー。現行のdeploy/rollback文書と環境対応が一致するか確認する。
- 候補本文: [MT-003](GITHUB_ISSUES.md#mt-003)。受け入れ条件・依存・タスクはリンク先。

<a id="ax-001"></a>

### AX-001 回答・削除確認の表示と消失にフォーカス管理を加える

- 判定: **Confirmed** / 優先度: Medium / 工数: M
- 判定理由・成立条件: QRはfocus処理済みだがInboxの回答/削除は条件描画だけ。Member削除では起点ボタンも確認UIへ置換され、キャンセル/カード消失時の復帰先指定がない。実読み上げ影響は別途検査が必要。
- 根拠: [src/components/inbox.tsx:64](<../src/components/inbox.tsx>)、[src/components/answer-form.tsx:24](<../src/components/answer-form.tsx>)、[src/components/box-members.tsx:39](<../src/components/box-members.tsx>)、[src/components/share-button.tsx:43](<../src/components/share-button.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 回答/質問削除/Member削除のインラインUI。購読更新で対象が消えるケース、不要なmodal role/trap導入に注意。DB変更不要。
- 既存Issue比較: [#20](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/20)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: ReactでactiveElementを検査し、実ブラウザでTab/Shift+Tab/取消/リアルタイム消失を確認。VoiceOver等の結果を記録する。
- 候補本文: [AX-001](GITHUB_ISSUES.md#ax-001)。受け入れ条件・依存・タスクはリンク先。

<a id="ax-002"></a>

### AX-002 入力エラーを対象フィールドと関連付ける

- 判定: **Confirmed** / 優先度: Medium / 工数: M
- 判定理由・成立条件: SharedBoxFormのSLUG_TAKENはalertに出るがslug入力との関連がない。投稿/回答は文字数関連のみでinvalid状態を示さない。ただしrequired/pattern/maxLengthのnative検証は既にあるので全validation欠落とは扱わない。
- 根拠: [src/components/shared-box-form.tsx:54](<../src/components/shared-box-form.tsx>)、[src/components/shared-box-form.tsx:74](<../src/components/shared-box-form.tsx>)、[src/components/question-composer.tsx:33](<../src/components/question-composer.tsx>)、[src/components/answer-form.tsx:28](<../src/components/answer-form.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 質問/回答/共有箱フォーム。native検証・入力保持・通信エラーとの区別・過剰な読み上げを保つ。DB変更不要。
- 既存Issue比較: [#20](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/20)、[#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: box-management/question-composer/answer-formテストでaria-describedby参照の存在とinvalid解除を検査し、ブラウザnative検証/読み上げを確認する。
- 候補本文: [AX-002](GITHUB_ISSUES.md#ax-002)。受け入れ条件・依存・タスクはリンク先。

<a id="ax-003"></a>

### AX-003 WCAGの検証範囲を自動・手動の両方で広げる

- 判定: **Enhancement** / 優先度: Medium / 工数: M
- 判定理由・成立条件: lang/label/contrast/focus-visible/reduced-motionと部分検査はある。包括的axe/拡大/実読み上げの記録はない。WCAG違反の断定ではなく検証範囲の追加。
- 根拠: [src/app/layout.tsx:19](<../src/app/layout.tsx>)、[src/app/globals.css:35](<../src/app/globals.css>)、[e2e/smoke.spec.ts:38](<../e2e/smoke.spec.ts>)、[docs/mobile-validation.md:1](<../docs/mobile-validation.md>)。行番号はHEAD `71d31d1`のローカル検証時点。
- 影響範囲・回帰リスク: 代表画面/動的状態/Clerk UIのアクセシビリティ検証。自動検査だけで準拠を宣言しない。
- 既存Issue比較: [#15](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/15)、[#20](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/20)、[#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)。関連する機能実装/一般要件であり、本候補の具体的な改善または独立検証と同一の完了条件ではない。
- 改善案・検証: e2e/smoke.spec.tsの実markup fixtureと隔離実接続の画面で検査し、manual matrixを残す。AX-001/002の動的操作を含める。
- 候補本文: [AX-003](GITHUB_ISSUES.md#ax-003)。受け入れ条件・依存・タスクはリンク先。

## 5. 誤検出・解決済み・重複項目

全項目を現在HEADで見直した結果、主分類Resolved/False Positiveは0件。値を揃えるために無理に分類しない。MT-001/MT-002はDuplicate 2件: 実接続/共有受け入れとDocs同期を既存Open #34へ、公開試用判定を#25へ割り当てる。どちらも未解決であり、Closed #18等の履歴だけで解決済みとはしない。

指摘の部分訂正: FE-001の「再試行がない」は成立しない（既にUserSync alert/retryあり）。UX-002の「説明がない」は成立しない（全モード共通説明はある）。AX-002はnative validationあり。MT-003は環境分離/rollback手順あり。PERF-002で公開feedはページング済み。これらの既存対策を除外した残存目的のみIssue化した。

粒度: 共通原因のAX-001（動的focus）とAX-002（入力error関連付け）は別目的、PERF-001（Inbox merge/window）とPERF-002（管理一覧collect）は独立API契約で別Issue。BE-002は期限データ整理という同一運用目的で統合する。BE-003/MT-003はログ秘匿化を共有するが業務監査と障害復旧は別目的。PV-002は方針策定だけを1件にし、退出/移譲の実装は採用後に分割。FE-003はFE-001の準備状態抽出を含めず、残るfeedback整理だけを任意候補にした。

## 6. 追加検証が必要な項目

SEC-003（Needs Verification 1件）は漏洩を断定しない検証専用候補。合成tokenを使ってVercel/Clerk/監視・分析ツールのURL収集、閲覧権限、保持、マスクを調べる。no-referrerはアクセスログを消す保証ではない。外部設定は今回未取得。

その他の分類の限界: FE-002の論理上書きはConfirmedだが2タブ操作は未実施。SEC-001はID回避経路を確認したが攻撃発生/防御製品は未検証。PERFは候補増加/collectを確認したが負荷・応答予算は未計測。BE-002/MT-003/PV-003はリポジトリ外の運用・分析の有無が未確認。AXはfocus/error関連の欠落を確認したが実読み上げ・WCAG準拠は未判定。分類がConfirmedでもあらゆる実環境条件を再現したという意味ではない。

## 7. 優先度再評価の理由

- High: UX-002（公開判断/共有閲覧者の誤解）、UX-001（private回答管理の欠落）、BE-001（主要公開Q&Aの仕様不一致）、SEC-001（公開募集時の連投耐性）。既存#34/#25の実通信受け入れもHighのリリース条件。
- Medium: 同期/競合/filter/focus/errorの失敗回復、lint依存の露出管理、保持/大量一覧/復旧/a11y検査/監査。FE-002は公開モードを戻す経路はあるが複数タブ条件付き、既存質問を変更しないため重大データ損失として過大評価しない。
- Lowへ変更: PV-001/002/003は需要・外部運用未確認の追加提案で、現行MVP不具合ではない。FE-003も任意整理。
- MT-001はテスト不足という事実だけならMedium相当だが、#34/#25の共有リリース判定未完了に対する実接続受け入れはHighとした。追加自動化そのものはリリースの必須条件にしない。
- Criticalを裏付ける漏洩/破損/主要停止は確認なし。auditのHigh 5件はlint依存同一原因でプロダクト優先度Medium。SEC-001は不具合分類から追加防御Enhancementへ、BE-002/PERF-002は運用/規模改善Enhancementへ変更した。

## 8. 推奨実装順序

上位5件: SEC-001 → UX-002 → UX-001 → BE-001 → 既存#34（#25と連携した実通信検証）。#34の現状ベースライン検証は早期に着手し、修正後に最終判定する。SEC-002の露出評価・SEC-003のログ調査は独立して開始できる。次にFE-001/002、UX-003、AX-001/002。Phase 3ではBE-002、PERF-001/002、MT-003、AX-003。需要調査後にPhase 4の採用を判断する。

依存: UX-001の回答joinを含む完成形でPERF-001を計測する。PERF-002はUX-003の箱選択を壊さない契約を合わせる（先行必須ではなく統合回帰）。AX-003の最終検査はAX-001/002後。MT-003の監視秘匿化はSEC-003調査結果を使う。FE-003はFE-001後のみ。参照元Closed #29〜33は再実装しない。

## 9. リリース前に対応すべき項目

公開募集拡大前: SEC-001の追加防御/限界/誤拒否対策を決め、UX-002の説明を整備する。主要管理/閲覧のUX-001とBE-001を修正する。#34/#25で隔離実接続の証跡と投入可否を記録し、MT-002の現行仕様同期を完了する。SEC-002は修正版未提供なら露出・軽減・担当・期限を持つ例外管理を条件とする。SEC-003で実漏洩が見つかれば失効と修正を優先する。

正式継続運用前: MT-003の復旧演習と環境対応を確認する。負荷計測未実施のPERF/PV全提案を一律ブロッカーにしない。需要仮説や任意refactorを現行リリース必須にしない。

## 10. 今後の改善ロードマップ

[IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md)に4Phaseの目的・順序・依存・完了条件を記載。新規候補には番号を創作せず「未登録」、既存#34/#25には実URLを記載する。[GITHUB_ISSUES.md](GITHUB_ISSUES.md)は21件のコピペ可能な本文と既存追記案を含む。工数S/M/Lは調査・migration・外部設定・実機条件で変わる見積りであり日程確約ではない。
