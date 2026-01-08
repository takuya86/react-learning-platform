import type { Lesson } from '@/domain/types';

export const lessons: Lesson[] = [
  {
    id: 'react-basics',
    title: 'React入門：コンポーネントとJSX',
    description: 'Reactの基本概念であるコンポーネントとJSXについて学びます。',
    tags: ['react', 'jsx', 'component'],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    content: `
# React入門：コンポーネントとJSX

## コンポーネントとは

Reactのコンポーネントは、UIの独立した再利用可能なパーツです。
関数コンポーネントを使って、シンプルに定義できます。

\`\`\`tsx
function Welcome(props: { name: string }) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

## JSXとは

JSXはJavaScript XMLの略で、JavaScript内でHTMLのような構文を書けます。

\`\`\`tsx
const element = <h1>Hello, world!</h1>;
\`\`\`

### JSXのルール

1. **単一のルート要素**: 複数要素は1つの親要素で囲む
2. **属性名はキャメルケース**: \`class\` → \`className\`
3. **JavaScript式は波括弧で囲む**: \`{expression}\`

## 練習問題

1. 自分の名前を表示するコンポーネントを作成してみましょう
2. props を使って挨拶を変更できるようにしましょう
    `,
    exerciseId: 'jsx-basics',
  },
  {
    id: 'useState-hook',
    title: 'useState：状態管理の基本',
    description: 'useStateフックを使った状態管理の基本を学びます。',
    tags: ['react', 'hooks', 'useState', 'state'],
    difficulty: 'beginner',
    estimatedMinutes: 20,
    content: `
# useState：状態管理の基本

## useStateとは

useStateは、関数コンポーネントに状態（state）を追加するフックです。

\`\`\`tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>カウント: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        増やす
      </button>
    </div>
  );
}
\`\`\`

## 構造

\`\`\`tsx
const [state, setState] = useState(initialValue);
\`\`\`

- **state**: 現在の状態値
- **setState**: 状態を更新する関数
- **initialValue**: 初期値

## 注意点

### 1. 直接変更しない
\`\`\`tsx
// ❌ 間違い
count = count + 1;

// ✅ 正しい
setCount(count + 1);
\`\`\`

### 2. 前の状態に基づく更新
\`\`\`tsx
// 前の値を使う場合は関数形式で
setCount(prev => prev + 1);
\`\`\`

### 3. オブジェクトの更新
\`\`\`tsx
const [user, setUser] = useState({ name: '', age: 0 });

// スプレッド構文で新しいオブジェクトを作成
setUser({ ...user, name: 'Taro' });
\`\`\`
    `,
    exerciseId: 'counter-exercise',
  },
  {
    id: 'useEffect-hook',
    title: 'useEffect：副作用の管理',
    description: 'useEffectフックを使った副作用の管理方法を学びます。',
    tags: ['react', 'hooks', 'useEffect', 'lifecycle'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    content: `
# useEffect：副作用の管理

## useEffectとは

useEffectは、コンポーネントの副作用（データ取得、DOM操作、購読など）を処理するフックです。

\`\`\`tsx
import { useEffect, useState } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    // クリーンアップ関数
    return () => clearInterval(interval);
  }, []); // 空の依存配列 = マウント時のみ実行

  return <p>経過時間: {seconds}秒</p>;
}
\`\`\`

## 依存配列のパターン

### 1. マウント時のみ実行
\`\`\`tsx
useEffect(() => {
  // 初回レンダリング後に1回だけ実行
}, []);
\`\`\`

### 2. 特定の値が変わった時に実行
\`\`\`tsx
useEffect(() => {
  // count が変わるたびに実行
  console.log(\`Count changed to: \${count}\`);
}, [count]);
\`\`\`

### 3. 毎回実行（非推奨）
\`\`\`tsx
useEffect(() => {
  // 毎回のレンダリング後に実行
}); // 依存配列なし
\`\`\`

## クリーンアップ

イベントリスナーやタイマーは必ずクリーンアップしましょう。

\`\`\`tsx
useEffect(() => {
  const handleResize = () => {
    console.log(window.innerWidth);
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
\`\`\`
    `,
  },
  {
    id: 'useReducer-hook',
    title: 'useReducer：複雑な状態管理',
    description: 'useReducerフックを使った複雑な状態管理を学びます。',
    tags: ['react', 'hooks', 'useReducer', 'state'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    content: `
# useReducer：複雑な状態管理

## useReducerとは

useReducerは、複雑な状態ロジックを管理するためのフックです。
Reduxのパターンに似ています。

\`\`\`tsx
import { useReducer } from 'react';

type State = { count: number };
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
\`\`\`

## useStateとの使い分け

### useState を使う場合
- 単純な値（数値、文字列、真偽値）
- 独立した状態
- 更新ロジックが単純

### useReducer を使う場合
- 複数の関連する状態
- 次の状態が前の状態に依存
- 更新ロジックが複雑
- コンポーネント間で状態ロジックを共有したい
    `,
  },
  {
    id: 'react-context',
    title: 'Context API：グローバルな状態共有',
    description: 'Context APIを使ったコンポーネント間のデータ共有を学びます。',
    tags: ['react', 'context', 'state', 'provider'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    content: `
# Context API：グローバルな状態共有

## Contextとは

Contextは、propsのバケツリレーなしにコンポーネントツリー全体でデータを共有する仕組みです。

## 基本的な使い方

### 1. Contextの作成
\`\`\`tsx
import { createContext } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
\`\`\`

### 2. Providerの作成
\`\`\`tsx
import { useState, type ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
\`\`\`

### 3. Contextの利用
\`\`\`tsx
import { useContext } from 'react';

function ThemedButton() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider内で使用してください');

  const { theme, toggleTheme } = context;

  return (
    <button onClick={toggleTheme}>
      現在のテーマ: {theme}
    </button>
  );
}
\`\`\`

## カスタムフックで抽象化

\`\`\`tsx
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
\`\`\`
    `,
  },
  {
    id: 'react-forms',
    title: 'フォーム処理：react-hook-form',
    description: 'react-hook-formを使った効率的なフォーム処理を学びます。',
    tags: ['react', 'forms', 'react-hook-form', 'validation'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    content: `
# フォーム処理：react-hook-form

## react-hook-formとは

react-hook-formは、パフォーマンスに優れたフォームライブラリです。

## 基本的な使い方

\`\`\`tsx
import { useForm } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', { required: 'メールアドレスは必須です' })}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        {...register('password', {
          required: 'パスワードは必須です',
          minLength: { value: 8, message: '8文字以上' }
        })}
        type="password"
        placeholder="Password"
      />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">ログイン</button>
    </form>
  );
}
\`\`\`

## Zodとの連携

\`\`\`tsx
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('有効なメールアドレスを入力'),
  password: z.string().min(8, '8文字以上必要'),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // ...
}
\`\`\`
    `,
    exerciseId: 'form-exercise',
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  lessons.forEach((lesson) => {
    lesson.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
