# ErrorBoundary Component

## 概要

ErrorBoundaryは、Reactアプリケーション内で発生したエラーをキャッチし、アプリケーション全体のクラッシュを防ぐためのコンポーネントです。

## 特徴

1. **ロガー統合**: `@/lib/logger` を使用してエラーを自動的にログ記録
2. **詳細なエラー情報**: エラーメッセージ、スタックトレース、コンポーネントスタックを表示
3. **エラーリカバリ**: リトライボタンでエラー状態をリセット
4. **GitHub Issue連携**: エラーをGitHub Issuesに報告するリンク
5. **カスタマイズ可能**: カスタムフォールバックUIをサポート
6. **開発者フレンドリー**: 開発環境では詳細なスタックトレースを表示

## 使い方

### 基本的な使用

```tsx
import { ErrorBoundary } from '@/components';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### カスタムフォールバックUI

```tsx
<ErrorBoundary
  fallback={(error, errorInfo, resetError) => (
    <div>
      <h1>カスタムエラー画面</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>再試行</button>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

## 実装箇所

### アプリケーションレベル

`src/app/App.tsx`でアプリケーション全体を保護:

```tsx
export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
```

### プロバイダーレベル

`src/app/providers.tsx`で各プロバイダーを個別に保護:

```tsx
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary>
          <SyncProvider>
            <ErrorBoundary>
              <SyncedProgressProvider>{children}</SyncedProgressProvider>
            </ErrorBoundary>
          </SyncProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

## エラーログ

ErrorBoundaryは、エラーをキャッチすると以下の情報をロガーに記録します:

```typescript
logger.error('React ErrorBoundary caught error', {
  category: 'general',
  context: {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    name: error.name,
  },
});
```

## テスト方法

開発環境でErrorBoundaryの動作を確認するには、テストページを使用できます:

1. 開発サーバーを起動: `npm run dev`
2. ブラウザで `/error-test` にアクセス
3. "Trigger Error"ボタンをクリック
4. ErrorBoundaryのフォールバックUIが表示されることを確認

## UI機能

### リトライボタン

エラー状態をリセットし、コンポーネントの再レンダリングを試みます。

### ホームに戻るボタン

ルートパス(`/`)にリダイレクトします。

### 問題を報告するボタン

以下の情報を含むGitHub Issueを自動的に作成します:

- エラーメッセージ
- スタックトレース
- 発生日時
- ブラウザ情報

## スタイリング

ErrorBoundaryのスタイルは `src/components/ErrorBoundary.css` で定義されています。

主な特徴:

- レスポンシブデザイン
- アクセシブルなカラーパレット
- スムーズなホバーアニメーション
- モバイル対応

## 注意事項

ErrorBoundaryは以下のエラーをキャッチ**できません**:

- イベントハンドラー内のエラー（try-catchを使用してください）
- 非同期コード（setTimeout、Promiseなど）
- サーバーサイドレンダリング
- ErrorBoundary自身のエラー

これらのケースでは、従来のエラーハンドリング方法（try-catch、Promise.catch）を使用してください。

## 参考資料

- [React公式ドキュメント - Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Logger Implementation](../logger.md)
