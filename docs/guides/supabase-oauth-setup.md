# Supabase OAuth設定ガイド

本プロジェクトでGoogle/GitHub OAuth認証を有効にするための設定手順です。

## 前提条件

- Supabaseプロジェクトが作成済み
- `.env.local`にSupabase認証情報が設定済み

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Google OAuth設定

### 1. Google Cloud Console設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択または新規作成
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuthクライアントID」を選択

### 2. OAuth同意画面の設定

1. 「OAuth同意画面」タブで以下を設定:
   - アプリ名: `React Learning Platform`（任意）
   - ユーザーサポートメール: 自分のメールアドレス
   - 承認済みドメイン: `supabase.co`を追加
   - デベロッパーの連絡先: 自分のメールアドレス

### 3. 認証情報の作成

1. アプリケーションの種類: 「ウェブアプリケーション」
2. 名前: `Supabase Auth`（任意）
3. 承認済みリダイレクトURI:
   ```
   https://nigktsxrqlaoamfquvtj.supabase.co/auth/v1/callback
   ```
4. 「作成」をクリック

### 4. Supabase側の設定

1. Supabaseダッシュボード → Authentication → Providers
2. Google を有効化
3. Google Cloud Consoleで取得した情報を入力:
   - Client ID
   - Client Secret

## GitHub OAuth設定

### 1. GitHub OAuth App作成

1. GitHub Settings → Developer settings → OAuth Apps
2. 「New OAuth App」をクリック
3. 以下を入力:
   - Application name: `React Learning Platform`
   - Homepage URL: `https://react-learning-platform-rho.vercel.app`
   - Authorization callback URL:
     ```
     https://nigktsxrqlaoamfquvtj.supabase.co/auth/v1/callback
     ```
4. 「Register application」をクリック

### 2. Client Secret生成

1. 作成したアプリの設定画面で「Generate a new client secret」
2. Client IDとClient Secretをメモ

### 3. Supabase側の設定

1. Supabaseダッシュボード → Authentication → Providers
2. GitHub を有効化
3. GitHubで取得した情報を入力:
   - Client ID
   - Client Secret

## リダイレクトURL設定

Supabaseダッシュボード → Authentication → URL Configuration で以下を設定:

- **Site URL**: `https://react-learning-platform-rho.vercel.app`
- **Redirect URLs**:
  - `http://localhost:5173/auth/callback`（開発環境）
  - `https://react-learning-platform-rho.vercel.app/auth/callback`（本番環境）

## 動作確認

### 本番環境

1. https://react-learning-platform-rho.vercel.app/login にアクセス
2. 「Googleでログイン」または「GitHubでログイン」をクリック
3. OAuth認証フローが正常に動作することを確認

### 開発環境

1. `npm run dev`で開発サーバー起動
2. http://localhost:5173/login にアクセス
3. 「Googleでログイン」または「GitHubでログイン」をクリック
4. OAuth認証フローが正常に動作することを確認

## トラブルシューティング

### リダイレクトエラーが発生する場合

- Supabaseの「Redirect URLs」に正しいURLが登録されているか確認
- Google/GitHubのCallback URLが正しいか確認

### 認証後に404エラーになる場合

- `/auth/callback`ルートが正しく設定されているか確認
- `src/app/router.tsx`に`/auth/callback`のルートが存在するか確認

### OAuthプロバイダーが表示されない場合

- `isMockMode`がtrueになっていないか確認（`.env.local`のSupabase設定を確認）
