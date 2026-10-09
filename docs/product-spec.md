# MVP仕様・実装方針

仕様の出典: [Issue #1: MVP仕様・実装方針を確定する](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/1)

この文書はMVP全体の仕様を定める。後続Issueはこの方針に従い、各Issueのスコープ内で実装する。Issue #1では仕様書とREADMEの参照を追加し、アプリ機能を先取りして実装しない。

## プロダクト概要

匿名で質問を送れる、マシュマロに近い質問箱サービス。最大の差別化は、**回答前の質問も質問箱の設定に応じて第三者が閲覧できること**。

想定する用途:

- 部会のお便りコーナー
- サークル・学生団体
- 配信・ラジオ・ポッドキャスト
- イベント登壇者への匿名質問

## MVPのユーザーフロー

1. 質問箱所有者がアカウントを作る。
2. `/u/[username]` の公開URLを共有する。
3. 投稿者はログイン不要で匿名質問を送る。
4. 質問箱の公開モードに応じて未回答質問が公開・非公開になる。
5. 所有者は `/inbox` で質問を確認し、公開切替・削除ができる。
6. 所有者が質問へ回答する。
7. 回答済みの質問と回答を公開ページで閲覧できる。

## 質問箱の公開モード

| モード | 新着質問 | 未回答質問の公開 | 回答時 |
| --- | --- | --- | --- |
| `public` | 即公開 | 公開される | 質問と回答を公開 |
| `approval` | 非公開 | 所有者が承認すると公開 | 質問と回答を公開 |
| `private` | 非公開 | 未回答中は非公開 | 質問と回答を公開 |

安全性のため、初期値は `approval` とする。所有者による公開・非公開切替と削除をMVPに含める。非公開の質問は公開Queryから返さない。

後続Issue #4・#6・#5で具体化した挙動: モード変更は今後の新規質問の初期visibilityだけに適用し、既存質問を変更しない。所有者はInboxで個別に公開・非公開を切り替えられる。回答保存時はモードにかかわらず質問と回答を公開し、その後も非公開へ戻せる。

## 採用技術

- Next.js App Router
- TypeScript（strict）
- Tailwind CSS
- Clerk
- Convex
- Vitest + React Testing Library
- npm

## MVPの対象範囲

含める機能:

- 認証
- 公開プロフィール
- ユーザーごとの質問箱URL
- 匿名質問投稿
- 未回答質問の公開
- 回答済み質問の公開
- Inbox
- 回答
- 公開・非公開切替
- 削除
- 質問箱公開モード設定
- 最低限の荒らし対策

含めない機能:

- DM
- フォロー
- いいね・ランキング
- 画像投稿
- AI機能
- SNSタイムライン
- 通知
- 回答コメント欄

## 実装順

以下の順序を基本とする。各Issueの詳細要件と、この文書の共通ルールを併せて確認する。

| 順序 | Issue | 対象 |
| --- | --- | --- |
| 1 | [#10](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/10) | 初期環境 |
| 2 | [#11](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/11) | 認証・ユーザー同期 |
| 3 | [#9](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/9) | データモデル |
| 4 | [#8](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/8) | 画面・ルーティング骨組み |
| 5 | [#2](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/2) | 公開プロフィール・質問箱 |
| 6 | [#3](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/3) | 匿名質問投稿 |
| 7 | [#6](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/6) | Inbox・質問管理 |
| 8 | [#7](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/7) | 非表示・削除・荒らし対策 |
| 9 | [#4](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/4) | 未回答質問の公開 |
| 10 | [#5](https://github.com/AliceWonerfulWorld/marshmallow_palody/issues/5) | 回答機能 |

## 共通実装ルール

- 認可はクライアントUIだけでなくバックエンド側でも検証する。
- privateな質問（非公開の質問）を公開Queryから返さない。
- 質問投稿者のClerk User IDや名前は質問データに保存しない。
- 生のIPアドレスをDBへ保存しない。
- 秘密値をGitへコミットしない。
- 既存実装を壊す大規模リファクタは避ける。
- 各Issueのスコープ外機能を先取りしない。

## 共通品質条件

各実装Issue終了時に、存在するスクリプトについて以下を実行する。

```bash
npm run lint
npm run typecheck
npm test -- --run
```

失敗した場合は原因を修正する。外部サービスのキー不足で検証不能な場合は、どこまで検証できたかを明記する。

Issue #1対応時点のリポジトリにはREADMEのみがあり、`package.json` や上記スクリプトは存在しない。初期環境の構築は #10 の対象とする。

## Issue #1の完了条件

- `docs/product-spec.md` に本Issue相当の仕様がある。
- READMEから仕様書へ辿れる。
- 後続Issueだけを読んだCodexが実装方針を判断できるよう、仕様書に共通方針を残す。


## 共有質問箱（Issue #29以降）

個人箱（personal）は各ユーザーに1件あり、既存の `/u/[username]`、個人Inbox、投稿・回答・公開設定を維持する。`kind` 未設定の既存箱はpersonalとして読み、移行や既存Question / Answerの再作成を必要としない。同期処理は所有者の箱からpersonalだけを選び、なければトランザクション内で1件作成する。`boxes.current` は引き続きpersonalを返す。

共有箱（shared）はユーザーが0個以上作成・参加でき、公開URLは `/b/[slug]` とする。nameはtrim後1〜80文字、descriptionはtrim後最大300文字。slugは3〜48文字のlowercase ASCII英数字とハイフン（先頭・末尾不可）で、全箱で一意。`u`, `b`, `invite`, `boxes`, `inbox`, `settings`, `sign-in`, `sign-up`, `api`, `admin` は予約する。初期公開モードはapproval。

`boxMembers` はboxとuserの多対多membershipを表し、boxId + userIdをmutationのトランザクションで一意に保証する。作成者は `ownerUserId` と一致するowner membershipを持つ。MVPのownerはprimary ownerのみとし、他の参加者はmemberとする。

| 操作 | Owner | Member |
| --- | --- | --- |
| 全質問閲覧（非公開含む）・公開切替・回答 | 可 | 可 |
| 質問削除 | 可 | 不可 |
| 箱設定変更・招待発行/失効・メンバー削除 | 可 | 不可 |

招待フローはownerがリンクを発行し、受信者がClerkへログインして受諾、認証済みConvex Userにmembershipを作成する。繰り返し受諾してもmembershipは増えない。招待発行・失効・受諾UI、共有Inbox、共有公開ページ・回答は後続Issueで実装する。一般ユーザーは匿名投稿とpublicな未回答質問・Q&Aの閲覧ができ、非公開情報は公開Queryから返さない。

Issue #29は後方互換schema、共有箱作成mutationと認可helperを整える。認可はClerk identity → Convex User → membershipで判定し、クライアント指定userIdを信頼しない。personalの認可は箱所有者を確認する。sharedのQuestionはboxIdを所有概念の正とし、receiverUserIdは既存personal互換のため保持する。既存personal用の質問管理APIはsharedを扱わず、個人InboxもpersonalのboxIdで取得する。後続APIはrequireBoxMember / requireBoxOwner / canManageQuestionを使い、削除にはowner権限を要求する。


## 共有質問箱の作成・一覧・設定（Issue #30）

認証必須の `/boxes` はpersonalとmembershipで参加中のsharedを表示する。Ownerとして作成した箱に加え、招待参加したMemberの箱も同じ一覧に表示し、Owner / Member badgeと公開モードを併記する。ヘッダーの「質問箱一覧」から移動でき、personalは既存公開URLと個人設定へ移動できる。

`/boxes/new` はname / slug / description / visibilityModeを入力する。初期モードはapprovalで、`/b/[slug]` のURL previewを表示する。作成成功後は一覧へ移動する。slugの予約語・形式・一意性はサーバーで検証し、箱とowner membershipは同一トランザクションで作成する。

`/boxes/[boxId]/settings` はOwnerのみ利用できる。ページの認証済みqueryと更新mutationの両方でroleを確認し、Member・非参加者・不正IDには設定画面を表示しない。name / description / visibilityModeを変更でき、slugは読取専用。更新mutationはpersonalを拒否し、既存質問のvisibilityを変更しない。共有箱自体の削除は提供しない。

APIは `boxes.listMine`, `boxes.createShared`, `boxes.getForMember`, `boxes.updateShared`。listMineは現在のUserのmembership indexから取得し、他Userの箱や孤立したmembershipを返さない。getForMemberはsharedのみを返し、取得不能な箱はnullとする。公開ページ・共有Inbox・メンバー画面はIssue #31〜#33で提供するため、現時点の一覧カードの該当操作は準備中として無効にする。
