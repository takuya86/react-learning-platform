# React Learning Platform ドキュメント

## クイックリンク

| ドキュメント                                                     | 内容                       |
| ---------------------------------------------------------------- | -------------------------- |
| [Getting Started](./getting-started.md)                          | 環境構築・初回セットアップ |
| [アーキテクチャ](./design/architecture.md)                       | システム全体設計           |
| [開発ガイド](./guides/development.md)                            | 開発フロー・コマンド       |
| [設計判断チェックリスト](./guides/design-judgment-checklists.md) | レビュー・面談で使える観点 |

## ドキュメント構成

```
docs/
├── getting-started.md     # 新メンバー向けセットアップ
├── design/                # 設計ドキュメント
│   ├── architecture.md   # アーキテクチャ設計
│   ├── routing.md        # ルーティング設計
│   └── data-model.md     # データモデル
├── adr/                   # 設計決定記録
│   ├── 0001-react-router-v7.md
│   └── 0002-local-storage-persistence.md
├── specs/                 # 機能仕様
│   ├── lessons.md
│   ├── progress.md
│   ├── quiz.md
│   └── notes.md
└── guides/                # 開発ガイド
    ├── development.md
    └── design-judgment-checklists.md  # 設計判断チェックリスト
```

## 目的別リンク

### 初めての方

1. [環境構築](./getting-started.md)
2. [アーキテクチャ概要](./design/architecture.md)
3. [開発フロー](./guides/development.md)

### 機能を実装する

1. 対象機能の[仕様](./specs/)を確認
2. [アーキテクチャ](./design/architecture.md)に従って実装
3. [開発ガイド](./guides/development.md)に沿ってPR作成

### 設計を変更する

1. [ADR](./adr/)に決定を記録
2. [設計ドキュメント](./design/)を更新
