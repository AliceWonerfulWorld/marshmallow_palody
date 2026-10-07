あなたはこのリポジトリの自律開発エージェントです。

対象リポジトリ:
AliceWonerfulWorld/marshmallow_palody

今回の目的は、既に実装済みのMVPを「実際に部会で配って使える品質」まで仕上げることです。

私はこれから離席します。
途中で通常の実装判断について質問せず、GitHub Issue、既存コード、README、docs、既存テスト、一般的なベストプラクティスを根拠に合理的に判断して作業を継続してください。

ただし、秘密情報の取得・推測、課金、本番データ削除、force push、DNS変更、外部サービスの不可逆な本番設定変更などは行わないでください。
Clerk / Convex / Vercel 等で人間のDashboard操作が必要な場合は、可能なコード・ドキュメント・検証を先に完了し、手動作業として明確に記録して次へ進んでください。

# 最重要方針

mainブランチへ直接コミットしないでください。

開始時に以下を行ってください。

1. 現在のworking treeを確認する。
2. 未コミット変更がある場合、それを勝手に破棄しない。安全に継続できない場合は停止して理由を報告する。
3. git fetch を行う。
4. mainへ移動し、git pull --ff-only で最新化する。
5. 最新mainから専用ブランチを作成する。

作業ブランチ名:
codex/release-readiness-run

同名ブランチが既に存在する場合は、既存ブランチを上書きせず、
codex/release-readiness-run-2
など安全な別名を作成してください。

以降、すべてのIssueを同じ作業ブランチ上で順番に実装してください。

Issueごとに必ず独立したコミットを作ってください。
mainへの直接push、force push、履歴rewriteは禁止です。

# 今回実装するIssue

以下の順番を厳守してください。

#20
#19
#17
#18

上記以外のIssueを今回の実装対象に広げないでください。
既存Issueの不具合を発見し、新IssueのAcceptance Criteria達成に不可欠な場合のみ最小限修正してください。その場合は最終レポートへ理由を記載してください。

# 順番の意図

#20:
まず既存UIを洗練し、最終的な画面構造・デザインを固める。

#19:
その完成UIへ共有URL・Web Share・QRコード・初回利用導線を統合する。

#17:
完成したアプリを本番デプロイ可能な状態へ仕上げる。

#18:
最後に完成状態を実利用フローで検査し、受け入れテストを整備する。

# 各Issue共通の作業手順

各Issueについて、必ず以下を繰り返してください。

1. `gh issue view <番号>` でIssue本文を全文読む。
2. Issueに記載された依存関係・Acceptance Criteria・実装後報告項目を確認する。
3. 現在のコード、README、docs、package.json、既存テストを調査する。
4. Issue本文をSource of Truthとして実装計画を立てる。
5. 既にAcceptance Criteriaを完全に満たしている項目は不要に書き換えない。
6. Issueに書かれていない大規模機能を勝手に追加しない。
7. 既存の認証・認可・匿名性・公開範囲・Convex schemaをUI都合で壊さない。
8. 実装する。
9. 実装後、自分でdiffをレビューする。
10. Issue固有のテスト・確認を実行する。
11. 共通品質チェックを実行する。
12. 失敗した場合は原因を調査し、修正して再実行する。
13. Acceptance Criteriaを満たした場合のみコミットする。
14. コミット後、可能なら作業ブランチをoriginへpushする。
15. GitHub Issueへコメント可能なら実装内容・commit SHA・テスト結果・手動作業をコメントする。
16. working treeがcleanであることを確認して次のIssueへ進む。

# 共通品質チェック

package.jsonに存在するスクリプトを確認したうえで、最低限以下を実行してください。

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

Issue途中ではbuildが外部キー不足等で実行不能な場合があります。
その場合は「なぜ実行不能か」を記録し、可能な検証をすべて実行してください。

ただし、最終段階では可能な限りproduction buildまで通してください。

テストを通すためだけに、
- テスト削除
- skip
- assertion弱体化
- 型安全性の放棄
を行わないでください。

# セキュリティ・匿名性の確認

各Issue実装後、特に以下を確認してください。

- private Questionが公開queryから漏れない
- 質問投稿者のClerk ID / username / displayName / email / raw IPを質問データへ保存していない
- 認可をclient supplied userIdだけに依存していない
- dangerouslySetInnerHTML等でユーザー投稿を描画していない
- secret keyがclient bundleへ含まれていない
- .env.local等をGitへ含めていない
- production errorでstack traceや秘密情報をブラウザへ露出していない

# UI実装の確認

#20 と #19 では最低限以下を確認してください。

Viewport:
- 320px
- 375px
- 390px
- 430px
- 1440px

主要画面:
- /
- /u/[username]
- /inbox
- /settings
- /sign-in
- /sign-up

確認内容:
- 横スクロールがない
- 質問本文が読みやすい
- textareaが使いやすい
- 主要tap targetが十分
- dialog / modalが画面外へはみ出さない
- keyboard focusが視認できる
- loading / empty / error stateも破綻しない

ブラウザ自動操作が利用できない場合は、コード・テスト・CSS構造から可能な範囲を検証し、未実施の目視確認をレポートへ記載してください。

# 外部サービスに関するルール

Clerk / Convex / Vercelについて:

許可:
- 既存設定・コードの確認
- 必要な設定値の名前を整理
- .env.example更新
- deployment documentation作成
- CLIで安全に実行できるread-only確認
- local / build検証

禁止:
- secretの推測
- 課金操作
- 本番ユーザーデータ削除
- DNSの変更
- 不明なproduction projectへの勝手なdeploy
- 外部サービスの不可逆操作

もし認証済みCLIが存在し、Issue #17の範囲で安全にpreview deployment等を実行できる場合でも、本番設定を勝手に変更しないでください。
本番deployそのものが人間操作を要する場合は、deploy直前まで仕上げて手順を文書化してください。

# Git操作

禁止:

```text
git push --force
git push -f
git reset --hard origin/main
mainへの直接push
既存履歴のrewrite
他人の未コミット変更の破棄
```

許可:

```text
git fetch
git pull --ff-only
git switch
git checkout
git add
git commit
通常のgit push
新規ブランチ作成
```

コミットメッセージはIssue番号が分かる形式にしてください。

例:

```text
style: modernize product UI (#20)
feat: add question box sharing and QR code (#19)
chore: prepare production deployment (#17)
test: add acceptance test coverage (#18)
```

# Issue #20 の追加注意

UI刷新を理由にbackend schemaや認証仕様を変更しないでください。
既存機能を壊さないことを優先してください。

見た目は
- modern
- clean
- soft
- trustworthy
- lightweight
- mobile-first
を目指し、文章を主役にしてください。

過度なgradient、glassmorphism、animation、大型UI library追加は避けてください。

# Issue #19 の追加注意

共有URLはlocalhost固定にしないでください。
現在のoriginから正しい `/u/[username]` URLを作成してください。

QRコードだけに依存せず、URLテキスト・コピー操作も必ず残してください。

Web Share API非対応環境ではcopy等へfallbackしてください。

# Issue #17 の追加注意

秘密値をコミットしないでください。

最低限、
- Vercel
- Clerk Production
- Convex Production
の設定手順と必要な環境変数を `docs/deployment.md` に残してください。

既にdocumentationが存在する場合は重複ファイルを作らず、適切に更新してください。

本番用のsecretを入手できないことだけを理由にIssue全体を停止しないでください。
人間が最後に行うDashboard作業まで明確化してください。

# Issue #18 の追加注意

このIssueは最終検査です。

それまでのIssueで発見した軽微な不具合がAcceptance Criteriaを妨げる場合は修正して構いません。
修正した場合はIssue #18のcommitに含め、その内容を明記してください。

可能な範囲で、
- account
- anonymous posting
- inbox
- visibility modes
- answer
- anonymity
- mobile
の実利用フローを検証してください。

本番secretがないため完全E2Eができない場合でも、可能な自動テスト + 手動チェックリストを完成させてください。

# エラー時の判断

通常の以下のエラーは自分で調査・修正し、すぐに停止しないでください。

- TypeScript error
- ESLint error
- unit test failure
- build error
- dependency mismatch
- UI regression
- import error

以下の場合のみ停止してください。

- repositoryへアクセス不能
- git repository破損
- 安全に解消できない重大なmerge conflict
- 本番データ削除など不可逆操作が必須
- Issue仕様同士に重大な矛盾があり安全な判断が不能
- secretを取得しない限り次のIssueへ進むことすら不可能

停止時は `NIGHT_RUN_REPORT.md` に
- 停止理由
- 完了Issue
- 途中Issue
- 最後のcommit
- 未完了作業
- 次の再開Issue
を記録してください。

# 利用上限・レート制限時

利用上限、レート制限、コンテキスト上限等で継続不能になった場合:

1. 現在の変更を中途半端な壊れた状態で放置しない。
2. 可能なら検証可能な単位まで整理する。
3. Acceptance Criteriaを満たしたIssueのみcommitする。
4. commit済み内容を可能ならpushする。
5. 未完成Issueの変更を無理にcommitしない。
6. `NIGHT_RUN_REPORT.md` に以下を記録する。

- 完了済みIssue
- 途中のIssue
- 未完了作業
- 最終commit SHA
- 次に再開するIssue番号

その後、安全に停止してください。

# 最終処理

#20, #19, #17, #18 が完了したら、最終的に以下を実行してください。

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
git status
git log --oneline
```

問題があれば修正してください。

問題なければ作業ブランチをoriginへpushしてください。

GitHub CLIが利用可能なら、main向けPull Requestを1本作成してください。

PRタイトル:

```text
Release readiness: polish UI, sharing, deployment, and acceptance tests
```

PR本文には最低限以下を含めてください。

- 実装したIssue
- UI改善概要
- QR / share導線
- deployment準備内容
- acceptance test結果
- lint / typecheck / test / build結果
- Clerk / Convex / Vercelで人間が行う残作業
- 既知の制限

merge時にIssueが閉じるよう以下を含めてください。

```text
Closes #20
Closes #19
Closes #17
Closes #18
```

PRは作成してよいですが、自動mergeしないでください。

# 最終レポート

リポジトリルートの `NIGHT_RUN_REPORT.md` を今回の実行結果で更新してください。

最低限:

- 作業ブランチ
- 完了Issue
- 各Issueのcommit SHA
- 未完了Issue
- lint結果
- typecheck結果
- test結果
- build結果
- UI確認内容
- 必要な環境変数
- Clerk手動設定
- Convex手動設定
- Vercel手動設定
- 作成したPR URL
- 既知の制限
- 次に人間がすること

目標は、
「朝、ユーザーがPRをレビューし、外部サービスの必要な設定だけ行えば本番利用へ進める」
状態にすることです。

それでは #20 から開始してください。
