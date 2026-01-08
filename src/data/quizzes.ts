import type { Quiz } from '@/domain/types';

export const quizzes: Quiz[] = [
  {
    id: 'react-basics-quiz',
    title: 'React基礎クイズ',
    description: 'Reactの基本概念についての理解度を確認します。',
    relatedLessonIds: ['react-basics'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'q1',
        question: 'Reactのコンポーネントは何を返しますか？',
        options: ['HTML要素', 'JSX要素', 'JavaScript文字列', 'DOMノード'],
        correctIndex: 1,
        explanation:
          'Reactコンポーネントは JSX要素を返します。JSXはJavaScript内でHTMLライクな構文を書ける拡張です。',
        hint: 'Reactで使う特別な構文を思い出してみましょう。',
        tags: ['react', 'jsx', 'component'],
      },
      {
        id: 'q2',
        question: 'JSXでJavaScript式を埋め込む際に使う記号は？',
        options: ['( )', '[ ]', '{ }', '< >'],
        correctIndex: 2,
        explanation: 'JSX内でJavaScript式を埋め込むには波括弧 { } を使用します。',
        hint: '変数や関数を埋め込む時に使う括弧です。',
        tags: ['jsx', 'syntax'],
      },
      {
        id: 'q3',
        question: 'JSXでclass属性を指定する際の正しい書き方は？',
        options: ['class', 'className', 'cssClass', 'htmlClass'],
        correctIndex: 1,
        explanation:
          'JSXでは予約語との衝突を避けるため、classではなくclassNameを使用します。',
        hint: 'JavaScriptの予約語を避けるための命名です。',
        tags: ['jsx', 'syntax', 'className'],
      },
    ],
  },
  {
    id: 'hooks-quiz',
    title: 'React Hooksクイズ',
    description: 'useStateとuseEffectについての理解度を確認します。',
    relatedLessonIds: ['useState-hook', 'useEffect-hook'],
    timeLimitSec: 240,
    questions: [
      {
        id: 'h1',
        question: 'useStateの戻り値は何ですか？',
        options: [
          '現在の状態値のみ',
          '更新関数のみ',
          '状態値と更新関数の配列',
          'オブジェクト',
        ],
        correctIndex: 2,
        explanation:
          'useStateは [state, setState] という配列を返します。分割代入で受け取るのが一般的です。',
        hint: '分割代入で2つの値を受け取りますよね？',
        tags: ['hooks', 'useState', 'state'],
      },
      {
        id: 'h2',
        question: 'useEffectの依存配列が空の場合、いつ実行されますか？',
        options: [
          '毎回のレンダリング後',
          'マウント時のみ',
          '状態が変わるたび',
          '実行されない',
        ],
        correctIndex: 1,
        explanation:
          '依存配列が空 [] の場合、useEffectはマウント時に1回だけ実行されます。',
        hint: '依存する値がないということは、再実行の条件がないということです。',
        tags: ['hooks', 'useEffect', 'lifecycle'],
      },
      {
        id: 'h3',
        question: 'useEffect内でsetIntervalを使った場合、何が必要ですか？',
        options: [
          '何も必要ない',
          'clearIntervalを返すクリーンアップ関数',
          'useStateの使用',
          'useCallbackでのラップ',
        ],
        correctIndex: 1,
        explanation:
          'タイマーなどのリソースはクリーンアップ関数で解放する必要があります。return () => clearInterval(id) のように書きます。',
        hint: 'コンポーネントがアンマウントされた時にタイマーを止める必要があります。',
        tags: ['hooks', 'useEffect', 'cleanup'],
      },
      {
        id: 'h4',
        question: '前の状態に基づいて更新する際の正しいsetStateの呼び出し方は？',
        options: [
          'setState(state + 1)',
          'setState(prev => prev + 1)',
          'setState({ value: state + 1 })',
          'state = state + 1',
        ],
        correctIndex: 1,
        explanation:
          '前の状態に基づく更新は関数形式 setState(prev => prev + 1) を使うことで、バッチ更新時も正確に動作します。',
        hint: 'コールバック関数を渡す形式があります。',
        tags: ['hooks', 'useState', 'state'],
      },
    ],
  },
  {
    id: 'context-quiz',
    title: 'Context APIクイズ',
    description: 'Context APIの使い方についての理解度を確認します。',
    relatedLessonIds: ['react-context'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'c1',
        question: 'Contextを作成するために使う関数は？',
        options: ['useContext', 'createContext', 'makeContext', 'newContext'],
        correctIndex: 1,
        explanation:
          'ContextはcreateContext()関数で作成します。useContextは作成されたContextを利用するフックです。',
        hint: 'Context を「作る」関数です。',
        tags: ['context', 'createContext'],
      },
      {
        id: 'c2',
        question: 'Contextの値を子コンポーネントに提供するには何を使いますか？',
        options: [
          'Context.Consumer',
          'Context.Provider',
          'Context.Wrapper',
          'useProvider',
        ],
        correctIndex: 1,
        explanation:
          'Context.Providerコンポーネントでラップし、value propで値を渡します。',
        hint: '値を「提供する」という意味の英単語です。',
        tags: ['context', 'provider'],
      },
      {
        id: 'c3',
        question: 'Contextを使うメリットは何ですか？',
        options: [
          'パフォーマンスが向上する',
          'propsのバケツリレーを避けられる',
          'コードが短くなる',
          'TypeScriptが不要になる',
        ],
        correctIndex: 1,
        explanation:
          'Contextの主なメリットは、深くネストしたコンポーネントへのpropsのバケツリレーを避けられることです。',
        hint: 'Contextを使わない場合、深いコンポーネントにデータを渡すのは大変です。',
        tags: ['context', 'props', 'state'],
      },
    ],
  },
];

export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find((quiz) => quiz.id === id);
}

export function getQuizByLessonId(lessonId: string): Quiz | undefined {
  return quizzes.find((quiz) => quiz.relatedLessonIds.includes(lessonId));
}
