# プロダクト総合改善レポート

## 1. 総合評価

レビュー日: 2026-10-14（Asia/Tokyo）。対象: ローカルHEAD `9210259`。開始時の追跡ファイル差分なし。レビューによる変更は本レポートのみ。

### プロダクト概要

匿名質問の募集・公開・回答を行う質問箱サービス。未回答の質問を公開できる点が中心価値で、部会・学生団体・配信・イベントが想定用途。個人箱に加え、Owner/Memberで運営する共有箱、単回・7日期限の招待が実装済み。個人箱 `/u/[username]`、共有箱 `/b/[slug]`、全箱/箱別Inbox、回答・公開切替・Owner限定削除、設定・メンバー管理、URLコピー/Web Share/QR共有を提供する。

### 技術スタックと構成

Next.js 16.4.0 App Router / React 19.3 / TypeScript strict / Tailwind CSS 4、Clerk認証、Convexのreactive query・mutation・Node action・DB。Vitest / React Testing Library / convex-test / Playwright、npm、GitHub Actions。Vercel向け手順あり。

`src/app`は公開/認証ページとowner layout、`src/components`はUIと購読、`src/lib`は匿名ID。匿名投稿はNext Server Action→Convex mutation、それ以外の管理は主にConvex React APIを使う。DBはusers・questionBoxes・boxMembers・boxInvitations・questions・answers・questionRateLimitsの7テーブル。`convex/lib/access.ts`で検証済みidentityとmembershipによる認可を共通化している。

### 現状の強み

- private質問は公開queryで除外され、公開返却値は必要項目へ絞られる。投稿者のClerk ID・氏名・生IP・匿名clientIdをQuestionへ保存しない。
- 共有箱のOwner/Member認可、Ownerのみ削除、参加解除後の即時拒否、同時回答/同時招待受諾の一意性をテストしている。UIだけの認可ではない。
- 本文の長さ・slug・予約語をサーバー検証し、Reactのテキスト描画でHTML風入力を扱う。招待は暗号学的乱数・ハッシュ保存・内部mutation再認可を実装する。
- loading/empty/error・失敗時入力保持・回答の公開警告・削除確認・共有fallback・QRのフォーカス復帰がある。
- lint/型/test/buildに加えて5画面幅のブラウザsmokeがCIにある。公開質問/Q&Aのページング、既存personal schemaの後方互換も実装済み。

### 重大な課題

Criticalと判定できるデータ漏洩・損失・主要停止は今回確認していない。優先課題は匿名IDを替える連投の防御、回答順の仕様不一致、非公開回答の管理閲覧、投稿時の閲覧範囲説明、実サービスを通した共有フローの検証である。監査のHigh 5件はlint依存の同一原因であり、公開APIの重大脆弱性5件とは扱わない。

### 評価の前提・検証結果

実行環境: Node.js v22.22.2。README・仕様・受け入れ/環境/モバイル/過去検証文書、アプリ/Convex実装、テスト、package/lock、認証proxy、CI・ビルド設定を確認。Nextのローカル同梱ガイド `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` も確認し、この版の `retry` を旧版知識で不具合扱いしていない。

| 検証 | 結果 | 範囲・制約 |
| --- | --- | --- |
| `npm run lint` | 成功 | ESLint |
| `npm run typecheck` | 成功 | Next route型生成、アプリ/Convex双方 |
| `npm test -- --run` | 成功 | 25ファイル・108テスト |
| `npm run build` | 成功 | webpack production build、全ルート生成 |
| `npm run test:smoke` | 成功 | keyless再build、fixture 1テスト、Chromium 10テスト。320/375/390/430/1440px |
| `npm audit --json` | 終了1（検出あり） | High 5、Critical 0。同一braces経路。`npm ls braces --all`でも依存経路確認 |
| 実Clerk/Convex統合・外部本番smoke | 今回未実施 | ローカル隔離検査を優先。外部書き込み禁止に従い登録・投稿・招待・設定・deployは行っていない。過去記録は今回の成功と混同しない |
| 実機/読み上げ/負荷・LCP/INP/CLS/メモリ | 未実施 | 実利用条件の計測を行っていないため、速度・WCAG準拠・実機UXを断定しない |

ブラウザsmokeは実際にローカルサーバーを起動するが、外部通信を遮断する。入力済み画面の検査は本番CSSとReact出力fixtureによるレイアウト検査であり、実認証・DB通信のE2Eではない。本レビューでは追加の目視スクリーンショット評価は行わず、UI評価はコードと既存smokeのassertionの範囲に限定する。自動smoke後の `.next` はkeyless設定で、実サービス接続へ戻すには通常build/devの再実行が必要。

`.env.local`の秘密値を出力・変更していない。現行追跡対象のenvファイルは `.env.example` のみと確認したが、Git全履歴・外部ログ・Dashboard設定の秘密情報監査までは実施していない。外部Issue参照先の内容や最新サービス制約は本レビューの根拠にしていない。

判定は「確認済み」=ローカル実装またはコマンドで事実確認、「要検証」=条件付き懸念で再現/設定確認が必要、「改善提案」=現行仕様の欠陥を断定しない追加策。工数S=数時間、M=半日〜1日、L=2〜3日、XL=4日以上で、設計・データ移行・外部環境・実機条件によって変動する概算。各完了条件は将来の実装時の受け入れ基準であり、今回の達成を示さない。

## 2. カテゴリ別評価

点数は静的レビューと上記検証に基づく相対的な品質評価で、サービス品質の保証値ではない。

| カテゴリ | 10点満点 | 採点理由・確認根拠 |
| --- | ---: | --- |
| A フロントエンド | 7 | 小さな部品・strict型・送信lock・入力保持あり。同期状態とフォーム追従に余地。`user-sync.tsx`, `shared-box-form.tsx`, `inbox.tsx` |
| B バックエンド・DB | 7 | 共通認可・index・原子的更新が強い。回答並び順と保持運用に課題。`convex/lib/access.ts`, `answers.ts`, `schema.ts` |
| C UI/UX | 6 | 共有導線・QR・空状態は整備。回答済み管理、現在の公開範囲、箱filterの扱いが弱い。`box-list.tsx`, `question-composer.tsx`, `inbox.tsx` |
| D セキュリティ | 7 | private除外・tokenハッシュ・権限テストあり。連投防御は回避容易。lint依存に監査警告。`questions.ts`, `invitations.test.ts`, audit結果 |
| E パフォーマンス | 6 | 公開一覧はindexとページングあり。全箱Inboxの増大windowとcollectが拡張上の課題。実速度は未測定。`questions.inbox`, `boxes.listMine` |
| F プロダクト価値 | 7 | 部会用途のMVP導線と差別化を実装。終了・引継ぎ・成果指標は要検証。`product-spec.md`, `box-list.tsx`。需要実証を意味しない |
| G 保守性・テスト | 8 | CI/108テスト/10ブラウザテスト・認可回帰が充実。実接続検証・最新仕様・復旧手順に余地。`.github/workflows/ci.yml`, `e2e/smoke.spec.ts` |
| H アクセシビリティ | 7 | label/landmark/focus/44px/reduced-motionあり。動的フォームとエラー関連付け・全体検証が不足。`globals.css`, `answer-form.tsx`, `share-button.tsx` |

## 3. 改善点サマリー

全23件。Critical 0件、High 5件、Medium 17件、Low 1件。同一原因はまとめ、横断課題は主カテゴリにだけ掲載した。

| ID | カテゴリ | タイトル | 優先度 | 工数 | 判定 |
| --- | --- | --- | --- | --- | --- |
| [BE-001](#be-001) | バックエンド | 公開Q&Aを回答日時順にする | High | M | 確認済み |
| [UX-001](#ux-001) | UI/UX | 回答済みInboxから非公開の回答も確認できるようにする | High | M | 確認済み |
| [UX-002](#ux-002) | UI/UX | 投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する | High | S | 確認済み |
| [SEC-001](#sec-001) | セキュリティ | 匿名clientIdを替える連投への防御を追加する | High | L | 確認済み |
| [MT-001](#mt-001) | 保守性・テスト | 実サービス接続を含む主要フローの検証を整備する | High | L | 確認済み |
| [FE-001](#fe-001) | フロントエンド | ユーザー同期の準備状態を画面全体で共有する | Medium | M | 確認済み |
| [FE-002](#fe-002) | フロントエンド | 共有設定の競合更新と古いフォーム値を扱う | Medium | M | 要検証 |
| [BE-002](#be-002) | バックエンド | 期限切れレート制限・招待の保持期限を定める | Medium | M | 確認済み |
| [BE-003](#be-003) | バックエンド | 共有操作の追跡に必要な監査情報を残す | Medium | L | 改善提案 |
| [UX-003](#ux-003) | UI/UX | 無効な箱フィルターを全箱表示へ黙って置換しない | Medium | M | 確認済み |
| [SEC-002](#sec-002) | セキュリティ | lint依存のbraces脆弱性を追跡する | Medium | S | 確認済み |
| [SEC-003](#sec-003) | セキュリティ | 招待トークンがURLログへ残る経路を検証する | Medium | M | 要検証 |
| [PERF-001](#perf-001) | パフォーマンス | Inboxの増大windowと全箱ファンアウトを制限する | Medium | L | 確認済み |
| [PERF-002](#perf-002) | パフォーマンス | 箱・メンバー・招待一覧に取得上限とページングを設ける | Medium | L | 確認済み |
| [PV-001](#pv-001) | プロダクト価値・機能 | イベントでの受付終了・アーカイブ需要を検証する | Medium | M | 改善提案 |
| [PV-002](#pv-002) | プロダクト価値・機能 | 共有参加の退出・所有者引継ぎの方針を定める | Medium | L | 改善提案 |
| [PV-003](#pv-003) | プロダクト価値・機能 | ターゲット別の成功指標を設定して価値を検証する | Medium | M | 改善提案 |
| [MT-002](#mt-002) | 保守性・テスト | 仕様・受け入れ手順を共有質問箱の実装状態へ更新する | Medium | S | 確認済み |
| [MT-003](#mt-003) | 保守性・テスト | 監視・復旧・環境分離の運用手順を具体化する | Medium | L | 改善提案 |
| [AX-001](#ax-001) | アクセシビリティ | 回答・削除確認の表示と消失にフォーカス管理を加える | Medium | M | 確認済み |
| [AX-002](#ax-002) | アクセシビリティ | 入力エラーを対象フィールドと関連付ける | Medium | M | 確認済み |
| [AX-003](#ax-003) | アクセシビリティ | WCAGの検証範囲を自動・手動の両方で広げる | Medium | M | 改善提案 |
| [FE-003](#fe-003) | フロントエンド | 反復する認証待ち・操作状態を小さな共通処理へ整理する | Low | M | 改善提案 |

## 4. フロントエンド改善点

<a id="fe-001"></a>

### FE-001 ユーザー同期の準備状態を画面全体で共有する

- **カテゴリ**: フロントエンド
- **現状・問題内容**: users.currentのnullと未取得を同じ読み込み表示にしている。UserSyncの失敗通知・再試行は存在するが、各画面は同期失敗や未準備を区別できない。
- **問題の根拠**: [src/components/user-sync.tsx](../src/components/user-sync.tsx): UserSync、[src/components/inbox.tsx](../src/components/inbox.tsx):36、[src/components/box-settings.tsx](../src/components/box-settings.tsx): BoxSettings、[src/components/box-list.tsx](../src/components/box-list.tsx): BoxList
- **影響**: 同期が完了しない場合、読み込み表示が続き、利用者が次の操作を判断しにくい。
- **具体的な改善方法**: 同期状態をready/pending/errorとして共通化し、各所有者画面で状態に応じた案内と再試行を表示する。既存の認証完了待ちは維持する。
- **優先度 / 実装工数 / 判定**: Medium / M / 確認済み
- **完了条件**: 同期成功・失敗・再試行・ログアウトの各状態で、無期限の通常ローディングと失敗を区別できる。

<a id="fe-002"></a>

### FE-002 共有設定の競合更新と古いフォーム値を扱う

- **カテゴリ**: フロントエンド
- **現状・問題内容**: SharedBoxFormはinitialをuseStateの初回にだけ取り込み、親のkeyはbox IDのみ。別タブで設定が更新されてもフォーム値は更新されず、保存時には全設定を送る。上書き競合の実ブラウザ再現は未実施。
- **問題の根拠**: [src/components/shared-box-form.tsx](../src/components/shared-box-form.tsx):24, submit、[src/components/shared-box-settings.tsx](../src/components/shared-box-settings.tsx): SharedBoxSettings、[convex/boxes.ts](../convex/boxes.ts): updateShared
- **影響**: 複数タブの管理で名前や公開モードを意図せず以前の値へ戻す可能性がある。
- **具体的な改善方法**: 更新版番号を取得・保存時に比較し、競合時に再読込を案内する。未編集時だけ最新値へ追従し、編集中は差分を提示する。
- **優先度 / 実装工数 / 判定**: Medium / M / 要検証
- **完了条件**: 2タブで異なる設定を更新しても無言で上書きされず、競合解消後に意図した値が保存される。

<a id="fe-003"></a>

### FE-003 反復する認証待ち・操作状態を小さな共通処理へ整理する

- **カテゴリ**: フロントエンド
- **現状・問題内容**: 複数の所有者画面で認証→User取得→query、pending/error/messageとtry/catchを反復している。現時点の誤動作や不要再レンダリングは確認していない。
- **問題の根拠**: [src/components/box-members.tsx](../src/components/box-members.tsx): perform、[src/components/inbox.tsx](../src/components/inbox.tsx): InboxCard.perform、[src/components/box-settings.tsx](../src/components/box-settings.tsx): submit、[src/components/shared-box-form.tsx](../src/components/shared-box-form.tsx): submit
- **影響**: 文言・認証待ち・例外処理の改善時に変更箇所が分散する。
- **具体的な改善方法**: FE-001対応後に小さな準備状態hookと操作feedback部品を抽出する。フォーム固有の公開警告や認可は各責務に残す。
- **優先度 / 実装工数 / 判定**: Low / M / 改善提案
- **完了条件**: 既存テストを維持し、共通状態の修正が1箇所で反映される。過度な汎用フォーム化を避ける。

## 5. バックエンド改善点

<a id="be-001"></a>

### BE-001 公開Q&Aを回答日時順にする

- **カテゴリ**: バックエンド
- **現状・問題内容**: READMEは回答の新着順を明記するが、publicAnsweredはquestions.createdAtの降順でページングしている。古い質問へ新しく回答しても先頭へ来ない。
- **問題の根拠**: README.md「MVPの使い方」、[convex/answers.ts](../convex/answers.ts):24 publicAnswered、[convex/schema.ts](../convex/schema.ts): by_box_visibility_status_created
- **影響**: 新しい回答が過去ページへ埋もれ、閲覧者が更新に気づけない。
- **具体的な改善方法**: QuestionへansweredAtを持たせ公開・状態・回答日時indexで取得する等、DBで回答順にページングする。既存回答から値を補完し、visibility更新で順序が変わらないようにする。
- **優先度 / 実装工数 / 判定**: High / M / 確認済み
- **完了条件**: 質問A→Bの順で投稿しB→Aの順で回答するとA→Bで表示される。複数ページ・同時刻・非公開除外も検証する。

<a id="be-002"></a>

### BE-002 期限切れレート制限・招待の保持期限を定める

- **カテゴリ**: バックエンド
- **現状・問題内容**: レート制限は同じbox/clientの行を再利用するが、異なるclientIdの行と使用済み・失効済み招待を掃除する処理がリポジトリにない。外部運用ジョブの有無は未確認。
- **問題の根拠**: [convex/questions.ts](../convex/questions.ts): submit、[convex/invitations.ts](../convex/invitations.ts): issue/acceptHash/revoke、[convex/schema.ts](../convex/schema.ts): questionRateLimits/boxInvitations、README.md「匿名投稿の荒らし対策」
- **影響**: 匿名IDの増加に伴い保存量が増える。招待を即削除すると受諾再試行の冪等性にも影響する。
- **具体的な改善方法**: 用途別の保持期間と期限indexを定め、少量ずつ実行する内部クリーンアップを用意する。受諾済みリンクの冪等性・削除後の再参加拒否を維持する。
- **優先度 / 実装工数 / 判定**: Medium / M / 確認済み
- **完了条件**: 期限内の制限を解除せず、期限外データが上限付きバッチで整理され、既存招待の契約テストが通る。

<a id="be-003"></a>

### BE-003 共有操作の追跡に必要な監査情報を残す

- **カテゴリ**: バックエンド
- **現状・問題内容**: 回答者IDは保存されるが、質問の公開変更・削除・箱設定変更には実行者と変更履歴の記録がない。監査が必須という現行仕様ではない。
- **問題の根拠**: [convex/answers.ts](../convex/answers.ts): create、[convex/questions.ts](../convex/questions.ts): setVisibility/remove、[convex/boxes.ts](../convex/boxes.ts): updateShared、[convex/schema.ts](../convex/schema.ts)
- **影響**: 複数メンバーによる誤公開・設定変更の問い合わせで原因を追いにくい。
- **具体的な改善方法**: 操作対象・認証済み実行者・時刻・変更項目を最小限の監査イベントとして同一transactionで保存する。質問本文・匿名clientId・raw tokenは複製せず保持期限とOwner限定閲覧を設ける。
- **優先度 / 実装工数 / 判定**: Medium / L / 改善提案
- **完了条件**: 主要な共有操作を権限のあるOwnerだけが追跡でき、匿名投稿者情報や削除本文が監査ログへ残らない。

## 6. UI/UX改善点

<a id="ux-001"></a>

### UX-001 回答済みInboxから非公開の回答も確認できるようにする

- **カテゴリ**: UI/UX
- **現状・問題内容**: 回答済みタブのカードは質問・公開状態・日時だけを表示し、回答本文を返す管理queryがない。公開Q&Aはprivateを除外するため、非公開へ戻した回答は現行UIから読めない。
- **問題の根拠**: [src/components/inbox.tsx](../src/components/inbox.tsx): InboxCard、[convex/questions.ts](../convex/questions.ts): inbox、[convex/answers.ts](../convex/answers.ts): publicAnswered
- **影響**: 所有者・メンバーが過去の回答内容を確認できず、非公開回答の管理が不完全になる。
- **具体的な改善方法**: 認可済みInboxへ必要な回答本文・回答時刻を追加し、回答済みカードで表示または展開する。公開APIのprivate除外は維持する。
- **優先度 / 実装工数 / 判定**: High / M / 確認済み
- **完了条件**: Owner/Memberは非公開回答を読め、非参加者は取得できない。公開切替後も同じ内容を確認できる。

<a id="ux-002"></a>

### UX-002 投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する

- **カテゴリ**: UI/UX
- **現状・問題内容**: 公開queryはvisibilityModeを返すが公開ページはQuestionComposerへboxIdしか渡さない。説明は全モード共通で、共有箱でも非公開質問をメンバー全員が読めることを明示しない。設定・招待画面にはこの説明が既にある。
- **問題の根拠**: [src/app/u/[username]/page.tsx](../src/app/u/[username]/page.tsx): PublicPage、[src/app/b/[slug]/page.tsx](../src/app/b/[slug]/page.tsx): SharedPublicPage、[src/components/question-composer.tsx](../src/components/question-composer.tsx): QuestionComposer、[src/components/shared-box-form.tsx](../src/components/shared-box-form.tsx): 公開モード説明
- **影響**: 投稿者が即時公開の有無や非公開質問の閲覧者を誤解し、機微情報を入力する恐れがある。
- **具体的な改善方法**: boxの種類と現在モードをフォームへ渡し、「送信直後に公開」「承認までメンバーだけ」等を表示する。回答・個別公開の可能性と投稿者アカウント非保存を引き続き説明する。
- **優先度 / 実装工数 / 判定**: High / S / 確認済み
- **完了条件**: 個人/共有×3モードで現在の公開条件・閲覧者が送信前に分かり、匿名性を過大に約束しない。

<a id="ux-003"></a>

### UX-003 無効な箱フィルターを全箱表示へ黙って置換しない

- **カテゴリ**: UI/UX
- **現状・問題内容**: initialBoxIdや選択中IDが認可済み一覧にないとboxIdはundefinedになり、全箱queryを実行する。一覧の初期読み込み中にも指定箱を確定できず、全箱取得が始まる。権限外データを返す問題ではない。
- **問題の根拠**: [src/components/inbox.tsx](../src/components/inbox.tsx):9–23 Inbox、[src/app/(owner)/inbox/page.tsx](<../src/app/(owner)/inbox/page.tsx>)
- **影響**: 特定箱のつもりで個人箱など別の質問を操作する可能性がある。
- **具体的な改善方法**: 箱一覧の取得完了まで指定箱queryを待ち、指定箱が利用不可なら専用の説明と全箱へ戻る操作を表示する。URLと選択状態の同期方針も定める。
- **優先度 / 実装工数 / 判定**: Medium / M / 確認済み
- **完了条件**: 不正ID・参加解除・読込中のいずれも無言で全箱へ切り替わらず、有効IDは指定箱だけ取得する。

## 7. セキュリティ改善点

<a id="sec-001"></a>

### SEC-001 匿名clientIdを替える連投への防御を追加する

- **カテゴリ**: セキュリティ
- **現状・問題内容**: submitはクライアント指定ID単位の60秒3件制限のみ。形式の合う別IDを送れば別枠になる。READMEにもMVPの限界として明記されており、実際の攻撃発生は確認していない。
- **問題の根拠**: [convex/questions.ts](../convex/questions.ts): submit、[src/lib/anonymous-client.ts](../src/lib/anonymous-client.ts): getAnonymousClientId、README.md「匿名投稿の荒らし対策」
- **影響**: 自動連投により受信箱が埋まり、公開モードでは不適切投稿が即表示され、保存・実行費用も増える。
- **具体的な改善方法**: 投稿許可をConvex mutation側でも検証できるチャレンジ証明またはサーバー発行の短命投稿許可を導入する。Next側だけの制限は公開Convex APIから迂回できるため不十分。箱別の異常検知と受付停止も検討し、生IP非保存を維持する。
- **優先度 / 実装工数 / 判定**: High / L / 確認済み
- **完了条件**: IDを替えた直接Convex呼び出しでも追加防御が働き、正規の匿名利用とアクセシブルな代替手段を確認する。

<a id="sec-002"></a>

### SEC-002 lint依存のbraces脆弱性を追跡する

- **カテゴリ**: セキュリティ
- **現状・問題内容**: npm auditはHigh 5件・Critical 0件で終了1。5つの独立した欠陥ではなく、braces 3.0.3の再帰処理DoSが依存経路へ波及した結果。本番ユーザー入力からの到達は確認していない。
- **問題の根拠**: package-lock.json、package.json: devDependencies、npm ls braces --all: eslint-config-next→@next/eslint-plugin-next→fast-glob→micromatch→braces、GHSA-vfj7-8cjw-p6xm
- **影響**: 開発・CIで悪意あるglob入力を扱う経路があればNodeプロセス停止の可能性がある。一般公開APIの脆弱性としては断定しない。
- **具体的な改善方法**: 上流修正版を追跡し、安全な更新または検証済みoverrideを採用する。auditが示すeslint-config-next 14へのmajor downgradeを機械適用せず、期限付き例外と露出分析を記録する。
- **優先度 / 実装工数 / 判定**: Medium / S / 確認済み
- **完了条件**: 修正版導入後に監査・lint・型・buildが成功、または到達経路・軽減策・担当・再確認期限を持つ例外が記録される。

外部根拠: [GitHub Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)。レビュー時の掲載内容では影響範囲は3.0.3以下、修正版は未掲載。最新状況は対応時に再確認する。

<a id="sec-003"></a>

### SEC-003 招待トークンがURLログへ残る経路を検証する

- **カテゴリ**: セキュリティ
- **現状・問題内容**: 招待は256bit・ハッシュ保存・no-referrer/no-store/noindexを実装済み。ただしraw tokenはURL pathと認証復帰URLを通る。ホスティングや認証事業者のログでのマスキング・保持設定はリポジトリから確認できない。
- **問題の根拠**: [src/app/invite/[token]/page.tsx](../src/app/invite/[token]/page.tsx): InvitePage、[src/components/invite-accept.tsx](../src/components/invite-accept.tsx): returnUrl、[src/proxy.ts](../src/proxy.ts)、[convex/invitationTokens.ts](../convex/invitationTokens.ts)
- **影響**: もし完全URLを閲覧できる第三者がいれば、未使用期間中に意図しない共有参加が起きる可能性がある。漏洩の事実は確認していない。
- **具体的な改善方法**: アクセスログ・認証redirectログ・分析ツールのURL収集設定を調べ、招待pathのマスキングと保持制限を適用する。失効手順を運用文書化し、tokenを監視イベントへ送らない。
- **優先度 / 実装工数 / 判定**: Medium / M / 要検証
- **完了条件**: 合成tokenで全ログ経路を確認し、raw値が残らないか、閲覧権限・保持期間・失効策が明文化される。

## 8. パフォーマンス改善点

<a id="perf-001"></a>

### PERF-001 Inboxの増大windowと全箱ファンアウトを制限する

- **カテゴリ**: パフォーマンス
- **現状・問題内容**: もっと読むは20件ずつ取得総数を増やす。サーバーはmembership全取得後、各箱からcount+1件を読み全件ソートする。countにアプリ独自上限がない。重複防止を意図した設計と回帰テストは存在する。
- **問題の根拠**: [src/components/inbox.tsx](../src/components/inbox.tsx):17,37、[convex/questions.ts](../convex/questions.ts):36–75 inbox、[convex/shared-inbox.test.ts](../convex/shared-inbox.test.ts): 拡大windowテスト
- **影響**: 箱数B・window Nに対し候補が概ねB×(N+1)へ増え、通信・再実行・DOM・メモリ負荷が増す。現在の実測遅延は未確認。
- **具体的な改善方法**: numItemsを有限整数・上限付きに検証し、箱指定時は全membership列挙を省く。全箱は上限付きリアルタイムwindowと過去履歴の分離、または集約indexを比較する。必要なら表示を仮想化する。
- **優先度 / 実装工数 / 判定**: Medium / L / 確認済み
- **完了条件**: 箱数1/10/100・質問数100/10000で読取数・応答時間・DOM数を測定し予算内に収める。更新時の重複/欠落/認可の既存保証を維持する。

<a id="perf-002"></a>

### PERF-002 箱・メンバー・招待一覧に取得上限とページングを設ける

- **カテゴリ**: パフォーマンス
- **現状・問題内容**: 箱一覧、メンバー一覧、未使用招待一覧はcollectし、関連box/userを個別取得する。箱作成・招待発行の総数制限もない。公開質問/Q&Aのページングは実装済み。
- **問題の根拠**: [convex/boxes.ts](../convex/boxes.ts):57 listMine、[convex/invitations.ts](../convex/invitations.ts):69 members,84 pending、[src/components/box-list.tsx](../src/components/box-list.tsx)、[src/components/box-members.tsx](../src/components/box-members.tsx)
- **影響**: 長期運用や大量発行で単一queryの読取量・応答サイズ・画面量が増える。
- **具体的な改善方法**: 一覧にcursor・上限と検索/絞り込みを設け、期限切れ招待の区分を追加する。正当な団体規模を決めた上で発行数・作成頻度にも制限を設ける。
- **優先度 / 実装工数 / 判定**: Medium / L / 確認済み
- **完了条件**: 1000メンバー・1000招待相当のfixtureで1応答が上限以内となり、全件にページ遷移でき、認可を維持する。

## 9. プロダクト価値・機能改善点

<a id="pv-001"></a>

### PV-001 イベントでの受付終了・アーカイブ需要を検証する

- **カテゴリ**: プロダクト価値・機能
- **現状・問題内容**: 部会・イベントが想定用途だが、投稿受付停止の属性はなく、存在する箱には常にsubmitできる。開催後にも質問が届くことが問題かは仮説。
- **問題の根拠**: [docs/product-spec.md](../docs/product-spec.md)「想定する用途」、[convex/schema.ts](../convex/schema.ts): questionBoxes、[convex/questions.ts](../convex/questions.ts): submit
- **影響**: 仮説: 募集終了後も未処理質問が増え、主催者が利用を止めにくい。
- **具体的な改善方法**: 主催者へ終了運用を聞き、需要があれば受付中/終了を追加する。公開モードと分離し、既存Q&Aを残したまま新規投稿をサーバーで拒否する。
- **優先度 / 実装工数 / 判定**: Medium / M / 改善提案
- **完了条件**: 対象利用者の需要と採否を記録する。採用時は終了画面・直接API拒否・再開・既存データ維持を検証する。

<a id="pv-002"></a>

### PV-002 共有参加の退出・所有者引継ぎの方針を定める

- **カテゴリ**: プロダクト価値・機能
- **現状・問題内容**: OwnerによるMember削除は実装済みだが、自分からの退出・Owner移譲はない。Owner自身の削除は拒否する。これらは現行MVPの未達ではない。
- **問題の根拠**: [convex/invitations.ts](../convex/invitations.ts): removeMember、[convex/lib/access.ts](../convex/lib/access.ts): requireBoxOwner、[docs/product-spec.md](../docs/product-spec.md)「共有質問箱」
- **影響**: 仮説: 団体の代替わりや退会時に管理継続・閲覧権限整理が困難になる。
- **具体的な改善方法**: 継続利用団体の引継ぎ頻度を調査し、本人退出と受諾を伴うOwner移譲を設計する。ownerUserIdとmembershipを原子的に変更し、最後のOwner消失を防ぐ。
- **優先度 / 実装工数 / 判定**: Medium / L / 改善提案
- **完了条件**: 運用方針の採否が明確で、採用時は旧Owner/新Owner/退出者の全API権限をテストできる。

<a id="pv-003"></a>

### PV-003 ターゲット別の成功指標を設定して価値を検証する

- **カテゴリ**: プロダクト価値・機能
- **現状・問題内容**: 用途とMVPの差別化は文書化されているが、利用者調査・ファネル・継続率の測定計画はリポジトリにない。分析基盤が外部に存在する可能性は未確認。
- **問題の根拠**: [docs/product-spec.md](../docs/product-spec.md)「プロダクト概要」「MVPの対象範囲」、[src/app/page.tsx](../src/app/page.tsx): Home、README.md「部会で質問を募集する」
- **影響**: 仮説: 回答前公開と共有運営が利用価値を生む一方、公開不安が投稿を減らす可能性がある。コードから需要や市場適合性を断定できない。
- **具体的な改善方法**: 最初は部会用途へ対象を絞り、箱作成→URL共有→初回受信→回答の達成率・所要時間と次回利用意向を測る。本文・token・匿名clientIdを分析へ送らず、通知等のMVP対象外機能は需要検証後に判断する。
- **優先度 / 実装工数 / 判定**: Medium / M / 改善提案
- **完了条件**: 測定定義・同意/保持方針・目標値・検証期間を決め、利用者インタビューと結果に基づく採否を記録する。

## 10. 保守性・テスト改善点

<a id="mt-001"></a>

### MT-001 実サービス接続を含む主要フローの検証を整備する

- **カテゴリ**: 保守性・テスト
- **現状・問題内容**: CIには十分なunit/convex-testとkeylessブラウザsmokeがあるが、E2Eは外部通信を遮断し、入力済み画面はtest doubleの静的markup。実Clerk JWT→Convex認可→投稿/回答/招待の結合は継続検証していない。過去の個人箱ログイン確認記録は存在する。
- **問題の根拠**: [e2e/smoke.spec.ts](../e2e/smoke.spec.ts):6,41、[scripts/browser-smoke.mjs](../scripts/browser-smoke.mjs)、.github/workflows/ci.yml、[docs/vercel-public-test-validation.md](../docs/vercel-public-test-validation.md)「検証」「残作業」
- **影響**: 単体テストが通ってもissuer・claim・デプロイ差分・共有招待の実接続障害を検出できない。
- **具体的な改善方法**: 共有本番DBと隔離した検証環境で、Owner/Member/第三者/匿名の認証・招待・投稿・回答・権限喪失を確認する。自動化困難な認証操作は手動チェックと証跡をリリース条件にする。
- **優先度 / 実装工数 / 判定**: High / L / 確認済み
- **完了条件**: commit・環境・実施日時付きで個人/共有の通し検証結果を記録し、private除外と削除後アクセス拒否を実通信で確認する。

<a id="mt-002"></a>

### MT-002 仕様・受け入れ手順を共有質問箱の実装状態へ更新する

- **カテゴリ**: 保守性・テスト
- **現状・問題内容**: 仕様には公開ページ/共有Inboxを後続実装としてボタンを無効にする記述が残るが、現在は実装され有効。受け入れチェックリストは主として個人箱を扱う。READMEには存在しないsrc/typesも構成として載る。
- **問題の根拠**: [docs/product-spec.md](../docs/product-spec.md)「共有質問箱の作成・一覧・設定」、[docs/acceptance-test.md](../docs/acceptance-test.md)、README.md「構成」、[src/components/box-list.tsx](../src/components/box-list.tsx): BoxList、[src/app/b/[slug]/page.tsx](../src/app/b/[slug]/page.tsx)
- **影響**: 既存機能の誤認、重複開発、共有認可の受け入れ漏れにつながる。
- **具体的な改善方法**: 現行仕様とIssue当時の履歴を分け、Owner/Member権限表・共有公開URL・招待期限/失効・同時回答・参加解除の手動項目を追加する。過去の検証記録は日付付き履歴として残す。
- **優先度 / 実装工数 / 判定**: Medium / S / 確認済み
- **完了条件**: 仕様から現在の全主要導線を追え、未実装記述と実装が一致し、共有箱の受け入れ条件を実施できる。

<a id="mt-003"></a>

### MT-003 監視・復旧・環境分離の運用手順を具体化する

- **カテゴリ**: 保守性・テスト
- **現状・問題内容**: 安全なerror表示と再試行、本番移行・frontend rollbackの説明はある。一方、障害通知・DB復元演習・RPO/RTOの手順はリポジトリにない。公開テストはDevelopment接続と明記されている。外部Dashboardの実設定は未確認。
- **問題の根拠**: [src/app/error.tsx](../src/app/error.tsx)、[src/app/global-error.tsx](../src/app/global-error.tsx)、[docs/deployment.md](../docs/deployment.md)、[docs/public-test-environment.md](../docs/public-test-environment.md)、[docs/vercel-public-test-validation.md](../docs/vercel-public-test-validation.md)
- **影響**: 障害発見やデータ復旧が担当者の知識に依存し、正式運用へ移る判断材料が不足する。
- **具体的な改善方法**: 継続利用前に開発/検証/正式環境の分離、秘匿化したエラー計測、DBバックアップ/復元確認、連絡先、許容損失・復旧時間を決める。招待URLや本文をログへ含めない。
- **優先度 / 実装工数 / 判定**: Medium / L / 改善提案
- **完了条件**: 隔離環境で復元演習を行い、検知→切り分け→復旧の担当・手順・所要時間が記録される。

## 11. アクセシビリティ改善点

<a id="ax-001"></a>

### AX-001 回答・削除確認の表示と消失にフォーカス管理を加える

- **カテゴリ**: アクセシビリティ
- **現状・問題内容**: QRには表示時フォーカスと閉じる時の復帰がある。一方、Inboxの回答フォーム・削除確認は条件付き描画のみで、開始/取消後やカード消失後のフォーカスを指定していない。
- **問題の根拠**: [src/components/inbox.tsx](../src/components/inbox.tsx):45–65 InboxCard、[src/components/answer-form.tsx](../src/components/answer-form.tsx): AnswerForm、[src/components/box-members.tsx](../src/components/box-members.tsx): 削除確認、[src/components/share-button.tsx](../src/components/share-button.tsx): focusClose/closeQr
- **影響**: キーボード・読み上げ利用者が操作対象を見失う可能性がある。実スクリーンリーダーでの挙動は未検証。
- **具体的な改善方法**: 展開時に入力/確認見出しへ移動し、取消時に起点へ戻す。回答・削除後は次のカードまたは一覧見出しへ移動し、結果を通知する。インライン確認に不要なmodal roleは付けない。
- **優先度 / 実装工数 / 判定**: Medium / M / 確認済み
- **完了条件**: キーボードだけで回答/削除/取消を完了でき、消失した要素へフォーカスが残らないことをブラウザと読み上げで確認する。

<a id="ax-002"></a>

### AX-002 入力エラーを対象フィールドと関連付ける

- **カテゴリ**: アクセシビリティ
- **現状・問題内容**: フォームlabel・文字数説明・role=alert/statusはあるが、失敗時のaria-invalidやエラー本文へのaria-describedbyがない。質問送信は成功と失敗を同一statusで通知する。
- **問題の根拠**: [src/components/question-composer.tsx](../src/components/question-composer.tsx): QuestionComposer、[src/components/answer-form.tsx](../src/components/answer-form.tsx): AnswerForm、[src/components/shared-box-form.tsx](../src/components/shared-box-form.tsx): SharedBoxForm
- **影響**: 入力のどこを直せばよいか、読み上げで把握しにくい。
- **具体的な改善方法**: 検証エラーをフィールド別に保持して説明IDを関連付け、必要に応じ最初の問題へフォーカスを移す。通信エラーと入力エラー、成功通知を区別する。
- **優先度 / 実装工数 / 判定**: Medium / M / 確認済み
- **完了条件**: 空白・上限超過・slug重複で該当入力と修正方法が読み上げられ、エラー解消時にinvalid状態が解除される。

<a id="ax-003"></a>

### AX-003 WCAGの検証範囲を自動・手動の両方で広げる

- **カテゴリ**: アクセシビリティ
- **現状・問題内容**: lang=ja、意味のあるmain/nav、ラベル、focus-visible、44pxボタン、reduced-motionと一部コントラスト検査はある。axe等の包括的検査・実読み上げの記録はなく、WCAG準拠は判定できない。
- **問題の根拠**: [src/app/layout.tsx](../src/app/layout.tsx)、[src/components/header.tsx](../src/components/header.tsx)、src/app/globals.css、[e2e/smoke.spec.ts](../e2e/smoke.spec.ts)、[docs/mobile-validation.md](../docs/mobile-validation.md)
- **影響**: 一部の画面検査だけでは、全状態の名前/役割/値、拡大、エラー通知の障壁を取りこぼす。
- **具体的な改善方法**: 代表画面へaxe等の検査を導入し、キーボード順序・200/400%拡大・スクリーンリーダー・実機Clerk UIを手動検証する。本文へスキップするリンクの必要性も確認する。
- **優先度 / 実装工数 / 判定**: Medium / M / 改善提案
- **完了条件**: 対象WCAG 2.2 AA項目と対象外を一覧化し、再現可能な結果・修正・残課題を記録する。自動検査だけで準拠を宣言しない。

## 12. 優先度別改善ロードマップ

| 期間 | 対応 | 目的・依存関係 |
| --- | --- | --- |
| 即時対応（次回の募集前） | SEC-001の防御設計・暫定運用、UX-002、BE-001、MT-001の手動実接続検証 | 連投・誤解による公開・更新見逃し・環境接続不良を先に抑える。実サービス書き込みは今回行わず、将来の隔離検証として実施 |
| 短期対応（1〜2週目安） | UX-001、FE-001/002、UX-003、MT-002、AX-001/002、SEC-002/003の調査 | 日常管理を完結させ、競合・権限変化・入力失敗から回復できるようにする。SEC-002は調査S、修正版待ちは別途 |
| 中期対応（1〜2か月目安） | PERF-001/002、BE-002/003、MT-003、AX-003、MT-001の自動化 | 代表データで負荷予算を決めてから設計を選び、復旧と継続回帰を整える。BE-001のindex移行を考慮 |
| 長期対応（検証後） | PV-001/002/003の結果に沿う機能、FE-003 | 価値仮説の検証自体は早期開始し、追加機能の本格実装は需要確認後。不要な拡張を避ける |

Criticalは現時点で0件。新たに漏洩・データ損失が再現された場合はロードマップを変更する。日程は人数・外部サービス・データ移行の条件に依存し、上記工数の単純合計ではない。

## 13. GitHub Issue化候補

以下は候補の整理のみ。外部Issueの作成・編集は実施していない。概要の詳細・根拠は同一IDの本文、受け入れ条件はその「完了条件」を正式条件とする。

| ID | Issueタイトル | 概要 | 受け入れ条件 |
| --- | --- | --- | --- |
| BE-001 | [BE-001] 公開Q&Aを回答日時順にする | QuestionへansweredAtを持たせ公開・状態・回答日時indexで取得する等、DBで回答順にページングする。既存回答から値を補完し、visibility更新で順序が変わらないようにする。 | 質問A→Bの順で投稿しB→Aの順で回答するとA→Bで表示される。複数ページ・同時刻・非公開除外も検証する。 |
| UX-001 | [UX-001] 回答済みInboxから非公開の回答も確認できるようにする | 認可済みInboxへ必要な回答本文・回答時刻を追加し、回答済みカードで表示または展開する。公開APIのprivate除外は維持する。 | Owner/Memberは非公開回答を読め、非参加者は取得できない。公開切替後も同じ内容を確認できる。 |
| UX-002 | [UX-002] 投稿前に現在の公開モードと共有メンバーの閲覧範囲を明示する | boxの種類と現在モードをフォームへ渡し、「送信直後に公開」「承認までメンバーだけ」等を表示する。回答・個別公開の可能性と投稿者アカウント非保存を引き続き説明する。 | 個人/共有×3モードで現在の公開条件・閲覧者が送信前に分かり、匿名性を過大に約束しない。 |
| SEC-001 | [SEC-001] 匿名clientIdを替える連投への防御を追加する | 投稿許可をConvex mutation側でも検証できるチャレンジ証明またはサーバー発行の短命投稿許可を導入する。Next側だけの制限は公開Convex APIから迂回できるため不十分。箱別の異常検知と受付停止も検討し、生IP非保存を維持する。 | IDを替えた直接Convex呼び出しでも追加防御が働き、正規の匿名利用とアクセシブルな代替手段を確認する。 |
| MT-001 | [MT-001] 実サービス接続を含む主要フローの検証を整備する | 共有本番DBと隔離した検証環境で、Owner/Member/第三者/匿名の認証・招待・投稿・回答・権限喪失を確認する。自動化困難な認証操作は手動チェックと証跡をリリース条件にする。 | commit・環境・実施日時付きで個人/共有の通し検証結果を記録し、private除外と削除後アクセス拒否を実通信で確認する。 |
| FE-001 | [FE-001] ユーザー同期の準備状態を画面全体で共有する | 同期状態をready/pending/errorとして共通化し、各所有者画面で状態に応じた案内と再試行を表示する。既存の認証完了待ちは維持する。 | 同期成功・失敗・再試行・ログアウトの各状態で、無期限の通常ローディングと失敗を区別できる。 |
| FE-002 | [FE-002] 共有設定の競合更新と古いフォーム値を扱う | 更新版番号を取得・保存時に比較し、競合時に再読込を案内する。未編集時だけ最新値へ追従し、編集中は差分を提示する。 | 2タブで異なる設定を更新しても無言で上書きされず、競合解消後に意図した値が保存される。 |
| BE-002 | [BE-002] 期限切れレート制限・招待の保持期限を定める | 用途別の保持期間と期限indexを定め、少量ずつ実行する内部クリーンアップを用意する。受諾済みリンクの冪等性・削除後の再参加拒否を維持する。 | 期限内の制限を解除せず、期限外データが上限付きバッチで整理され、既存招待の契約テストが通る。 |
| BE-003 | [BE-003] 共有操作の追跡に必要な監査情報を残す | 操作対象・認証済み実行者・時刻・変更項目を最小限の監査イベントとして同一transactionで保存する。質問本文・匿名clientId・raw tokenは複製せず保持期限とOwner限定閲覧を設ける。 | 主要な共有操作を権限のあるOwnerだけが追跡でき、匿名投稿者情報や削除本文が監査ログへ残らない。 |
| UX-003 | [UX-003] 無効な箱フィルターを全箱表示へ黙って置換しない | 箱一覧の取得完了まで指定箱queryを待ち、指定箱が利用不可なら専用の説明と全箱へ戻る操作を表示する。URLと選択状態の同期方針も定める。 | 不正ID・参加解除・読込中のいずれも無言で全箱へ切り替わらず、有効IDは指定箱だけ取得する。 |
| SEC-002 | [SEC-002] lint依存のbraces脆弱性を追跡する | 上流修正版を追跡し、安全な更新または検証済みoverrideを採用する。auditが示すeslint-config-next 14へのmajor downgradeを機械適用せず、期限付き例外と露出分析を記録する。 | 修正版導入後に監査・lint・型・buildが成功、または到達経路・軽減策・担当・再確認期限を持つ例外が記録される。 |
| SEC-003 | [SEC-003] 招待トークンがURLログへ残る経路を検証する | アクセスログ・認証redirectログ・分析ツールのURL収集設定を調べ、招待pathのマスキングと保持制限を適用する。失効手順を運用文書化し、tokenを監視イベントへ送らない。 | 合成tokenで全ログ経路を確認し、raw値が残らないか、閲覧権限・保持期間・失効策が明文化される。 |
| PERF-001 | [PERF-001] Inboxの増大windowと全箱ファンアウトを制限する | numItemsを有限整数・上限付きに検証し、箱指定時は全membership列挙を省く。全箱は上限付きリアルタイムwindowと過去履歴の分離、または集約indexを比較する。必要なら表示を仮想化する。 | 箱数1/10/100・質問数100/10000で読取数・応答時間・DOM数を測定し予算内に収める。更新時の重複/欠落/認可の既存保証を維持する。 |
| PERF-002 | [PERF-002] 箱・メンバー・招待一覧に取得上限とページングを設ける | 一覧にcursor・上限と検索/絞り込みを設け、期限切れ招待の区分を追加する。正当な団体規模を決めた上で発行数・作成頻度にも制限を設ける。 | 1000メンバー・1000招待相当のfixtureで1応答が上限以内となり、全件にページ遷移でき、認可を維持する。 |
| PV-001 | [PV-001] イベントでの受付終了・アーカイブ需要を検証する | 主催者へ終了運用を聞き、需要があれば受付中/終了を追加する。公開モードと分離し、既存Q&Aを残したまま新規投稿をサーバーで拒否する。 | 対象利用者の需要と採否を記録する。採用時は終了画面・直接API拒否・再開・既存データ維持を検証する。 |
| PV-002 | [PV-002] 共有参加の退出・所有者引継ぎの方針を定める | 継続利用団体の引継ぎ頻度を調査し、本人退出と受諾を伴うOwner移譲を設計する。ownerUserIdとmembershipを原子的に変更し、最後のOwner消失を防ぐ。 | 運用方針の採否が明確で、採用時は旧Owner/新Owner/退出者の全API権限をテストできる。 |
| PV-003 | [PV-003] ターゲット別の成功指標を設定して価値を検証する | 最初は部会用途へ対象を絞り、箱作成→URL共有→初回受信→回答の達成率・所要時間と次回利用意向を測る。本文・token・匿名clientIdを分析へ送らず、通知等のMVP対象外機能は需要検証後に判断する。 | 測定定義・同意/保持方針・目標値・検証期間を決め、利用者インタビューと結果に基づく採否を記録する。 |
| MT-002 | [MT-002] 仕様・受け入れ手順を共有質問箱の実装状態へ更新する | 現行仕様とIssue当時の履歴を分け、Owner/Member権限表・共有公開URL・招待期限/失効・同時回答・参加解除の手動項目を追加する。過去の検証記録は日付付き履歴として残す。 | 仕様から現在の全主要導線を追え、未実装記述と実装が一致し、共有箱の受け入れ条件を実施できる。 |
| MT-003 | [MT-003] 監視・復旧・環境分離の運用手順を具体化する | 継続利用前に開発/検証/正式環境の分離、秘匿化したエラー計測、DBバックアップ/復元確認、連絡先、許容損失・復旧時間を決める。招待URLや本文をログへ含めない。 | 隔離環境で復元演習を行い、検知→切り分け→復旧の担当・手順・所要時間が記録される。 |
| AX-001 | [AX-001] 回答・削除確認の表示と消失にフォーカス管理を加える | 展開時に入力/確認見出しへ移動し、取消時に起点へ戻す。回答・削除後は次のカードまたは一覧見出しへ移動し、結果を通知する。インライン確認に不要なmodal roleは付けない。 | キーボードだけで回答/削除/取消を完了でき、消失した要素へフォーカスが残らないことをブラウザと読み上げで確認する。 |
| AX-002 | [AX-002] 入力エラーを対象フィールドと関連付ける | 検証エラーをフィールド別に保持して説明IDを関連付け、必要に応じ最初の問題へフォーカスを移す。通信エラーと入力エラー、成功通知を区別する。 | 空白・上限超過・slug重複で該当入力と修正方法が読み上げられ、エラー解消時にinvalid状態が解除される。 |
| AX-003 | [AX-003] WCAGの検証範囲を自動・手動の両方で広げる | 代表画面へaxe等の検査を導入し、キーボード順序・200/400%拡大・スクリーンリーダー・実機Clerk UIを手動検証する。本文へスキップするリンクの必要性も確認する。 | 対象WCAG 2.2 AA項目と対象外を一覧化し、再現可能な結果・修正・残課題を記録する。自動検査だけで準拠を宣言しない。 |
| FE-003 | [FE-003] 反復する認証待ち・操作状態を小さな共通処理へ整理する | FE-001対応後に小さな準備状態hookと操作feedback部品を抽出する。フォーム固有の公開警告や認可は各責務に残す。 | 既存テストを維持し、共通状態の修正が1箇所で反映される。過度な汎用フォーム化を避ける。 |

## 14. 総括

最も改善効果が高い上位5件は以下。優先度は脆弱性スコアや件数だけでなく、募集→受信→回答という主要導線への影響で選んだ。

1. **SEC-001 匿名連投への追加防御**: clientId変更で現行制限を回避でき、受信運用・即時公開・費用へ同時に影響する。Convex直接呼び出しも守る必要がある。
2. **UX-002 現在の公開範囲の明示**: 投稿者の意思決定に必要な情報を送信前に示す。既存取得値を活用でき、比較的小さな変更で誤解を減らせる。
3. **UX-001 回答済みInboxでの回答閲覧**: 非公開へ戻すという既存の安全操作と、内容確認という管理業務を両立させる。private除外の堅牢さを維持して改善できる。
4. **BE-001 回答日時による公開順序**: 明確な仕様不一致を修正し、新しい回答が閲覧者へ届くようにする。並び替えとページングを同時に検証する。
5. **MT-001 実接続を含む通し検証**: 良好な単体・隔離テストに、実認証・共有招待・DB接続の証拠を追加する。以降の改善を安心して公開する基盤になる。

MVPの主要機能と認可の土台は揃っている。通知・ランキング・AIなどの対象外機能の不足を欠陥とは扱わず、まず公開条件の理解、回答管理の完結、募集時の耐性、実環境での検証を整えることが効果的である。
