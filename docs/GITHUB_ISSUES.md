# GitHub Issue登録準備一覧

検証日: 2026-10-14（Asia/Tokyo）。対象commit: `71d31d14a02b995017948efb227551547e003795`。新規登録候補21件（Confirmed 10、Enhancement 10、検証専用1）。**GitHub上への登録・編集・コメントは実施していない。**

Open/Closed全26件のタイトル・本文・受け入れ条件を照合した。MT-001/MT-002はOpen #34（実利用フロー/Docs同期）および#25（公開環境受け入れ）に集約し、新規作成しない。Closedは「関連」と「重複」を区別した。#7は最低限clientId制限を対象とし追加防御を将来対応にしているためSEC-001は重複ではない。#30は競合制御、#32はprivate回答本文閲覧、#5は逆順回答ページングの改善目的を満たさないため、残存課題を新規候補にする。

既存ラベル: `accessibility`, `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`。下記はこの集合だけを使う。優先度・security/testing/refactorは本文メタデータで表し、新ラベルを作らない。

登録時はこのIDを本文へ残し、再度全Open/Closed本文を照合する。同じ目的・元ID・受け入れ条件が既にあれば再利用し、番号/URLを本書とロードマップに反映する。候補IDはGitHub番号ではない。関連Issueへの逆参照は登録後に行う作業であり、今回は下記の関連リンクと既存Issue向け追記案のみ用意した。

## 登録順・候補一覧

| 順 | 元ID | タイトル | 判定 | 優先度 | 工数 | ラベル候補 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | [SEC-001](#sec-001) | [Security] 匿名clientIdを替える連投への防御を追加する | Enhancement | High | L | enhancement |
| 2 | [UX-002](#ux-002) | [UI/UX] 投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する | Confirmed | High | S | bug |
| 3 | [UX-001](#ux-001) | [UI/UX] 回答済みInboxから非公開の回答も確認できるようにする | Confirmed | High | M | bug |
| 4 | [BE-001](#be-001) | [Backend] 公開Q&Aを回答日時順にする | Confirmed | High | M | bug |
| 5 | [SEC-002](#sec-002) | [Security] lint依存のbraces脆弱性を追跡する | Confirmed | Medium | S | enhancement |
| 6 | [SEC-003](#sec-003) | [Security] 招待URLの外部ログ記録と保持設定を検証する | Needs Verification | Medium | M | question |
| 7 | [FE-001](#fe-001) | [Frontend] ユーザー同期の準備状態を画面全体で共有する | Confirmed | Medium | M | bug |
| 8 | [FE-002](#fe-002) | [Frontend] 共有設定の競合更新と古いフォーム値を扱う | Confirmed | Medium | M | bug |
| 9 | [UX-003](#ux-003) | [UI/UX] 無効な箱フィルターを全箱表示へ黙って置換しない | Confirmed | Medium | M | bug |
| 10 | [AX-001](#ax-001) | [Accessibility] 回答・削除確認の表示と消失にフォーカス管理を加える | Confirmed | Medium | M | accessibility, bug |
| 11 | [AX-002](#ax-002) | [Accessibility] 入力エラーを対象フィールドと関連付ける | Confirmed | Medium | M | accessibility, bug |
| 12 | [BE-002](#be-002) | [Backend] 期限切れレート制限・招待の保持期限を定める | Enhancement | Medium | M | enhancement |
| 13 | [PERF-001](#perf-001) | [Performance] Inboxの増大windowと全箱ファンアウトを制限する | Confirmed | Medium | L | bug |
| 14 | [PERF-002](#perf-002) | [Performance] 箱・メンバー・招待の一覧取得をページ化する | Enhancement | Medium | L | enhancement |
| 15 | [MT-003](#mt-003) | [Operations] 障害通知・DB復元演習の運用手順を整備する | Enhancement | Medium | L | documentation |
| 16 | [AX-003](#ax-003) | [Accessibility] WCAGの検証範囲を自動・手動の両方で広げる | Enhancement | Medium | M | accessibility, enhancement |
| 17 | [BE-003](#be-003) | [Backend] 共有操作の追跡に必要な監査情報を残す | Enhancement | Medium | L | enhancement |
| 18 | [PV-001](#pv-001) | [Product] イベントの受付終了・アーカイブ需要と採否を決める | Enhancement | Low | M | enhancement |
| 19 | [PV-002](#pv-002) | [Product] 本人退出・Owner移譲の需要と運用方針を決める | Enhancement | Low | L | enhancement |
| 20 | [PV-003](#pv-003) | [Product] ターゲット別の成功指標を設定して価値を検証する | Enhancement | Low | M | enhancement |
| 21 | [FE-003](#fe-003) | [Frontend] 反復する管理操作のfeedbackを小さく共通化する | Enhancement | Low | M | enhancement |

---

<a id="sec-001"></a>

## SEC-001: [Security] 匿名clientIdを替える連投への防御を追加する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

匿名clientIdを替える連投への防御を追加する。判定はEnhancement。

### 背景・問題

submitは形式の合うclientIdごとに60秒3件を数える。別IDなら別枠になることはコード上明確だが、READMEと#7はMVP制約を許容している。追加耐性の提案であり、現実の攻撃・主要停止は未確認。

### 根拠

[convex/questions.ts:17](<../convex/questions.ts>)、[src/lib/anonymous-client.ts:4](<../src/lib/anonymous-client.ts>)、[README.md:78](<../README.md>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

匿名性と現行のbox/client制限を保ち、追加の検証証明をConvex入口で必須にする。許可の大量発行・再利用・別箱利用も制御対象とする。防御の範囲と誤拒否の回復を先に決め、受付停止の新機能は必要性確認後の別候補とする。

### 実装タスク

- [ ] 箱単位の濫用モデル・許容投稿量・誤拒否時の回復方針を決める
- [ ] Convex入口で検証するchallengeまたは検証済み短命投稿許可を設計する。単に誰でも許可を大量発行できる方式を防御完了と扱わない
- [ ] 偽造・期限切れ・再利用・別箱流用・IDローテーションに対する拒否/総量制御を実装する
- [ ] 失敗時入力保持と利用可能な代替手段を用意し、限界と運用手順を文書化する

### 受け入れ条件

- [ ] Nextを経由しないConvex呼出しも証明なし/不正証明なら拒否する
- [ ] 同一証明の再利用・期限切れ・別箱利用を拒否し、ID変更と許可大量発行に対する設定済み総量/検証制御が働く
- [ ] ログイン不要の正規投稿と代替手段が利用でき、Questionとログに生IP・token・投稿者アカウントを保存しない
- [ ] 防御の限界、誤拒否率の確認方法、サービス障害時の方針を記録する

### 影響範囲

匿名投稿Server Action/直接Convex API、questionRateLimits、個人/共有公開箱。匿名性、誤拒否、外部challenge障害とアクセシビリティが回帰リスク。

### テスト方法

convex/questions.test.tsでAPI直接呼出しとID切替をfixtureで実行する。外部challenge検証は隔離環境で#34へ証跡を追加。実公開箱へ攻撃負荷を掛けない。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: High
- 工数: L
- 種別: security
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#7](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/7)、[#3](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/3)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: SEC-001
- Phase: 1


---

<a id="ux-002"></a>

## UX-002: [UI/UX] 投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する。判定はConfirmed。

### 背景・問題

公開queryはvisibilityModeを返すが個人/共有ページはboxIdだけをComposerへ渡す。共通説明は現在モードを特定せず、共有箱のprivateも全メンバーが読む点を投稿者に伝えない。説明自体が皆無という指摘ではない。

### 根拠

[src/components/question-composer.tsx:8](<../src/components/question-composer.tsx>)、[src/app/b/[slug]/page.tsx:20](<../src/app/b/[slug]/page.tsx>)、[src/app/u/[username]/page.tsx:13](<../src/app/u/[username]/page.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

boxの種類と現在モードをフォームへ渡し、「送信直後に公開」「承認までメンバーだけ」等を表示する。回答・個別公開の可能性と投稿者アカウント非保存を引き続き説明する。

### 実装タスク

- [ ] box種類と現在の公開モードを取得値からフォームへ渡す
- [ ] 即時公開/承認待ち/回答時公開とOwner/Memberの閲覧範囲を説明する
- [ ] 表示後のモード変更時の説明更新または送信前再確認の方針を定める
- [ ] 個人/共有×3モードの表示・投稿回帰テストを追加する

### 受け入れ条件

- [ ] 全6組合せで現在モードと未回答質問を読める人が送信前に分かる
- [ ] privateでも個別公開/回答で公開され得ることを示し、投稿者アカウント非保存の説明を維持する
- [ ] モード変更時に古い説明のまま送信させない方針と検証結果がある

### 影響範囲

個人/共有公開ページと投稿フォーム。DB変更不要。表示中のモード変更による説明と実際の投稿結果の不一致に注意。

### テスト方法

question-composer.test.tsxと公開routeテストで6組合せとモード更新を検査する。投稿validationと失敗時入力保持も回帰確認する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: High
- 工数: S
- 種別: bug
- 判定: Confirmed
- ラベル候補: bug
- 関連Issue: [#3](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/3)、[#4](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/4)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: UX-002
- Phase: 2


---

<a id="ux-001"></a>

## UX-001: [UI/UX] 回答済みInboxから非公開の回答も確認できるようにする

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

回答済みInboxから非公開の回答も確認できるようにする。判定はConfirmed。

### 背景・問題

questions.inboxの戻り値はQuestionと箱名/削除可否のみ。InboxCardは回答本文を表示せず、publicAnsweredはprivateを除外するため、回答後に非公開へ戻すと管理画面でも回答が読めない。

### 根拠

[convex/questions.ts:64](<../convex/questions.ts>)、[src/components/inbox.tsx:40](<../src/components/inbox.tsx>)、[convex/answers.ts:24](<../convex/answers.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

認可済みInboxへ必要な回答本文・回答時刻を追加し、回答済みカードで表示または展開する。公開APIのprivate除外は維持する。

### 実装タスク

- [ ] 認可済みの回答済みInboxへ回答本文と回答時刻を必要最小限で追加する
- [ ] 回答済みカードに本文を表示/展開し、回答欠落時も安全に説明する
- [ ] Owner/Member/非参加者/参加解除/personalのテストを追加する

### 受け入れ条件

- [ ] 個人Ownerと共有Owner/Memberはprivateを含む回答本文を確認できる
- [ ] 未ログイン・非参加者・参加解除後はprivate回答を取得できない
- [ ] 公開queryはprivateを返さず、回答者の個人情報も新たに公開しない

### 影響範囲

個人/共有Inboxと認可済み管理query。回答joinによる読取増、参加解除後の漏洩、公開APIへの混入を防ぐ。

### テスト方法

convex/shared-inbox.test.tsとsrc/components/inbox.test.tsxで回答→非公開→管理閲覧→参加解除を検証する。公開queryの既存テストを維持する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: High
- 工数: M
- 種別: bug
- 判定: Confirmed
- ラベル候補: bug
- 関連Issue: [#6](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/6)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: UX-001
- Phase: 2


---

<a id="be-001"></a>

## BE-001: [Backend] 公開Q&Aを回答日時順にする

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

公開Q&Aを回答日時順にする。判定はConfirmed。

### 背景・問題

publicAnsweredは質問createdAtのindexでpaginate後にanswer.createdAtを付加する。質問Aを先に投稿しB→Aの順で回答してもB→Aになり、READMEの回答新着順と不一致。

### 根拠

[convex/answers.ts:24](<../convex/answers.ts>)、[convex/schema.ts:39](<../convex/schema.ts>)、[README.md:86](<../README.md>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

QuestionへansweredAtを持たせ公開・状態・回答日時indexで取得する等、DBで回答順にページングする。既存回答から値を補完し、visibility更新で順序が変わらないようにする。

### 実装タスク

- [ ] 回答日時をソートキーにする後方互換schema/indexと、同時刻の安定した順序を設計する
- [ ] answers.createdAtから既存Questionを再実行可能な小バッチで補完し、件数・孤児の照合と切替/戻し手順を作る
- [ ] createと公開queryを更新し、visibility変更で回答順位を動かさない
- [ ] 逆順回答・複数ページ・同時刻・private・移行途中の回帰テストと仕様更新を行う

### 受け入れ条件

- [ ] A→Bの投稿、B→Aの回答でA→Bの公開順になる
- [ ] ページ境界で同時刻データの重複・欠落がなく、privateと孤児は返らない
- [ ] 旧データ補完の再実行で内容/回答件数を変えず、公開切替は回答順に影響しない

### 影響範囲

公開個人/共有Q&A、questions/answersと既存データ補完。ページcursor互換・移行途中の欠落が回帰リスク。

### テスト方法

convex/answers.test.tsに時刻制御した逆順回答と2ページ以上のケースを追加。personal/shared両方で確認し、移行fixtureと既存公開privacyテストを実行する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: High
- 工数: M
- 種別: bug
- 判定: Confirmed
- ラベル候補: bug
- 関連Issue: [#5](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/5)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: BE-001
- Phase: 2


---

<a id="sec-002"></a>

## SEC-002: [Security] lint依存のbraces脆弱性を追跡する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

lint依存のbraces脆弱性を追跡する。判定はConfirmed。

### 背景・問題

lockとnpm lsはbraces 3.0.3をlint依存から確認。今回のnpm auditもHigh 5/Critical 0、同一GHSA経路を返す。修正版なしのadvisoryを再確認。本番投稿入力からglobへの到達は確認できない。

### 根拠

[package-lock.json:3873](<../package-lock.json>)、[package.json:40](<../package.json>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

上流修正版を追跡し、安全な更新または検証済みoverrideを採用する。auditが示すeslint-config-next 14へのmajor downgradeを機械適用せず、期限付き例外と露出分析を記録する。

### 実装タスク

- [ ] lockと監査の到達経路を記録し、外部入力がglobへ渡る箇所を確認する
- [ ] 上流修正版の追跡担当/再確認期限を定め、互換更新があれば採用する
- [ ] 修正版がない場合は外部glob入力の制限等と期限付き例外を記録する
- [ ] 更新する場合はaudit/lint/typecheck/build/既存テストを確認する

### 受け入れ条件

- [ ] 警告5件を同一原因として管理し、本番API重大脆弱性5件と報告しない
- [ ] 安全な更新で解消するか、到達範囲・軽減策・担当・再確認日がある例外を残す
- [ ] eslint-config-next 14等のmajor downgradeを機械適用しない

### 影響範囲

開発/CIのeslint依存。無検証overrideやNext用lint configのmajor downgradeによる互換破壊を避ける。

### テスト方法

npm audit --jsonとnpm ls braces --allで比較。依存変更時のみlint/typecheck/test/buildを実行。公開経路の到達性はコードとbuild依存を照合する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: S
- 種別: security
- 判定: Confirmed
- ラベル候補: enhancement
- 関連Issue: [#10](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/10)、[#17](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/17)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: SEC-002
- Phase: 1

外部根拠: [GitHub Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)。2026-10-14再確認、影響範囲<=3.0.3、修正版未掲載。


---

<a id="sec-003"></a>

## SEC-003: [Security] 招待URLの外部ログ記録と保持設定を検証する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

招待トークンがURLログへ残る経路を検証する。判定はNeeds Verification。漏洩の有無を確認する検証用Issue。

### 背景・問題

256bit乱数/hash保存/no-referrer/no-store/noindexは実装済み。一方raw tokenはinvite pathとforceRedirectUrlを通る。外部ログ設定は未取得で、漏洩の事実は断定しない。#34のログ非出力要件に関連するが、各事業者のログ設定監査と証跡収集は独立した検証範囲。

### 根拠

[convex/invitationTokens.ts:16](<../convex/invitationTokens.ts>)、[src/proxy.ts:10](<../src/proxy.ts>)、[src/app/invite/[token]/page.tsx:6](<../src/app/invite/[token]/page.tsx>)、[src/components/invite-accept.tsx:25](<../src/components/invite-accept.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

対象ログ/分析サービス、収集項目、閲覧者、保持期間を棚卸しする。隔離環境の合成tokenでinvite→sign-in→復帰→受諾のURL記録を調査する。

### 実装タスク

- [ ] 対象ログ/分析サービス、収集項目、閲覧者、保持期間を棚卸しする
- [ ] 隔離環境の合成tokenでinvite→sign-in→復帰→受諾のURL記録を調査する
- [ ] 記録をマスクした証跡と未確認経路を残し、問題発見時のみ別修正を提案する
- [ ] 招待revoke手順とraw tokenを調査資料へ貼らない方針を文書化する

### 受け入れ条件

- [ ] 各ログ経路についてraw token記録の有無、アクセス権、保持期間を結果表に残す
- [ ] 未確認を成功扱いせず、漏洩があれば具体的な修正候補と失効対応を定める
- [ ] 共有する証跡に実token/JWT/secretを含めない

### 影響範囲

招待URL、Clerk復帰URL、Vercel/Clerk/計測ログ。調査中のtoken再露出と本番設定変更を避ける。

### テスト方法

事業者Dashboard/API設定のread-only確認と隔離環境の合成token照合。今回のレビューでは未実施。検証のみを完了条件とし、漏洩修正を先に断定しない。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: security
- 判定: Needs Verification
- ラベル候補: question
- 関連Issue: [#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)、[#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: SEC-003
- Phase: 1


---

<a id="fe-001"></a>

## FE-001: [Frontend] ユーザー同期の準備状態を画面全体で共有する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

ユーザー同期の準備状態を画面全体で共有する。判定はConfirmed。

### 背景・問題

UserSyncは失敗alertと再試行を既に持つがfailedは内部状態で各画面へ共有されない。users.currentがnullの場合はInbox/設定/一覧が通常のloadingを継続する。同期不能と通常待機の区別が課題。

### 根拠

[src/components/user-sync.tsx:12](<../src/components/user-sync.tsx>)、[src/components/auth-provider.tsx:13](<../src/components/auth-provider.tsx>)、[src/components/inbox.tsx:36](<../src/components/inbox.tsx>)、[src/components/box-settings.tsx:29](<../src/components/box-settings.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

同期状態をready/pending/errorとして共通化し、各所有者画面で状態に応じた案内と再試行を表示する。既存の認証完了待ちは維持する。

### 実装タスク

- [ ] 認証待ち/同期中/利用可能/同期失敗を共有する小さな状態管理を設ける
- [ ] Owner画面と招待受諾で状態別案内を出し、既存UserSync再試行へ接続する
- [ ] 遅延・失敗・再試行・ログアウト・別ユーザー切替の回帰テストを追加する

### 受け入れ条件

- [ ] 同期失敗時は通常loadingと区別した説明/再試行を対象画面に表示する
- [ ] 準備完了前に管理query/mutationを呼ばず、成功後に画面を開く
- [ ] ログアウト/アカウント切替で旧状態を破棄し、別Userの情報を表示しない

### 影響範囲

認証providerとInbox/箱一覧/設定/招待受諾。アカウント切替で旧データ/旧失敗状態を残さない。DB変更不要。

### テスト方法

user-sync.test.tsxとowner画面のmocked Reactテストでupsert失敗/遅延/回復を検査する。実認証は#34の通し検証で補う。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: bug
- 判定: Confirmed
- ラベル候補: bug
- 関連Issue: [#11](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/11)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: FE-001
- Phase: 2


---

<a id="fe-002"></a>

## FE-002: [Frontend] 共有設定の競合更新と古いフォーム値を扱う

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

共有設定の競合更新と古いフォーム値を扱う。判定はConfirmed。

### 背景・問題

初回useStateだけでinitialを読む。親keyは箱IDなので外部更新でもdraftは維持され、updateSharedは版確認なしに全項目をpatchする。A/Bが同じ初期値を読みAがモード、Bが名前を保存するとBの旧モードで戻せる。実2タブ再現は未実施だが上書き経路は静的に確定できる。

### 根拠

[src/components/shared-box-form.tsx:24](<../src/components/shared-box-form.tsx>)、[src/components/shared-box-settings.tsx:18](<../src/components/shared-box-settings.tsx>)、[convex/boxes.ts:88](<../convex/boxes.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

更新版番号を取得・保存時に比較し、競合時に再読込を案内する。未編集時だけ最新値へ追従し、編集中は差分を提示する。

### 実装タスク

- [ ] revisionなど比較可能な版を取得し、mutation内の同一transactionで保存前比較する
- [ ] 未編集フォームだけ最新値へ追従し、編集中は競合表示と再読み込み/再編集を提供する
- [ ] 競合時の入力保持・Owner認可・slug不変・既存質問visibility維持をテストする

### 受け入れ条件

- [ ] Aがモード変更後、古いBが名前変更を保存してもAのモードを無言で戻さない
- [ ] 競合時は入力と差分/再読込導線が残り、解決後に意図した値を保存できる
- [ ] 同時保存/旧データとOwner以外の拒否を検証する

### 影響範囲

共有箱設定、getForMember/updateSharedとquestionBoxes。入力消失、公開モードの意図しない変更、旧クライアント互換が回帰リスク。

### テスト方法

convex/box-management.test.tsで同じ版を読む2保存の競合、Reactテストでinitial更新とdirty状態を追加。隔離環境で2タブ手動確認を行う。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: bug
- 判定: Confirmed
- ラベル候補: bug
- 関連Issue: [#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: FE-002
- Phase: 2


---

<a id="ux-003"></a>

## UX-003: [UI/UX] 無効な箱フィルターを全箱表示へ黙って置換しない

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

無効な箱フィルターを全箱表示へ黙って置換しない。判定はConfirmed。

### 背景・問題

選択IDがboxesにない/取得前だとboxIdがundefinedになり、userがあれば全箱queryが動く。不正URLや参加解除時に全箱へ黙って切り替わる。backendは認可を維持し、他人の情報漏洩ではない。

### 根拠

[src/components/inbox.tsx:15](<../src/components/inbox.tsx>)、[src/components/inbox.tsx:20](<../src/components/inbox.tsx>)、[src/app/(owner)/inbox/page.tsx:2](<../src/app/(owner)/inbox/page.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

箱一覧の取得完了まで指定箱queryを待ち、指定箱が利用不可なら専用の説明と全箱へ戻る操作を表示する。URLと選択状態の同期方針も定める。

### 実装タスク

- [ ] 未指定/読込中/有効/利用不可の選択状態を分ける
- [ ] 指定箱の確認完了までqueryをskipし、利用不可は説明と明示的な全箱への操作を表示する
- [ ] URLと選択状態の同期を定義し、不正ID・参加解除・遷移の回帰テストを追加する

### 受け入れ条件

- [ ] 指定IDが不正/未認可/参加解除なら別箱質問を自動表示しない
- [ ] 箱一覧読込中に指定箱を全箱queryへ置換しない
- [ ] 全箱ボタンを選ぶと全箱へ戻れ、有効IDでは指定箱だけ取得する

### 影響範囲

InboxのURL/箱filter/データ購読。箱間の誤操作、読込中の不要購読、戻る操作が回帰リスク。DB変更不要。

### テスト方法

inbox.test.tsxでboxes undefined→取得、不正ID、選択箱消失、URL変更のケースを追加し、shared-inbox認可テストを維持する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: bug
- 判定: Confirmed
- ラベル候補: bug
- 関連Issue: [#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: UX-003
- Phase: 2


---

<a id="ax-001"></a>

## AX-001: [Accessibility] 回答・削除確認の表示と消失にフォーカス管理を加える

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

回答・削除確認の表示と消失にフォーカス管理を加える。判定はConfirmed。

### 背景・問題

QRはfocus処理済みだがInboxの回答/削除は条件描画だけ。Member削除では起点ボタンも確認UIへ置換され、キャンセル/カード消失時の復帰先指定がない。実読み上げ影響は別途検査が必要。

### 根拠

[src/components/inbox.tsx:64](<../src/components/inbox.tsx>)、[src/components/answer-form.tsx:24](<../src/components/answer-form.tsx>)、[src/components/box-members.tsx:39](<../src/components/box-members.tsx>)、[src/components/share-button.tsx:43](<../src/components/share-button.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

展開時に入力/確認見出しへ移動し、取消時に起点へ戻す。回答・削除後は次のカードまたは一覧見出しへ移動し、結果を通知する。インライン確認に不要なmodal roleは付けない。

### 実装タスク

- [ ] 回答開始と削除確認の移動先、取消の起点、消失後の次カード/見出しを定義する
- [ ] refと安定した見出しを使い、成功/外部削除/空一覧のfocusを管理する
- [ ] キーボードactiveElementテストと読み上げ手順を追加する

### 受け入れ条件

- [ ] 回答/質問削除/Member削除/取消をキーボードだけで完了できる
- [ ] 対象消失後は存在する次操作/一覧見出しへfocusが移り、成功結果を通知する
- [ ] インラインUIに不要なmodal role/focus trapを付けず、既存QR復帰を維持する

### 影響範囲

回答/質問削除/Member削除のインラインUI。購読更新で対象が消えるケース、不要なmodal role/trap導入に注意。DB変更不要。

### テスト方法

ReactでactiveElementを検査し、実ブラウザでTab/Shift+Tab/取消/リアルタイム消失を確認。VoiceOver等の結果を記録する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: bug
- 判定: Confirmed
- ラベル候補: accessibility, bug
- 関連Issue: [#20](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/20)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: AX-001
- Phase: 2


---

<a id="ax-002"></a>

## AX-002: [Accessibility] 入力エラーを対象フィールドと関連付ける

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

入力エラーを対象フィールドと関連付ける。判定はConfirmed。

### 背景・問題

SharedBoxFormのSLUG_TAKENはalertに出るがslug入力との関連がない。投稿/回答は文字数関連のみでinvalid状態を示さない。ただしrequired/pattern/maxLengthのnative検証は既にあるので全validation欠落とは扱わない。

### 根拠

[src/components/shared-box-form.tsx:54](<../src/components/shared-box-form.tsx>)、[src/components/shared-box-form.tsx:74](<../src/components/shared-box-form.tsx>)、[src/components/question-composer.tsx:33](<../src/components/question-composer.tsx>)、[src/components/answer-form.tsx:28](<../src/components/answer-form.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

検証エラーをフィールド別に保持して説明IDを関連付け、必要に応じ最初の問題へフォーカスを移す。通信エラーと入力エラー、成功通知を区別する。

### 実装タスク

- [ ] serverのfield errorと通信/認可エラーを分ける
- [ ] 対象入力へaria-invalidとerror説明IDを関連付ける
- [ ] 空白/上限超過の説明を入力と結び、修正時にinvalidを解除する
- [ ] native検証と二重送信防止を維持し、読み上げ手順を追加する

### 受け入れ条件

- [ ] slug重複はslug、名前空白はname、本文上限超過は対象textareaと関連する
- [ ] 通信エラーを無関係な全入力のinvalidにせず、修正方法を通知する
- [ ] 修正後は古いerror/invalidを除去し、失敗時の入力保持とnative制約を維持する

### 影響範囲

質問/回答/共有箱フォーム。native検証・入力保持・通信エラーとの区別・過剰な読み上げを保つ。DB変更不要。

### テスト方法

box-management/question-composer/answer-formテストでaria-describedby参照の存在とinvalid解除を検査し、ブラウザnative検証/読み上げを確認する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: bug
- 判定: Confirmed
- ラベル候補: accessibility, bug
- 関連Issue: [#20](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/20)、[#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: AX-002
- Phase: 2


---

<a id="be-002"></a>

## BE-002: [Backend] 期限切れレート制限・招待の保持期限を定める

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

期限切れレート制限・招待の保持期限を定める。判定はEnhancement。

### 背景・問題

異なるclientIdの行とaccepted/revoked/expired招待の削除処理・cronはリポジトリにない。同一IDは再利用される。蓄積は確認できるが容量超過/外部cleanup不在は断定できず、保持ポリシーの品質改善として扱う。

### 根拠

[convex/questions.ts:20](<../convex/questions.ts>)、[convex/invitations.ts:32](<../convex/invitations.ts>)、[convex/schema.ts:45](<../convex/schema.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

用途別の保持期間と期限indexを定め、少量ずつ実行する内部クリーンアップを用意する。受諾済みリンクの冪等性・削除後の再参加拒否を維持する。

### 実装タスク

- [ ] テーブル別の保持期間とacceptedリンク再試行の契約を文書化する
- [ ] 期限indexと認証不要に外部公開しない上限付き内部削除バッチを用意する
- [ ] 既存accepted冪等性を保つtombstone等を設計し、単純削除でINVITE_ACCEPTED契約を失わない
- [ ] 停止/再実行・境界時刻・有効行保護のテストを追加する

### 受け入れ条件

- [ ] 期限内の制限・pending招待を削除しない
- [ ] 1回のバッチ件数上限を設定し、再実行で安全に期限外データを整理する
- [ ] accepted再試行とremoved Memberの再参加拒否を既存契約通り維持する

### 影響範囲

questionRateLimits/boxInvitationsと内部定期処理。現行レート制限とaccepted再試行、削除Memberの再参加拒否を維持する。

### テスト方法

fake clockで期限境界とバッチ続行を検査。invitations.test.tsのaccepted/revoked/expired/removed-member契約を実行する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: enhancement
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#7](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/7)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: BE-002
- Phase: 3


---

<a id="perf-001"></a>

## PERF-001: [Performance] Inboxの増大windowと全箱ファンアウトを制限する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

Inboxの増大windowと全箱ファンアウトを制限する。判定はConfirmed。

### 背景・問題

numItemsをMath.maxのみで扱いアプリ上限がない。UIも20ずつ無制限拡大し、box指定時にも全membershipをcollect、全箱は各箱count+1件取得後にmergeする。アプリ側boundedというコメントは総量上限を保証しない。実測遅延/基盤制限の突破は未確認。

### 根拠

[convex/questions.ts:36](<../convex/questions.ts>)、[convex/questions.ts:53](<../convex/questions.ts>)、[src/components/inbox.tsx:17](<../src/components/inbox.tsx>)、[src/components/inbox.tsx:37](<../src/components/inbox.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

numItemsを有限整数・上限付きに検証し、箱指定時は全membership列挙を省く。全箱は上限付きリアルタイムwindowと過去履歴の分離、または集約indexを比較する。必要なら表示を仮想化する。

### 実装タスク

- [ ] numItemsに整数・正値・上限を定義し、指定箱ではその箱の認可と読取へ絞る
- [ ] 代表データを計測し、最新window上限と過去履歴のページ取得方式を選ぶ
- [ ] 負荷予算を記録し、履歴移動/新着更新/参加解除の一貫性を保証する
- [ ] 既存の拡大window回帰テストを新仕様の重複/欠落検査へ更新する

### 受け入れ条件

- [ ] 上限超過・非整数・非正値の直接呼出しを明示的に拒否/正規化する
- [ ] 箱指定の候補読取は他箱の質問数に依存しない
- [ ] 1/10/100箱と100/10000質問で読取数・応答時間・DOM数を記録し、承認した予算以内にする
- [ ] 削除/回答/新着/同時刻/参加解除で重複・欠落・private漏洩を生まない

### 影響範囲

全箱/箱別Inbox、membership/質問index、購読window。最新更新時の重複/欠落/認可が重要な回帰リスク。

### テスト方法

shared-inbox.test.tsの69/86/99行のケースを維持。隔離fixtureで基準値を測り、予算未達はIssueを完了にしない。実測前に仮想化や集約tableを必須化しない。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: L
- 種別: bug
- 判定: Confirmed
- ラベル候補: bug
- 関連Issue: [#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)
- 依存関係: [UX-001](#ux-001)
- 元の改善点ID: PERF-001
- Phase: 3


---

<a id="perf-002"></a>

## PERF-002: [Performance] 箱・メンバー・招待の一覧取得をページ化する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

箱・メンバー・招待一覧に取得上限とページングを設ける。判定はEnhancement。

### 背景・問題

listMine/members/pendingにcollectと関連box/user取得がある。公開feedのpaginateは既にあるので対象外。現在規模の遅延証拠はなく、大量利用への一覧品質改善。発行rate制限は本Issueに詰め込まず、測定後の別判断。

### 根拠

[convex/boxes.ts:57](<../convex/boxes.ts>)、[convex/invitations.ts:69](<../convex/invitations.ts>)、[convex/invitations.ts:84](<../convex/invitations.ts>)、[src/components/box-members.tsx:62](<../src/components/box-members.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

画面一覧と認可/箱選択用取得の契約を分け、ページ上限/cursorを定義する。3一覧へindexを使った上限付き取得とページ操作を追加する。

### 実装タスク

- [ ] 画面一覧と認可/箱選択用取得の契約を分け、ページ上限/cursorを定義する
- [ ] 3一覧へindexを使った上限付き取得とページ操作を追加する
- [ ] expired招待表示を区別し、権限喪失時は取得を停止する
- [ ] 大量fixtureと全件到達/箱filter連携の回帰テストを追加する

### 受け入れ条件

- [ ] 1000箱/membership・1000Member・1000招待fixtureで1応答が設定上限以下となる
- [ ] ページを進めて全件を重複なく取得し、箱filterは未ロード箱を不正と誤判定しない
- [ ] Memberはpending招待を取得できず、非参加者は一覧を取得できない

### 影響範囲

箱一覧・メンバー・未使用招待API/UI。paginationでOwnerや選択中の箱を見失う、filter用listMineの契約破壊に注意。

### テスト方法

boxes/invitationsテストで固定fixtureとcursor traversalを検査し、box-list/box-members/inboxのUI連携を確認する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: L
- 種別: enhancement
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: PERF-002
- Phase: 3


---

<a id="mt-003"></a>

## MT-003: [Operations] 障害通知・DB復元演習の運用手順を整備する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

監視・復旧・環境分離の運用手順を具体化する。判定はEnhancement。

### 背景・問題

deploymentには環境分離とfrontend rollbackがあり、完全な運用手順不在という指摘は過大。追加で通知/RPO/RTO/DB復元演習の実施記録が見当たらない点に絞る。Dashboard設定は未確認。

### 根拠

[docs/deployment.md:13](<../docs/deployment.md>)、[docs/deployment.md:94](<../docs/deployment.md>)、[docs/public-test-environment.md:3](<../docs/public-test-environment.md>)、[src/app/error.tsx:2](<../src/app/error.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

既存の環境分離・frontend rollback手順を再利用し、追加で通知・RPO/RTO・隔離DB復元の具体的手順と演習証跡を整備する。

### 実装タスク

- [ ] 外部Dashboardの既存設定と環境対応表を棚卸しし、既存環境分離手順を再利用する
- [ ] 担当/連絡先・通知基準・RPO/RTO・バックアップ/復元手順を定義する
- [ ] SEC-003のURL秘匿化条件を監視設定へ適用する
- [ ] 隔離環境で復元演習し、schema/index/認可/公開privateを検査する

### 受け入れ条件

- [ ] 検知→切り分け→復旧の担当と手順、目標RPO/RTOを記録する
- [ ] 隔離復元の対象commit/バックアップ日時/復元所要時間/整合性検査を残す
- [ ] 本番DBを試験で上書きせず、本文/token/JWTを監視ログへ送らない

### 影響範囲

運用文書・監視・DBバックアップ/復元と隔離検証環境。本番データ上書きやtokenログ出力を避ける。

### テスト方法

復元演習の結果と認可/行数/公開privateをレビュー。現行のdeploy/rollback文書と環境対応が一致するか確認する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: L
- 種別: documentation
- 判定: Enhancement
- ラベル候補: documentation
- 関連Issue: [#17](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/17)、[#22](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/22)、[#23](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/23)、[#24](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/24)
- 依存関係: [SEC-003](#sec-003)
- 元の改善点ID: MT-003
- Phase: 3


---

<a id="ax-003"></a>

## AX-003: [Accessibility] WCAGの検証範囲を自動・手動の両方で広げる

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

WCAGの検証範囲を自動・手動の両方で広げる。判定はEnhancement。

### 背景・問題

lang/label/contrast/focus-visible/reduced-motionと部分検査はある。包括的axe/拡大/実読み上げの記録はない。WCAG違反の断定ではなく検証範囲の追加。

### 根拠

[src/app/layout.tsx:19](<../src/app/layout.tsx>)、[src/app/globals.css:35](<../src/app/globals.css>)、[e2e/smoke.spec.ts:38](<../e2e/smoke.spec.ts>)、[docs/mobile-validation.md:1](<../docs/mobile-validation.md>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

代表画面へaxe等の検査を導入し、キーボード順序・200/400%拡大・スクリーンリーダー・実機Clerk UIを手動検証する。本文へスキップするリンクの必要性も確認する。

### 実装タスク

- [ ] 代表画面/状態とWCAG 2.2 AAの対象/対象外を対応表にする
- [ ] 既存ブラウザ検査へ自動a11y検査を追加する
- [ ] 200/400%拡大・キーボード・VoiceOver等・実機Clerk UIを手動検査する
- [ ] 結果/再現条件/残課題を記録し、具体的な障壁のみ修正候補にする

### 受け入れ条件

- [ ] 対象画面とloading/error/form展開状態の自動検査結果を記録する
- [ ] 拡大/キーボード/読み上げ/実機認証について端末と結果を記録する
- [ ] 対象外と未解決項目を明示し、検査未実施を合格としない

### 影響範囲

代表画面/動的状態/Clerk UIのアクセシビリティ検証。自動検査だけで準拠を宣言しない。

### テスト方法

e2e/smoke.spec.tsの実markup fixtureと隔離実接続の画面で検査し、manual matrixを残す。AX-001/002の動的操作を含める。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: M
- 種別: testing
- 判定: Enhancement
- ラベル候補: accessibility, enhancement
- 関連Issue: [#15](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/15)、[#20](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/20)、[#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)
- 依存関係: [AX-001](#ax-001)、[AX-002](#ax-002)
- 元の改善点ID: AX-003
- Phase: 3


---

<a id="be-003"></a>

## BE-003: [Backend] 共有操作の追跡に必要な監査情報を残す

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

共有操作の追跡に必要な監査情報を残す。判定はEnhancement。

### 背景・問題

Answer.authorUserIdはあるが、setVisibility/remove/updateSharedに操作履歴tableへのinsertはない。監査必須の現行仕様はないため新機能として扱う。

### 根拠

[convex/answers.ts:15](<../convex/answers.ts>)、[convex/questions.ts:72](<../convex/questions.ts>)、[convex/questions.ts:79](<../convex/questions.ts>)、[convex/boxes.ts:95](<../convex/boxes.ts>)、[convex/schema.ts:8](<../convex/schema.ts>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

操作対象・認証済み実行者・時刻・変更項目を最小限の監査イベントとして同一transactionで保存する。質問本文・匿名clientId・raw tokenは複製せず保持期限とOwner限定閲覧を設ける。

### 実装タスク

- [ ] 対象操作、最小event schema、保持期限、Owner閲覧権限を決める
- [ ] 認証済み実行者/対象/時刻/変更項目を管理mutationと原子的に保存する
- [ ] Owner限定取得と保持処理を追加し、失敗操作・匿名投稿を追跡しない
- [ ] 認可と秘匿化のテスト/運用説明を追加する

### 受け入れ条件

- [ ] 公開変更・質問削除・箱設定変更の成功イベントをOwnerだけが取得できる
- [ ] 質問本文・削除本文・raw token・匿名clientIdを複製しない
- [ ] mutation失敗時は成功eventを作らず、保持期限外eventを上限付きで整理できる

### 影響範囲

共有管理mutation、追加監査table/Owner閲覧。削除本文復元・投稿者識別の副作用を避ける。

### テスト方法

Convexテストで操作とeventの整合性、Member/非参加者拒否、機微field不在と保持期限を検査する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Medium
- 工数: L
- 種別: enhancement
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)、[#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: BE-003
- Phase: 4


---

<a id="pv-001"></a>

## PV-001: [Product] イベントの受付終了・アーカイブ需要と採否を決める

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

イベントでの受付終了・アーカイブ需要を検証する。判定はEnhancement。

### 背景・問題

schemaに受付終了属性がなくsubmitは存在する箱へ投稿できる。これは現行MVPの不具合ではなく需要仮説。今回は需要調査と仕様判断のみのIssueにし、実装は採用後の別候補とする。

### 根拠

[convex/schema.ts:20](<../convex/schema.ts>)、[convex/questions.ts:13](<../convex/questions.ts>)、[docs/product-spec.md:11](<../docs/product-spec.md>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

イベント主催者3組以上へ終了後の運用と困り事を調査する。受付停止/公開アーカイブ/再開を分けた選択肢を比較する。本Issueは調査・採否決定まで。採用後の実装を未検証のまま要求しない。

### 実装タスク

- [ ] イベント主催者3組以上へ終了後の運用と困り事を調査する
- [ ] 受付停止/公開アーカイブ/再開を分けた選択肢を比較する
- [ ] 採否と優先度を記録し、採用時のみbackend拒否を含む実装仕様を作る

### 受け入れ条件

- [ ] 対象者3組以上の匿名化した結果と採用/保留/不採用理由がある
- [ ] 採用時に終了画面・直接API拒否・再開・既存Q&A保持の受け入れ基準を決める
- [ ] 需要確認前にschema変更やarchiveを必須化しない

### 影響範囲

イベント運用と受付終了の将来仕様。既存Q&A/公開モード/再開/直接APIを維持する設計判断が必要。DB変更は調査段階では行わない。

### テスト方法

調査結果のレビューで対象数・困り事・採否・仕様の整合性を確認。採用後の別実装では終了/再開/直接API/データ保持テストを計画する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Low
- 工数: M
- 種別: enhancement
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#1](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/1)、[#33](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/33)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: PV-001
- Phase: 4


---

<a id="pv-002"></a>

## PV-002: [Product] 本人退出・Owner移譲の需要と運用方針を決める

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

共有参加の退出・所有者引継ぎの方針を定める。判定はEnhancement。

### 背景・問題

removeMemberはOwner自身削除を拒否し、本人退出/Owner移譲APIはない。#31も他Owner追加をMVP対象外とする。現行欠陥ではなく継続運用の方針策定とする。退出と移譲の実装は独立するため今回一括実装を指示しない。

### 根拠

[convex/invitations.ts:103](<../convex/invitations.ts>)、[convex/lib/access.ts:50](<../convex/lib/access.ts>)、[docs/product-spec.md:158](<../docs/product-spec.md>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

継続利用団体3組以上へ退会/代替わりの頻度と対応を調査する。本人退出と受諾付きOwner移譲を別々に採否判断する。本Issueは調査・採否決定まで。採用後の実装を未検証のまま要求しない。

### 実装タスク

- [ ] 継続利用団体3組以上へ退会/代替わりの頻度と対応を調査する
- [ ] 本人退出と受諾付きOwner移譲を別々に採否判断する
- [ ] 採用案では原子的なownerUserId/membership変更、旧Owner権限、招待継続性を定義する
- [ ] 設計レビュー後に退出/移譲を独立した実装候補へ分ける

### 受け入れ条件

- [ ] 本人退出/移譲それぞれの採否と理由を記録する
- [ ] 採用案で最後のOwner消失を防ぎ、旧Owner/新Owner/退出者の全API権限表がある
- [ ] 過去Answerを保持し、未承諾の所有者移譲を許さない設計である

### 影響範囲

共有運営の権限モデルと将来membership/ownerUserId移行。最後のOwner消失・過去Answer削除・権限残存を避ける。

### テスト方法

現行role契約との設計照合と権限表レビュー。実装前に同時操作・途中失敗・受諾/拒否・退出後のprivate拒否のテスト計画を分割する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Low
- 工数: L
- 種別: enhancement
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#29](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/29)、[#31](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/31)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: PV-002
- Phase: 4


---

<a id="pv-003"></a>

## PV-003: [Product] ターゲット別の成功指標を設定して価値を検証する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

ターゲット別の成功指標を設定して価値を検証する。判定はEnhancement。

### 背景・問題

リポジトリは用途/導線を示すが成功指標や調査計画を定めない。外部分析基盤不在や市場不適合は断定しない。利用価値の検証計画を作る提案。

### 根拠

[docs/product-spec.md:7](<../docs/product-spec.md>)、[src/app/page.tsx:3](<../src/app/page.tsx>)、[README.md:90](<../README.md>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

現行の外部分析/調査の有無を確認し、重複計測を避ける。箱作成→共有→受信→回答の定義/期間/目標と匿名集計単位を決める。本Issueは調査・採否決定まで。採用後の実装を未検証のまま要求しない。

### 実装タスク

- [ ] 現行の外部分析/調査の有無を確認し、重複計測を避ける
- [ ] 箱作成→共有→受信→回答の定義/期間/目標と匿名集計単位を決める
- [ ] 同意/保持期間/集計方法を文書化し、小規模試用とインタビューを行う
- [ ] 結果を見て追加機能の採否を決める

### 受け入れ条件

- [ ] 測定定義・目標値・期間・担当・外部計測との役割を記録する
- [ ] 本文/raw token/匿名clientId/生IPを収集せず、同意と保持方針をレビューする
- [ ] 試用結果と次回利用意向に基づく採否があり、需要をコードだけで断定しない

### 影響範囲

部会試用・調査計画。匿名性/同意・質問本文/tokenを収集しないことを優先。

### テスト方法

測定仕様レビューと匿名化集計fixtureで計算を検証。実試用結果は#25と対応を記録する。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Low
- 工数: M
- 種別: enhancement
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#1](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/1)、[#25](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/25)
- 依存関係: 先行実装依存なし（既存の認可・MVP契約を維持）
- 元の改善点ID: PV-003
- Phase: 4


---

<a id="fe-003"></a>

## FE-003: [Frontend] 反復する管理操作のfeedbackを小さく共通化する

登録状態: 未登録。以下の「概要」以降を本文として使用する。

### 概要

反復する認証待ち・操作状態を小さな共通処理へ整理する。判定はEnhancement。

### 背景・問題

performや認証queryの反復はあるが現行誤動作や再レンダリング問題を示す証拠はない。任意の小規模整理としてのみ扱い、FE-001と同じready状態の抽出を二重実装しない。

### 根拠

[src/components/inbox.tsx:47](<../src/components/inbox.tsx>)、[src/components/box-members.tsx:22](<../src/components/box-members.tsx>)、[src/components/box-settings.tsx:20](<../src/components/box-settings.tsx>)。行番号はHEAD `71d31d1`のローカル検証時点。

### 改善方針

FE-001完了後に残る操作feedback反復だけを棚卸しする。同じ契約のpending/error/status処理に限定して小さな部品/hookを抽出する。

### 実装タスク

- [ ] FE-001完了後に残る操作feedback反復だけを棚卸しする
- [ ] 同じ契約のpending/error/status処理に限定して小さな部品/hookを抽出する
- [ ] 公開警告と認可/二重送信lockを各責務に残し、既存UIテストを維持する

### 受け入れ条件

- [ ] 既存の失敗時入力保持/二重送信防止/role制約/公開警告を維持する
- [ ] 共通feedback変更を1箇所で反映でき、backend/API/schemaを変更しない
- [ ] 反復削減の対象と効果を説明し、巨大な汎用フォームへ置換しない

### 影響範囲

所有者UI内の操作feedback。公開警告/role/フォーム固有validationを過度に汎用化しない。DB/API変更不要。

### テスト方法

既存inbox/box-management/invitation-ui/answer-formテストで成功/失敗/pendingを回帰確認。性能改善とは主張しない。

コード実装を行う将来作業では変更箇所に対応する回帰テストを追加し、`npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`を実行する。画面変更はブラウザ検査を含める。調査/文書のみのIssueでは結果と根拠のレビューを合格条件とする。

### メタデータ

- 優先度: Low
- 工数: M
- 種別: refactor
- 判定: Enhancement
- ラベル候補: enhancement
- 関連Issue: [#11](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/11)、[#30](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/30)、[#32](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/32)
- 依存関係: [FE-001](#fe-001)
- 元の改善点ID: FE-003
- Phase: 4


## 新規作成しない項目と既存Issueへの追記案

### MT-001 / MT-002 → 既存 #34・#25

主担当: [#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)（Open）。公開テスト判定は[#25](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/25)（Open）。判定Duplicateは問題解決を意味しない。以下は既存Issueへの追記案であり、今回は送信していない。

- [ ] 個人/共有のOwner・Member・非参加者・匿名の通し検証を、Clerk JWTとConvexへ実通信する隔離環境で行う。commit、実施日時、環境、端末、操作結果と未確認範囲を秘匿化して記録する。
- [ ] 招待受諾/失効/期限切れ、private除外、Owner限定削除、Member削除後拒否、箱分離を確認する。keyless smoke/fixtureを実接続成功の証跡として使わない。
- [ ] product-specの140/142/153行付近の後続実装・無効ボタン記述を現行へ更新し、READMEの存在しないsrc/typesを整理する。acceptanceに共有フローとrole表を追加し、過去検証記録は日時付き履歴として残す。
- [ ] 本候補のSEC-001/UX-002/UX-001/BE-001等が登録された後、#34/#25と実番号で相互参照し、機能修正後に再検証する。

受け入れ条件: 個人/共有×各roleの実通信結果、privateと削除後拒否の証跡、現行仕様と手順の一致があり、#25の「試用投入可否」と正式Production判定を区別できる。

### 重複防止の根拠

[#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)のScenario A〜IとDocs節、[#25](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/25)のScenario 1〜9を比較して既存追跡を採用した。Closed #18は個人箱受け入れ、Closed #15/#20は一般的UI改善であり、新たな全状態a11y検査（AX-003）と特定のfocus/error関連付け（AX-001/002）の完了証跡ではない。BE-002の保持、BE-003の監査、PVの需要検証、性能上限に同目的の既存Issueは確認できなかった。
