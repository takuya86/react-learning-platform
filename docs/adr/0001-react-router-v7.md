# ADR-0001: React Router v7 の採用

## ステータス

承認済み

## コンテキスト

SPAのルーティングライブラリを選定する必要があった。React 19と互換性があり、将来性のあるソリューションが求められた。

## 決定

React Router v7（react-router-dom）を採用し、`createBrowserRouter` APIを使用する。

## 理由

### 検討した選択肢

1. **React Router v7**
   - メリット: React 19対応、Data Router API、型安全性向上
   - デメリット: 比較的新しくドキュメントが少ない

2. **TanStack Router**
   - メリット: 完全な型安全性、ファイルベースルーティング
   - デメリット: エコシステムが小さい、学習コストが高い

3. **Next.js App Router**
   - メリット: SSR/SSG対応、ファイルベースルーティング
   - デメリット: Viteとの併用が難しい、オーバーキル

### 決定理由

- React公式が推奨するルーティングソリューション
- Viteとの相性が良い
- 学習プロジェクトとして一般的な知識が身につく

## 影響

- `createBrowserRouter` でルート定義を一箇所に集約
- `Layout` コンポーネントで `Outlet` を使用
- Vercelでは `vercel.json` でSPAリライト設定が必要

## 関連

- [ルーティング設計](../design/routing.md)
