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
        explanation: 'JSXでは予約語との衝突を避けるため、classではなくclassNameを使用します。',
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
        options: ['現在の状態値のみ', '更新関数のみ', '状態値と更新関数の配列', 'オブジェクト'],
        correctIndex: 2,
        explanation:
          'useStateは [state, setState] という配列を返します。分割代入で受け取るのが一般的です。',
        hint: '分割代入で2つの値を受け取りますよね？',
        tags: ['hooks', 'useState', 'state'],
      },
      {
        id: 'h2',
        question: 'useEffectの依存配列が空の場合、いつ実行されますか？',
        options: ['毎回のレンダリング後', 'マウント時のみ', '状態が変わるたび', '実行されない'],
        correctIndex: 1,
        explanation: '依存配列が空 [] の場合、useEffectはマウント時に1回だけ実行されます。',
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
        options: ['Context.Consumer', 'Context.Provider', 'Context.Wrapper', 'useProvider'],
        correctIndex: 1,
        explanation: 'Context.Providerコンポーネントでラップし、value propで値を渡します。',
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
  // Beginner Quizzes (Sprint 9)
  {
    id: 'props-basics-quiz',
    title: 'Propsの基本クイズ',
    description: 'コンポーネント間でのデータ受け渡しについての理解度を確認します。',
    relatedLessonIds: ['props-basics'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'p1',
        question: 'Propsは何のために使われますか？',
        options: [
          '子コンポーネントから親コンポーネントへデータを渡す',
          '親コンポーネントから子コンポーネントへデータを渡す',
          'コンポーネント内で状態を管理する',
          'グローバル変数を定義する',
        ],
        correctIndex: 1,
        explanation:
          'Propsは親コンポーネントから子コンポーネントへデータを渡すための仕組みです。データの流れは一方向（親→子）です。',
        hint: '関数の引数のようなもので、呼び出し元から値を渡します。',
        tags: ['props', 'component', 'data-flow'],
      },
      {
        id: 'p2',
        question: 'Propsの特性として正しいものはどれですか？',
        options: [
          'Propsは子コンポーネント内で自由に変更できる',
          'Propsは読み取り専用で変更できない',
          'Propsはグローバルスコープで利用できる',
          'Propsは自動的に親に反映される',
        ],
        correctIndex: 1,
        explanation:
          'Propsは読み取り専用です。子コンポーネント内でPropsを直接変更することはできません。変更が必要な場合はuseStateなどの状態管理を使います。',
        hint: 'レッスンの「よくある間違い」セクションで取り上げられていた重要な特性です。',
        tags: ['props', 'immutable', 'readonly'],
      },
      {
        id: 'p3',
        question: 'TypeScriptでオプショナルなPropsを定義する正しい方法は？',
        options: [
          'variant: string',
          'variant?: string',
          'variant: string | null',
          'variant: optional<string>',
        ],
        correctIndex: 1,
        explanation:
          'TypeScriptでオプショナルなプロパティは ? を使って定義します（例: variant?: string）。これにより、そのプロパティは省略可能になります。',
        hint: 'クエスチョンマークを使った記法です。',
        tags: ['props', 'typescript', 'optional'],
      },
      {
        id: 'p4',
        question:
          '以下のコードでvariantのデフォルト値は何ですか？\n\nfunction Button({ label, variant = "primary" }: ButtonProps) { ... }',
        options: ['undefined', '"primary"', '"secondary"', 'デフォルト値は設定されていない'],
        correctIndex: 1,
        explanation:
          'デフォルトパラメータ構文（= "primary"）により、variantが渡されなかった場合は"primary"がデフォルト値として使われます。',
        hint: '関数のパラメータに = で指定されている値を見てください。',
        tags: ['props', 'default-value', 'javascript'],
      },
    ],
  },
  {
    id: 'event-handling-quiz',
    title: 'イベント処理クイズ',
    description: 'Reactでのイベントハンドリングについての理解度を確認します。',
    relatedLessonIds: ['event-handling'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'e1',
        question: 'イベントハンドラを渡す際の正しい書き方はどれですか？',
        options: [
          '<button onClick={handleClick()}>クリック</button>',
          '<button onClick={handleClick}>クリック</button>',
          '<button onClick="handleClick">クリック</button>',
          '<button click={handleClick}>クリック</button>',
        ],
        correctIndex: 1,
        explanation:
          'onClickには関数の参照を渡します。handleClick()と括弧をつけると、レンダリング時に即時実行されてしまいます。引数が必要な場合のみ () => handleClick(id) のようにアロー関数で包みます。',
        hint: '関数の「参照」を渡すのであって、「実行」ではありません。',
        tags: ['events', 'handler', 'onClick'],
      },
      {
        id: 'e2',
        question: 'フォーム送信時にページリロードを防ぐために必要な処理は？',
        options: [
          'return false を書く',
          'event.preventDefault() を呼ぶ',
          'event.stopPropagation() を呼ぶ',
          'preventSubmit を true にする',
        ],
        correctIndex: 1,
        explanation:
          'フォームのデフォルト動作（サーバーへのリクエスト送信）を防ぐには event.preventDefault() を呼びます。SPAでは必須の処理です。',
        hint: 'デフォルトの動作を「防ぐ」という意味のメソッドです。',
        tags: ['events', 'form', 'preventDefault'],
      },
      {
        id: 'e3',
        question: 'input要素のonChangeイベントハンドラの正しい型は？',
        options: [
          'React.MouseEvent<HTMLInputElement>',
          'React.ChangeEvent<HTMLInputElement>',
          'React.FormEvent<HTMLInputElement>',
          'React.InputEvent<HTMLInputElement>',
        ],
        correctIndex: 1,
        explanation:
          'input要素のonChangeには React.ChangeEvent<HTMLInputElement> を使います。要素の種類によって型が異なるので、適切な型を指定することが重要です。',
        hint: '「変更」イベントなので Change という単語が入ります。',
        tags: ['events', 'typescript', 'onChange'],
      },
      {
        id: 'e4',
        question: 'イベントハンドラに引数を渡す際の正しい書き方はどれですか？',
        options: [
          '<button onClick={handleClick(item)}>選択</button>',
          '<button onClick={() => handleClick(item)}>選択</button>',
          '<button onClick={handleClick.bind(item)}>選択</button>',
          '<button onClick={handleClick: item}>選択</button>',
        ],
        correctIndex: 1,
        explanation:
          '引数を渡す場合はアロー関数で包みます。() => handleClick(item) のように書くことで、クリック時に初めて実行されます。handleClick(item) と書くとレンダリング時に即時実行されてしまいます。',
        hint: '関数をその場で定義して、その中で引数付きで呼び出します。',
        tags: ['events', 'handler', 'arguments'],
      },
    ],
  },
  {
    id: 'conditional-rendering-quiz',
    title: '条件付きレンダリングクイズ',
    description: '条件に応じてUIを切り替える方法についての理解度を確認します。',
    relatedLessonIds: ['conditional-rendering'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'cr1',
        question: 'JSXの波括弧 { } 内で使えないものはどれですか？',
        options: ['三項演算子', 'if文', '&&演算子', '変数'],
        correctIndex: 1,
        explanation:
          'JSXの { } 内には式しか書けません。if文は文（statement）なので使えません。三項演算子や&&演算子は式なので使用可能です。',
        hint: 'JSXの { } 内には「式」しか書けません。',
        tags: ['jsx', 'conditional', 'syntax'],
      },
      {
        id: 'cr2',
        question:
          '以下のコードで count=0 の時、画面に何が表示されますか？\n{count && <span>{count}件</span>}',
        options: [
          '何も表示されない',
          '数字の「0」が表示される',
          '「0件」と表示される',
          'エラーになる',
        ],
        correctIndex: 1,
        explanation:
          '&&演算子は左側がfalsyの場合、左側の値をそのまま返します。0はfalsyですが、Reactは数値0を描画するため「0」が表示されます。count > 0 && のように明示的にbooleanに変換すべきです。',
        hint: '0はfalsyな値ですが、Reactは数値として描画します。',
        tags: ['conditional', 'falsy', 'pitfall'],
      },
      {
        id: 'cr3',
        question: '3つ以上の条件分岐を可読性高く実装する方法として最も適切なのは？',
        options: [
          '三項演算子をネストする',
          'オブジェクトマッピングを使う',
          '&&演算子を連鎖させる',
          'if文を複数回使う',
        ],
        correctIndex: 1,
        explanation:
          '3つ以上の条件分岐はオブジェクトマッピング（Record<Status, string>など）やswitch文を使うと可読性が高く、拡張も容易です。三項演算子のネストは読みにくくなります。',
        hint: 'レッスンの「複数条件の分岐」セクションで推奨されている方法です。',
        tags: ['conditional', 'object-mapping', 'readability'],
      },
      {
        id: 'cr4',
        question: 'デフォルト値を設定する際、null/undefinedのみを対象にしたい場合に使う演算子は？',
        options: ['||演算子', '&&演算子', '??演算子（Null合体）', '三項演算子'],
        correctIndex: 2,
        explanation:
          '??（Null合体演算子）はnullまたはundefinedの時だけデフォルト値を使います。||演算子は0や空文字もfalsyとして扱うため、意図しない挙動になることがあります。',
        hint: '0や空文字を有効な値として扱いたい場合に便利な演算子です。',
        tags: ['conditional', 'null-coalescing', 'default-value'],
      },
    ],
  },
  {
    id: 'lists-and-keys-quiz',
    title: 'リストとKeyクイズ',
    description: '配列のレンダリングとkeyの重要性についての理解度を確認します。',
    relatedLessonIds: ['lists-and-keys'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'lk1',
        question: '配列データをリストとして表示する際に使うJavaScriptメソッドは？',
        options: ['forEach', 'map', 'filter', 'reduce'],
        correctIndex: 1,
        explanation:
          'map()メソッドを使って配列をJSX要素のリストに変換します。map()は新しい配列を返すため、JSX内で直接使用できます。',
        hint: '配列を変換して新しい配列を返すメソッドです。',
        tags: ['react', 'lists', 'map'],
      },
      {
        id: 'lk2',
        question: 'Reactでリストの各要素にkeyを指定する主な理由は何ですか？',
        options: [
          'コードが読みやすくなる',
          'Reactが要素の変更・追加・削除を識別できる',
          'TypeScriptのエラーを防ぐ',
          'CSSのスタイリングに必要',
        ],
        correctIndex: 1,
        explanation:
          'Reactはkeyを使って、どの要素が変更・追加・削除されたかを識別します。これにより効率的な再レンダリングが可能になります。',
        hint: 'Reactが要素を追跡するために必要な情報です。',
        tags: ['react', 'key', 'performance'],
      },
      {
        id: 'lk3',
        question: '以下のkeyの選択肢で最も推奨されるのはどれですか？',
        options: [
          '配列のindex',
          'Math.random()',
          'データベースのID（user.id）',
          '固定文字列（"item"）',
        ],
        correctIndex: 2,
        explanation:
          'データベースのIDなど、一意で安定した値をkeyに使うのが推奨されます。indexは並び替えや削除でバグを引き起こし、Math.random()は毎回変わるため不適切です。',
        hint: 'データのライフサイクル中に変わらない一意の値を選びましょう。',
        tags: ['react', 'key', 'best-practice'],
      },
      {
        id: 'lk4',
        question: '配列のindexをkeyに使った場合、どのような状況で問題が起きますか？',
        options: [
          '静的なリストを表示する場合',
          '要素を並び替えや削除する場合',
          '要素の数が多い場合',
          'コンポーネントがネストしている場合',
        ],
        correctIndex: 1,
        explanation:
          'indexは要素の「位置」を表すだけで「同一性」を表しません。並び替えや削除により順序が変わると、Reactが要素を誤認識し、入力状態がズレるなどのバグが発生します。',
        hint: 'レッスンのサンプルコードで実際にバグが再現されていました。',
        tags: ['react', 'key', 'pitfalls', 'index'],
      },
    ],
  },
  {
    id: 'children-props-quiz',
    title: 'childrenとスロットパターンクイズ',
    description: 'childrenを使った柔軟なコンポーネント設計についての理解度を確認します。',
    relatedLessonIds: ['children-props'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'cp1',
        question: 'childrenの型として適切なものは？',
        options: ['JSX.Element', 'React.ReactNode', 'React.Component', 'React.Element[]'],
        correctIndex: 1,
        explanation:
          'React.ReactNodeはJSX要素、文字列、数値、null、undefined、配列など、childrenに渡される可能性のあるすべての型を含みます。',
        hint: 'childrenには様々な型の値が渡される可能性があります。',
        tags: ['react', 'children', 'typescript', 'types'],
      },
      {
        id: 'cp2',
        question: 'childrenを配列として操作する正しい方法は？',
        options: [
          'children.map((child) => ...)',
          'React.Children.map(children, (child) => ...)',
          'Array.from(children).map((child) => ...)',
          '[...children].map((child) => ...)',
        ],
        correctIndex: 1,
        explanation:
          'childrenは配列とは限りません（単一要素や文字列の場合もあります）。React.Children.mapを使うことで、childrenの型に関わらず安全に操作できます。',
        hint: 'Reactが提供する専用のユーティリティがあります。',
        tags: ['react', 'children', 'React.Children', 'array'],
      },
      {
        id: 'cp3',
        question: '複数スロットパターンのメリットとして正しいものは？',
        options: [
          'パフォーマンスが向上する',
          'TypeScriptの型チェックが不要になる',
          'header、footer等の配置場所を明示的に制御できる',
          'childrenを使わなくてよくなる',
        ],
        correctIndex: 2,
        explanation:
          '複数スロット（header、sidebar、childrenなど）を使うと、各コンテンツの配置場所を明示的に制御でき、柔軟なレイアウトを実現できます。',
        hint: 'childrenだけだと1つのスロットしかありませんが、複数のpropsを使うと...',
        tags: ['react', 'children', 'composition', 'slots'],
      },
      {
        id: 'cp4',
        question: 'childrenを使った「枠コンポーネント」の利点は？',
        options: [
          '状態管理が簡単になる',
          'props drillingを避け、中身と枠の責務を分離できる',
          'レンダリングが高速になる',
          'バンドルサイズが小さくなる',
        ],
        correctIndex: 1,
        explanation:
          '枠コンポーネントはchildrenで中身を受け取るため、中間コンポーネントが不要なpropsを持つprops drillingを避けられます。枠はレイアウトだけを担当し、中身のデータは必要な場所で直接渡せます。',
        hint: 'すべてをpropsで渡すと、中間コンポーネントが関係ないデータを持つことになります。',
        tags: ['react', 'children', 'composition', 'props'],
      },
    ],
  },
  {
    id: 'component-composition-quiz',
    title: 'コンポーネント設計クイズ',
    description: 'コンポーネントの分割と再利用設計についての理解度を確認します。',
    relatedLessonIds: ['component-composition'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'cc1',
        question: 'コンポーネントを分割する際の「単一責任の原則」とは何ですか？',
        options: [
          '1つのファイルに1つのコンポーネントだけを書く',
          '1つのコンポーネントは1つの役割に集中させる',
          '1つのコンポーネントは1つのpropsしか受け取れない',
          '1つのコンポーネントは1行だけで書く',
        ],
        correctIndex: 1,
        explanation:
          '単一責任の原則は、1つのコンポーネントが1つの役割に集中することです。例えば、ユーザー情報の表示とデータ取得を別々のコンポーネントに分けることで、保守性が向上します。',
        hint: 'コンポーネントの「役割」に注目しましょう。',
        tags: ['component', 'design', 'single-responsibility'],
      },
      {
        id: 'cc2',
        question: 'Props Drillingとは何ですか？',
        options: [
          'propsを使ってコンポーネントを穴あけすること',
          'propsを何層も経由してバケツリレーすること',
          'propsの型定義を厳密にすること',
          'propsを暗号化すること',
        ],
        correctIndex: 1,
        explanation:
          'Props Drillingは、propsを複数の中間コンポーネントを経由して深い階層へ渡すことです。中間コンポーネントが不要なpropsを持つことになり、保守性が下がります。childrenパターンやContextで回避できます。',
        hint: '深い階層にデータを渡す時の問題です。',
        tags: ['props', 'component', 'props-drilling'],
      },
      {
        id: 'cc3',
        question: '汎用的なButtonコンポーネントを設計する際、variantプロパティを使う理由は？',
        options: [
          'ボタンの色やスタイルを柔軟に変えられるようにするため',
          'TypeScriptの型チェックを厳密にするため',
          'ボタンのクリックイベントを登録するため',
          'ボタンのサイズを固定するため',
        ],
        correctIndex: 0,
        explanation:
          'variantプロパティ（primary/secondary/dangerなど）を使うことで、1つのButtonコンポーネントを様々なスタイルで再利用できます。これにより、複数のボタンコンポーネントを作る必要がなくなります。',
        hint: '同じコンポーネントを色々な見た目で使いたい時に便利な設計です。',
        tags: ['component', 'design', 'reusability'],
      },
      {
        id: 'cc4',
        question: '以下のうち、コンポーネントを分割すべき「良い理由」はどれですか？',
        options: [
          '1行でも書けるコードを別コンポーネントにする',
          '複数箇所で同じUIを再利用したい',
          'ファイルの行数を増やしたい',
          'すべてのJSXを別コンポーネントにする',
        ],
        correctIndex: 1,
        explanation:
          'コンポーネントを分割する良い理由は「再利用性」「責任の分離」「複雑さの管理」です。1行だけの単純な表示や、再利用しないUIを無理に分割すると、かえって理解しにくくなります。',
        hint: '「再利用」がキーワードです。',
        tags: ['component', 'design', 'reusability'],
      },
    ],
  },
  {
    id: 'lifting-state-up-quiz',
    title: '状態の持ち上げクイズ',
    description: '状態の持ち上げとコンポーネント間のデータ共有について理解度を確認します。',
    relatedLessonIds: ['lifting-state-up'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'ls1',
        question: '兄弟コンポーネント間で状態を共有する際、状態をどこに配置すべきですか？',
        options: [
          '片方の兄弟コンポーネント内',
          '両方の兄弟コンポーネント内にそれぞれ',
          '共通の親コンポーネント内',
          'グローバル変数として',
        ],
        correctIndex: 2,
        explanation:
          '兄弟コンポーネント間でデータを共有するには、共通の親コンポーネントに状態を持ち上げ（Lifting State Up）、propsとして渡します。',
        hint: '2つのコンポーネントの上位にある共通の場所を考えてみましょう。',
        tags: ['lifting-state', 'state', 'component'],
      },
      {
        id: 'ls2',
        question: '制御されたコンポーネントで、親から子に渡す必要があるpropsの組み合わせは？',
        options: ['valueのみ', 'onChangeのみ', 'valueとonChangeの両方', 'defaultValueとhandler'],
        correctIndex: 2,
        explanation:
          '制御されたコンポーネントでは、value（現在の値）とonChange（値を変更する関数）の両方が必要です。valueだけでは入力できません。',
        hint: '値を表示するだけでなく、変更を親に通知する手段も必要です。',
        tags: ['controlled-component', 'props', 'state'],
      },
      {
        id: 'ls3',
        question:
          '次のコードの問題点は何ですか？\n```tsx\nfunction Child({ value }: { value: string }) {\n  const [localValue, setLocalValue] = useState(value);\n  return <input value={localValue} onChange={e => setLocalValue(e.target.value)} />;\n}\n```',
        options: [
          '構文エラーがある',
          'propsをstateにコピーしており、同期がズレる',
          'useStateの使い方が間違っている',
          '特に問題はない',
        ],
        correctIndex: 1,
        explanation:
          'propsをローカルstateにコピーすると、親のvalueが変わっても子のlocalValueは更新されません。propsは直接使用し、変更はコールバック関数で親に通知すべきです。',
        hint: 'propsから初期化したstateは、その後propsが変わっても更新されないという問題があります。',
        tags: ['lifting-state', 'state', 'pitfall'],
      },
      {
        id: 'ls4',
        question: '状態を配置する場所を決める判断基準として適切なものは？',
        options: [
          'すべての状態をAppコンポーネントに配置する',
          'その状態を使うコンポーネントの最も近い共通の親に配置する',
          'できるだけ深い階層のコンポーネントに配置する',
          '常にContextを使ってグローバルに管理する',
        ],
        correctIndex: 1,
        explanation:
          '状態は「その状態を使うコンポーネントの最も近い共通の親」に配置します。過度な持ち上げは無関係なコンポーネントまで再レンダリングさせてしまいます。',
        hint: '必要な場所にだけ影響を与える最小限の配置を考えましょう。',
        tags: ['lifting-state', 'state', 'best-practice'],
      },
    ],
  },
  {
    id: 'styling-in-react-quiz',
    title: 'Reactスタイリングクイズ',
    description: 'Reactでのスタイリング手法についての理解度を確認します。',
    relatedLessonIds: ['styling-in-react'],
    timeLimitSec: 180,
    questions: [
      {
        id: 's1',
        question: 'インラインスタイルでCSSプロパティを記述する際の正しい形式は？',
        options: ['background-color', 'backgroundColor', 'BackgroundColor', 'background_color'],
        correctIndex: 1,
        explanation:
          'インラインスタイルではキャメルケース（backgroundColor）で記述します。ハイフンではなくキャメルケースを使うのがReactの規約です。',
        hint: 'JavaScriptのオブジェクトのプロパティ名として有効な形式です。',
        tags: ['react', 'styling', 'inline-style'],
      },
      {
        id: 's2',
        question: 'CSS Modulesを使う主なメリットは何ですか？',
        options: [
          'CSSファイルが不要になる',
          'クラス名の衝突を防げる',
          '疑似クラスが使えなくなる',
          'パフォーマンスが向上する',
        ],
        correctIndex: 1,
        explanation:
          'CSS Modulesは各CSSファイルをスコープ付きにすることで、クラス名の衝突を防ぎます。コンポーネント単位でスタイルを管理できます。',
        hint: 'グローバルCSSで発生しやすい問題を解決します。',
        tags: ['css-modules', 'styling', 'scope'],
      },
      {
        id: 's3',
        question: 'インラインスタイルの制限として正しいものは？',
        options: [
          'TypeScriptで型定義ができない',
          '疑似クラス（:hoverなど）が使えない',
          'カラーコードが使えない',
          'コンポーネント内で定義できない',
        ],
        correctIndex: 1,
        explanation:
          'インラインスタイルでは :hover や :focus などの疑似クラス、メディアクエリが使えません。これらが必要な場合はCSS ModulesやCSS-in-JSを使います。',
        hint: 'マウスオーバー時のスタイル変更はインラインでは実現できません。',
        tags: ['inline-style', 'css', 'pseudo-class'],
      },
      {
        id: 's4',
        question: 'このプロジェクトで推奨されているスタイリング戦略は？',
        options: [
          'すべてインラインスタイルで書く',
          'CSS Modulesをベースに、動的スタイルはインラインで補完',
          'styled-componentsのみを使う',
          'グローバルCSSのみを使う',
        ],
        correctIndex: 1,
        explanation:
          'このプロジェクトでは CSS Modulesをベースに使用し、動的なスタイルが必要な場合にインラインスタイルで補完するパターンが推奨されています。',
        hint: 'レッスンの「推奨パターン」セクションを思い出してみましょう。',
        tags: ['css-modules', 'inline-style', 'best-practice'],
      },
    ],
  },
  {
    id: 'debugging-react-quiz',
    title: 'React デバッグクイズ',
    description: 'React DevToolsとデバッグ手法についての理解度を確認します。',
    relatedLessonIds: ['debugging-react'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'd1',
        question: 'React DevToolsのComponentsタブで確認できる情報はどれですか？',
        options: [
          'コンポーネントのレンダリング時間のみ',
          'コンポーネントツリー、props、hooksの値',
          'ブラウザのネットワーク通信',
          'JavaScriptのエラーログ',
        ],
        correctIndex: 1,
        explanation:
          'Componentsタブではコンポーネントツリーとともにpropsやhooksの値を確認できます。また、値を直接編集してテストすることも可能です。',
        hint: 'コンポーネントの「構造」と「状態」を確認できるタブです。',
        tags: ['debug', 'devtools', 'components'],
      },
      {
        id: 'd2',
        question: 'useEffectで無限ループが発生する原因として最も適切なものは？',
        options: [
          'console.logを使用している',
          '依存配列に毎回新しいオブジェクトを渡している',
          'useStateを使用している',
          'async/awaitを使用している',
        ],
        correctIndex: 1,
        explanation:
          '依存配列にオブジェクトや配列を直接渡すと、レンダリングごとに新しい参照が生成され、useEffectが毎回実行されて無限ループになります。useMemoやuseCallbackで参照を固定する必要があります。',
        hint: 'オブジェクトの「参照」に関する問題です。',
        tags: ['debug', 'useEffect', 'infinite-loop'],
      },
      {
        id: 'd3',
        question: 'React.StrictModeで開発時にコンポーネントが2回レンダリングされる理由は？',
        options: [
          'バグがあるため',
          '副作用の問題を検出するための意図的な動作',
          'パフォーマンスを向上させるため',
          'TypeScriptの型チェックのため',
        ],
        correctIndex: 1,
        explanation:
          'StrictModeは副作用や予期しない動作を検出するため、開発モードで意図的にコンポーネントを2回レンダリングします。これは本番環境では発生しません。',
        hint: 'これは「バグ」ではなく、React の「機能」です。',
        tags: ['debug', 'strict-mode', 'lifecycle'],
      },
      {
        id: 'd4',
        question: '配列の状態が更新されない原因として正しいものは？',
        options: [
          'setStateの呼び出しを忘れている',
          '既存の配列を直接変更してsetStateに渡している',
          'useStateの初期値が空配列',
          'mapメソッドを使用している',
        ],
        correctIndex: 1,
        explanation:
          'Reactは参照が変わったかで更新を検知します。items.push()など既存配列を直接変更してsetItems(items)すると参照が同じため更新されません。[...items, newItem]のように新しい配列を作る必要があります。',
        hint: 'Reactは「参照の変化」で更新を検知します。',
        tags: ['debug', 'state', 'immutability'],
      },
    ],
  },
  {
    id: 'react-strict-mode-quiz',
    title: 'StrictModeと開発のベストプラクティスクイズ',
    description: 'React StrictModeの役割と開発時のベストプラクティスについての理解度を確認します。',
    relatedLessonIds: ['react-strict-mode'],
    timeLimitSec: 180,
    questions: [
      {
        id: 'sm1',
        question: 'StrictModeが開発時にコンポーネントを2回レンダリングする主な目的は何ですか？',
        options: [
          'パフォーマンスを向上させるため',
          '非純粋なレンダリングや副作用を検出するため',
          'メモリ使用量を削減するため',
          'デバッグを簡単にするため',
        ],
        correctIndex: 1,
        explanation:
          'StrictModeはコンポーネントを2回レンダリングすることで、レンダリング中の意図しない副作用や非純粋な処理を検出します。同じ入力で異なる結果が出る場合、それは問題のサインです。',
        hint: 'Reactコンポーネントは「純粋関数」であるべきです。',
        tags: ['strict-mode', 'rendering', 'purity'],
      },
      {
        id: 'sm2',
        question:
          'useEffect内でsetIntervalを使う場合、StrictModeで問題を検出するために何が実行されますか？',
        options: [
          'エラーメッセージが表示される',
          'マウント→アンマウント→マウントの順で実行される',
          'useEffectが無効化される',
          'コンポーネントが再レンダリングされる',
        ],
        correctIndex: 1,
        explanation:
          'StrictModeはuseEffectを「マウント→アンマウント→マウント」の順で実行します。これによりクリーンアップ関数が適切に実装されていないと、インターバルが重複するなどの問題が明らかになります。',
        hint: 'クリーンアップ関数（clearInterval）が正しく動作するか確認されます。',
        tags: ['strict-mode', 'useEffect', 'cleanup'],
      },
      {
        id: 'sm3',
        question: '以下のコードでStrictModeが問題を検出するのはどれですか？',
        options: [
          'useEffect(() => { fetch("/api/data"); }, []);',
          'const handleClick = () => { setCount(c => c + 1); };',
          'return <h1>Hello, {user.name}</h1>;',
          'useEffect(() => { const id = setInterval(() => {}, 1000); return () => clearInterval(id); }, []);',
        ],
        correctIndex: 0,
        explanation:
          'レンダリング中やuseEffect内でクリーンアップなしにfetchを実行すると、StrictModeの2回実行によりAPIが重複して呼ばれます。AbortControllerでキャンセル処理を実装するか、React Queryなどのライブラリでリクエストを管理する必要があります。',
        hint: 'クリーンアップ関数でリクエストをキャンセルする必要があります。',
        tags: ['strict-mode', 'useEffect', 'side-effects'],
      },
      {
        id: 'sm4',
        question: 'StrictModeを無効化すべきでない理由として正しいものは？',
        options: [
          '本番環境でパフォーマンスが低下するため',
          '検出される問題は本番環境でバグになる可能性があるため',
          'TypeScriptの型チェックが無効になるため',
          'コンポーネントが正常に動作しなくなるため',
        ],
        correctIndex: 1,
        explanation:
          'StrictModeで検出される問題（メモリリーク、データの不整合、競合状態など）は、本番環境で実際のバグになる可能性があります。StrictModeは本番ビルドでは無効化され影響がないため、問題を修正することが重要です。',
        hint: 'StrictModeは潜在的な問題を早期に発見するためのツールです。',
        tags: ['strict-mode', 'best-practices', 'debugging'],
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
