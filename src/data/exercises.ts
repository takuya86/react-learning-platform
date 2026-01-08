import type { Exercise } from '@/domain/types';

export const exercises: Exercise[] = [
  {
    id: 'jsx-basics',
    title: 'JSXの基本練習',
    description: 'JSXの基本構文を練習します。',
    instructions: `
## 課題

自己紹介コンポーネントのpropsを設計してください。

### 要件
1. 名前（必須）
2. 年齢（必須、数値）
3. 自己紹介文（任意）
4. 趣味のリスト（任意）

下記フォームに、コンポーネントに渡すべき情報を入力してください。
    `,
    fields: [
      {
        name: 'name',
        label: '名前',
        type: 'text',
        placeholder: '例: 山田太郎',
        required: true,
      },
      {
        name: 'age',
        label: '年齢',
        type: 'text',
        placeholder: '例: 25',
        required: true,
      },
      {
        name: 'bio',
        label: '自己紹介',
        type: 'textarea',
        placeholder: '自己紹介を書いてください',
        required: false,
      },
      {
        name: 'hobby',
        label: '趣味',
        type: 'text',
        placeholder: '例: 読書、映画鑑賞',
        required: false,
      },
    ],
  },
  {
    id: 'counter-exercise',
    title: 'カウンター実装練習',
    description: 'useStateを使ったカウンターの設計を考えます。',
    instructions: `
## 課題

カウンターアプリの仕様を設計してください。

### 要件
1. 初期値を設定できる
2. 増減のステップ値を設定できる
3. 最小値・最大値を設定できる

下記フォームに、カウンターの設定を入力してください。
    `,
    fields: [
      {
        name: 'initialValue',
        label: '初期値',
        type: 'text',
        placeholder: '例: 0',
        required: true,
      },
      {
        name: 'step',
        label: 'ステップ値',
        type: 'text',
        placeholder: '例: 1',
        required: true,
      },
      {
        name: 'minValue',
        label: '最小値',
        type: 'text',
        placeholder: '例: 0',
        required: false,
      },
      {
        name: 'maxValue',
        label: '最大値',
        type: 'text',
        placeholder: '例: 100',
        required: false,
      },
    ],
  },
  {
    id: 'form-exercise',
    title: 'フォームバリデーション練習',
    description: 'react-hook-formとzodを使ったフォームバリデーションを練習します。',
    instructions: `
## 課題

ユーザー登録フォームのバリデーションルールを設計してください。

### 要件
1. メールアドレス（必須、形式チェック）
2. パスワード（必須、最小文字数）
3. パスワード確認（一致チェック）
4. 利用規約への同意（必須）

下記フォームに、実際のバリデーション入力例を入力してください。
    `,
    fields: [
      {
        name: 'email',
        label: 'メールアドレス',
        type: 'text',
        placeholder: 'example@example.com',
        required: true,
      },
      {
        name: 'password',
        label: 'パスワード',
        type: 'text',
        placeholder: '8文字以上',
        required: true,
      },
      {
        name: 'confirmPassword',
        label: 'パスワード確認',
        type: 'text',
        placeholder: 'パスワードを再入力',
        required: true,
      },
      {
        name: 'agreeToTerms',
        label: '利用規約に同意する',
        type: 'checkbox',
        required: true,
      },
    ],
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.id === id);
}
