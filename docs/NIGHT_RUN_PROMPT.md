あなたはこのリポジトリの自律開発エージェントです。

対象リポジトリ:
AliceWonerfulWorld/marshmallow_palody

私はこれから離席します。
途中で通常の実装判断について質問せず、GitHub Issueの仕様、既存コード、一般的なベストプラクティスをもとに合理的に判断して作業を継続してください。

ただし、秘密情報の取得、課金、外部サービスの本番設定変更、データ削除、force pushなど、不可逆または危険な操作は行わないでください。

# 最重要方針

mainブランチへ直接コミットしないでください。

最初に最新のmainから、以下のような専用ブランチを作成してください。

codex/night-run

同名ブランチが既に存在する場合は、安全な別名を作成してください。

以降すべてのIssueをこのブランチ上で順番に実装してください。

Issueごとに必ず独立したコミットを作ってください。

force pushは禁止です。

# 実装するIssueの順番

以下の順番を厳守してください。

#1
#10
#11
#9
#8
#2
#3
#6
#7
#4
#5
#15

上記以外のIssueは今回実装しないでください。

# 各Issueの作業手順

各Issueについて、必ず以下の手順を繰り返してください。

1. `gh issue view <番号>` を実行し、Issueタイトル・本文・Acceptance Criteria・依存関係をすべて読む。

2. 現在のコードベースを確認する。

3. 既にAcceptance Criteriaを完全に満たしている場合は不要な変更をせず、その旨を記録して次へ進む。

4. Issue本文を仕様のSource of Truthとして実装する。

5. Issueに書かれていない機能を勝手に追加しない。

6. 既存コードがある場合は既存設計を尊重し、必要以上の大規模リファクタを行わない。

7. 実装後、関連コードを自分でレビューする。

特に以下を確認する。

- TypeScriptの型安全性
- 認証・認可
- privateデータの漏洩
- 匿名性
- XSS
- モバイル表示
- 不要な秘密情報の保存
- 重複処理
- エラーハンドリング

8. package.jsonに存在する場合、最低限以下を実行する。

npm run lint
npm run typecheck
npm test -- --run

Issue固有の検証方法が書かれている場合は、それも実行する。

9. テストやlintが失敗した場合は、原因を調査して修正し、再実行する。

安易にテストを削除・skip・無効化して通さないこと。

10. 外部サービスのAPIキーやClerk/ConvexのDashboard設定など、人間による手動設定が必要な場合:

- 秘密値を生成・推測しない
- .env.exampleへ必要な環境変数を記載
- READMEへ設定手順を書く
- キーがなくても可能な範囲の実装とテストを完了する

これだけを理由に作業全体を停止しないこと。

11. git diffを確認し、Issueのスコープ外の変更がないことを確認する。

12. 秘密情報がコミット対象に含まれていないことを確認する。

13. Acceptance Criteriaを満たしている場合のみコミットする。

コミットメッセージ例:

feat: implement anonymous question posting (#3)

14. コミット後、可能であればブランチをoriginへpushする。

15. GitHub Issueへコメント可能なら、以下を簡潔にコメントする。

- 実装した内容
- commit SHA
- 実行したテスト
- 手動設定が必要な事項

ただしIssueはまだcloseしないこと。

16. working treeがcleanであることを確認してから次のIssueへ進む。

# Issue間の依存関係

後続Issueは、それ以前に実装したIssueのコードを前提として作業してください。

前のIssueの実装をリセットしたり、別ブランチへ切り替えたりしないでください。

# エラー時の判断

通常のコンパイルエラー、型エラー、テスト失敗、依存関係エラーについては、自分で原因を調査し修正してください。

一度失敗しただけで停止しないでください。

ただし以下の場合は停止してください。

- repositoryへのアクセスそのものができない
- git repositoryが破損している
- mainと安全に統合できない重大な競合がある
- ユーザーデータ削除など不可逆操作が必要
- Issue仕様同士が明確に矛盾し、安全に判断できない

停止する場合は、何が原因で、どこまで完了したかを
NIGHT_RUN_REPORT.md
へ記録してください。

# Git操作

禁止:

git push --force
git push -f
git reset --hard origin/main
mainへの直接push
既存履歴のrewrite

許可:

git fetch
git pull --ff-only
git checkout / git switch
git add
git commit
通常のgit push
新規ブランチ作成

# 最終処理

すべてのIssueの実装が完了したら、

npm run lint
npm run typecheck
npm test -- --run

を最終的にもう一度実行してください。

その後、

git status
git log --oneline

を確認してください。

問題なければブランチをoriginへpushしてください。

GitHub CLIが使用可能なら、main向けPull Requestを1つ作成してください。

PRタイトル:

MVP: implement anonymous shared question box

PR本文には、

- 実装したIssue一覧
- 主な変更
- テスト結果
- 手動設定が必要な項目
- 既知の制限

を記載してください。

また、PRがmergeされた時にIssueが閉じるように、本文へ以下を入れてください。

Closes #1
Closes #10
Closes #11
Closes #9
Closes #8
Closes #2
Closes #3
Closes #6
Closes #7
Closes #4
Closes #5
Closes #15

PRは作成してよいですが、自動mergeはしないでください。

# 最終レポート

最後に NIGHT_RUN_REPORT.md を作成し、

- 完了したIssue
- 各Issueのcommit SHA
- 未完了Issue
- テスト結果
- 必要な環境変数
- Clerk等で必要な手動設定
- 作成したPull Request
- 気になった点 / 技術的負債

を記録してください。

目標は「朝、私が起きたときにPRをレビューするだけ」の状態にすることです。

それでは #1 から順番に作業を開始してください。