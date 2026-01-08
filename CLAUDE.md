# React Learning Platform - Claude Code Rules

## 開発ワークフロー

作業は必ず以下のフローに従うこと：

1. **Issue作成** - 作業内容をGitHub Issueとして作成
2. **ブランチ作成** - `feature/issue番号-説明` または `fix/issue番号-説明` 形式
3. **実装** - 作業ブランチで開発
4. **コミット＆プッシュ** - 作業完了後は必ずコミットしてプッシュする
5. **PR作成** - `--assignee @me` を付けて作成
6. **レビュー** - セルフレビューまたは依頼
7. **マージ** - レビュー後にmainへマージ

> **重要**: 作業が完了したら必ずコミット＆プッシュすること。未コミットのまま放置しない。

### ブランチ命名規則

```
feature/123-add-user-auth    # 新機能
fix/456-quiz-timer-bug       # バグ修正
refactor/789-cleanup-hooks   # リファクタリング
```

### コミットメッセージ

```
feat: 機能追加の説明
fix: バグ修正の説明
refactor: リファクタリングの説明
test: テスト追加の説明
docs: ドキュメント更新の説明
```

## プロジェクト構成

```
src/
├── app/           # アプリケーション設定、ルーティング
├── components/ui/ # 共通UIコンポーネント
├── data/          # 静的データ
├── domain/types/  # 型定義
├── features/      # 機能別モジュール
│   ├── lessons/
│   ├── progress/
│   └── quiz/
├── hooks/         # カスタムフック
├── pages/         # ページコンポーネント
└── tests/         # テストファイル
```

## コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # ビルド
npm run test:run   # テスト実行
npm run lint       # リント
```
