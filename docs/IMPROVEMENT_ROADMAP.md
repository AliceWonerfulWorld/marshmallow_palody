# 改善ロードマップ

2026-10-14。対象HEAD `71d31d14a02b995017948efb227551547e003795`。GitHub登録は今回行わない。候補21件は元IDで追跡し、実番号/URLは未登録とする。既存Issueは実番号/URLを利用。[精査結果](PRODUCT_IMPROVEMENTS_REVIEWED.md)、[Issue本文](GITHUB_ISSUES.md)。

Phaseは作業目的の分類であり、全項目を順番待ちにする意味ではない。最優先はSEC-001/UX-002/UX-001/BE-001/既存#34。#34/#25のベースライン確認とPhase 1の調査は早期開始し、最終受け入れは対象修正後。需要検証は並行開始できるが追加機能実装は採用後。

## Phase 1：重大な不具合・セキュリティ修正

実装目的: Criticalな障害は未確認。公開募集時の追加連投防御、開発依存の露出管理、招待URLログの検証を行う。Phase名をCritical存在の証拠にしない。

| 推奨順 | 対応Issue / 元ID | GitHub番号・URL | 優先度 / 工数 | 依存・調整 | 完了条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | [SEC-001: [Security] 匿名clientIdを替える連投への防御を追加する](GITHUB_ISSUES.md#sec-001) | 未登録 | High / L | なし | Nextを経由しないConvex呼出しも証明なし/不正証明なら拒否する |
| 2 | [SEC-002: [Security] lint依存のbraces脆弱性を追跡する](GITHUB_ISSUES.md#sec-002) | 未登録 | Medium / S | なし | 警告5件を同一原因として管理し、本番API重大脆弱性5件と報告しない |
| 3 | [SEC-003: [Security] 招待URLの外部ログ記録と保持設定を検証する](GITHUB_ISSUES.md#sec-003) | 未登録 | Medium / M | なし | 各ログ経路についてraw token記録の有無、アクセス権、保持期間を結果表に残す |

Phase全体の完了条件: 直接Convex投稿の追加防御が検査済み、匿名正規利用が可能。依存警告は解消または期限付き例外管理。招待ログ経路の結果/未確認が明確で、発見した漏洩は別修正の投入判断へ反映。

## Phase 2：ユーザー体験と主要機能の改善

実装目的: 投稿前の公開判断、回答閲覧と順序、同期/競合/filter/キーボード操作を改善し、既存受け入れIssueで実通信と仕様の一致を確認する。

| 推奨順 | 対応Issue / 元ID | GitHub番号・URL | 優先度 / 工数 | 依存・調整 | 完了条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | [UX-002: [UI/UX] 投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する](GITHUB_ISSUES.md#ux-002) | 未登録 | High / S | なし | 全6組合せで現在モードと未回答質問を読める人が送信前に分かる |
| 2 | [UX-001: [UI/UX] 回答済みInboxから非公開の回答も確認できるようにする](GITHUB_ISSUES.md#ux-001) | 未登録 | High / M | なし | 個人Ownerと共有Owner/Memberはprivateを含む回答本文を確認できる |
| 3 | [BE-001: [Backend] 公開Q&Aを回答日時順にする](GITHUB_ISSUES.md#be-001) | 未登録 | High / M | なし | A→Bの投稿、B→Aの回答でA→Bの公開順になる |
| 4 | [FE-001: [Frontend] ユーザー同期の準備状態を画面全体で共有する](GITHUB_ISSUES.md#fe-001) | 未登録 | Medium / M | なし | 同期失敗時は通常loadingと区別した説明/再試行を対象画面に表示する |
| 5 | [FE-002: [Frontend] 共有設定の競合更新と古いフォーム値を扱う](GITHUB_ISSUES.md#fe-002) | 未登録 | Medium / M | なし | Aがモード変更後、古いBが名前変更を保存してもAのモードを無言で戻さない |
| 6 | [UX-003: [UI/UX] 無効な箱フィルターを全箱表示へ黙って置換しない](GITHUB_ISSUES.md#ux-003) | 未登録 | Medium / M | なし | 指定IDが不正/未認可/参加解除なら別箱質問を自動表示しない |
| 7 | [AX-001: [Accessibility] 回答・削除確認の表示と消失にフォーカス管理を加える](GITHUB_ISSUES.md#ax-001) | 未登録 | Medium / M | なし | 回答/質問削除/Member削除/取消をキーボードだけで完了できる |
| 8 | [AX-002: [Accessibility] 入力エラーを対象フィールドと関連付ける](GITHUB_ISSUES.md#ax-002) | 未登録 | Medium / M | なし | slug重複はslug、名前空白はname、本文上限超過は対象textareaと関連する |
| 既存・早期着手/修正後再検査 | MT-001・MT-002を集約した共有受け入れ/Docs同期 | [#34](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/34)（Open） | High / L（実接続含む補足範囲の概算） | #29〜33はClosed。各主要修正後に最終再検査 | 個人/共有/招待/role/private/参加解除の実通信結果と現行文書が揃う |
| #34と連携して最終判定 | MT-001の公開テスト投入判定 | [#25](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/25)（Open） | High / L（実機検査を含む概算） | 既存#22〜24はClosed、#34の共有検証と連携 | 部会試用投入可否を記録し、正式Production判定と分ける |

Phase全体の完了条件: 6種類の公開説明、private回答の認可済み閲覧、回答新着ページング、同期/設定競合/filter回復、動的focus/入力errorの各条件を満たす。#34/#25の実接続結果と現行仕様同期が完了し、投入可否を記録する。

## Phase 3：コード品質とテストの強化

実装目的: 既存機能と認可を保ったまま取得/保持を制限し、a11y検査・復旧運用を強化する。実測前に不要なDB集約やUI仮想化を確定しない。

| 推奨順 | 対応Issue / 元ID | GitHub番号・URL | 優先度 / 工数 | 依存・調整 | 完了条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | [BE-002: [Backend] 期限切れレート制限・招待の保持期限を定める](GITHUB_ISSUES.md#be-002) | 未登録 | Medium / M | なし | 期限内の制限・pending招待を削除しない |
| 2 | [PERF-001: [Performance] Inboxの増大windowと全箱ファンアウトを制限する](GITHUB_ISSUES.md#perf-001) | 未登録 | Medium / L | UX-001 | 上限超過・非整数・非正値の直接呼出しを明示的に拒否/正規化する |
| 3 | [PERF-002: [Performance] 箱・メンバー・招待の一覧取得をページ化する](GITHUB_ISSUES.md#perf-002) | 未登録 | Medium / L | なし（UX-003と箱選択契約を調整） | 1000箱/membership・1000Member・1000招待fixtureで1応答が設定上限以下となる |
| 4 | [MT-003: [Operations] 障害通知・DB復元演習の運用手順を整備する](GITHUB_ISSUES.md#mt-003) | 未登録 | Medium / L | SEC-003 | 検知→切り分け→復旧の担当と手順、目標RPO/RTOを記録する |
| 5 | [AX-003: [Accessibility] WCAGの検証範囲を自動・手動の両方で広げる](GITHUB_ISSUES.md#ax-003) | 未登録 | Medium / M | AX-001、AX-002 | 対象画面とloading/error/form展開状態の自動検査結果を記録する |

Phase全体の完了条件: 期限データを安全な有限バッチで扱い、代表規模の一覧/Inboxが決めた予算内。復旧演習と対象a11y検査の証跡があり、認可/同時更新/参加解除の回帰を維持する。

## Phase 4：追加機能・長期的な最適化

実装目的: 監査履歴以外のPV提案はまず需要/方針検証まで。任意整理は主要問題の修正後に行い、MVP対象外機能の欠落を不具合扱いしない。

| 推奨順 | 対応Issue / 元ID | GitHub番号・URL | 優先度 / 工数 | 依存・調整 | 完了条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | [BE-003: [Backend] 共有操作の追跡に必要な監査情報を残す](GITHUB_ISSUES.md#be-003) | 未登録 | Medium / L | なし | 公開変更・質問削除・箱設定変更の成功イベントをOwnerだけが取得できる |
| 2 | [PV-001: [Product] イベントの受付終了・アーカイブ需要と採否を決める](GITHUB_ISSUES.md#pv-001) | 未登録 | Low / M | なし | 対象者3組以上の匿名化した結果と採用/保留/不採用理由がある |
| 3 | [PV-002: [Product] 本人退出・Owner移譲の需要と運用方針を決める](GITHUB_ISSUES.md#pv-002) | 未登録 | Low / L | なし | 本人退出/移譲それぞれの採否と理由を記録する |
| 4 | [PV-003: [Product] ターゲット別の成功指標を設定して価値を検証する](GITHUB_ISSUES.md#pv-003) | 未登録 | Low / M | なし | 測定定義・目標値・期間・担当・外部計測との役割を記録する |
| 5 | [FE-003: [Frontend] 反復する管理操作のfeedbackを小さく共通化する](GITHUB_ISSUES.md#fe-003) | 未登録 | Low / M | FE-001 | 既存の失敗時入力保持/二重送信防止/role制約/公開警告を維持する |

Phase全体の完了条件: BE-003採用時はOwner限定最小監査と保持が動作。PV各調査は採否と理由を記録し、採用時は別実装Issueに分割する。FE-003はFE-001後に既存feedback契約を壊さず反復を整理する。

## 依存関係と回帰維持

UX-001 → PERF-001（回答join込みの計測）、SEC-003 → MT-003（監視の秘匿化）、AX-001/AX-002 → AX-003（最終検査）、FE-001 → FE-003（準備状態を二重抽出しない）。PERF-002とUX-003は取得ページ化と選択箱確認の契約を合わせる。各候補から既存機能Issueを参照し、Closed機能全体の再実装をしない。

維持する契約: legacy personal、slug不変、Owner/Member/非参加者のbackend認可、Member削除後拒否、回答/招待の一意性、privateの公開除外、匿名投稿者情報非保存、モード変更で既存質問不変、失敗時入力保持/二重送信防止。migration/保持/性能変更は同じ契約の回帰テストを合格条件にする。

## 登録・再実行時の追跡

今回は全候補が未登録であり番号を割り振らない。将来登録時は全Open/Closed本文を再取得し、目的・元ID・完了条件が一致すれば既存を再利用する。MT-001/002を独立新規Issueにしない。登録した実番号/URLをこの表とIssue準備書に反映し、関連Issueへ逆参照を追加する。Closedを再開するかは解決履歴と現行証拠を確認して判断する。

日程は固定しない。S=数時間、M=半日〜1日、L=2〜3日の概算で、外部調査/ユーザー調査待ちやmigrationの設計次第で延びる。Phase 4のLow調査/任意整理はHigh/Mediumの完了を妨げない。
