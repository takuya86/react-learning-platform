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
  // Intermediate Level Quizzes
  {
    id: 'context-patterns-quiz',
    title: 'Contextの設計パターン',
    description: 'Context設計パターンの理解度を確認',
    relatedLessonIds: ['context-patterns'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'cp1',
        question: '状態と更新関数を分離するパターンの主な目的は何ですか？',
        options: [
          '不要な再レンダリングを防ぐため',
          'コードの行数を減らすため',
          'TypeScriptの型推論を改善するため',
          '複数のProviderを管理しやすくするため',
        ],
        correctIndex: 0,
        explanation:
          '状態と更新関数を別々のContextに分離することで、更新関数だけを使うコンポーネントは状態が変わっても再レンダリングされません。これにより、パフォーマンスが向上します。',
        hint: 'setUserだけを使うコンポーネントがuserの変更で再レンダリングされる問題を思い出してみましょう',
        tags: ['context', 'patterns', 'performance'],
      },
      {
        id: 'cp2',
        question: 'useReducerとContextを組み合わせるパターンはどのような場合に適していますか？',
        options: [
          'テーマカラーだけを管理する単純な状態',
          '複数の関連する状態を持つ複雑な状態管理',
          'APIから取得したデータをキャッシュする場合',
          '頻繁に更新される時計の表示',
        ],
        correctIndex: 1,
        explanation:
          'useReducerは複数の関連する状態（user、isLoading、errorなど）を一貫性を持って管理できます。アクションベースの更新により、状態遷移が明確になり保守性が向上します。',
        hint: 'レッスンのAuthProviderの例を思い出してください。どんな状態を管理していましたか？',
        tags: ['context', 'useReducer', 'patterns'],
      },
      {
        id: 'cp3',
        question: 'カスタムフックでContextをラップする際、エラーをスローする理由は何ですか？',
        options: [
          'TypeScriptの型チェックを厳密にするため',
          'Provider外でContextを使用した際に早期に検知するため',
          'パフォーマンスを向上させるため',
          '複数のProviderを使えるようにするため',
        ],
        correctIndex: 1,
        explanation:
          'context が null かチェックしてエラーをスローすることで、Provider外でフックを使用したミスを開発時に早期発見できます。これにより、ランタイムエラーを防ぎ、デバッグが容易になります。',
        hint: 'useTheme()の実装で「if (!context) throw new Error...」が何をチェックしているか考えてみましょう',
        tags: ['context', 'custom-hooks', 'error-handling'],
      },
      {
        id: 'cp4',
        question: '次のうち、Contextのアンチパターンはどれですか？',
        options: [
          '状態と更新関数を別々のContextに分離する',
          '毎秒更新される時刻をContextで管理する',
          'useReducerとContextを組み合わせる',
          'カスタムフックでContextをラップする',
        ],
        correctIndex: 1,
        explanation:
          '頻繁に変わる値（時刻など）をContextに入れると、全ての購読コンポーネントが頻繁に再レンダリングされ、パフォーマンスが悪化します。このような値はローカルステートで管理すべきです。',
        hint: 'レッスンの「頻繁に変わる値を入れる」というアンチパターンの例を確認しましょう',
        tags: ['context', 'anti-patterns', 'performance'],
      },
    ],
  },
  {
    id: 'custom-hooks-quiz',
    title: 'カスタムフック',
    description: 'カスタムフックの理解度を確認',
    relatedLessonIds: ['custom-hooks'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'ch1',
        question: 'カスタムフックの命名規則として正しいものはどれですか？',
        options: [
          'use で始まる名前をつける必要がある',
          'hook で始まる名前をつける必要がある',
          'custom で始まる名前をつける必要がある',
          '特に命名規則はなく、任意の名前をつけられる',
        ],
        correctIndex: 0,
        explanation:
          'カスタムフックは必ず `use` で始まる名前をつける必要があります。これにより、Reactがフックとして認識し、フックのルールを適用できるようになります。',
        hint: 'Reactの組み込みフック（useState、useEffectなど）の命名を思い出してみましょう',
        tags: ['hooks', 'custom-hooks', 'naming'],
      },
      {
        id: 'ch2',
        question: 'カスタムフックに切り出すべき場面として適切でないものはどれですか？',
        options: [
          '2つ以上のコンポーネントで同じロジックを使う場合',
          '状態と副作用がセットで動く複雑なロジック',
          '1つのコンポーネントでしか使わないUIの見た目に関するロジック',
          'テスト可能にしたい複雑なロジック',
        ],
        correctIndex: 2,
        explanation:
          'UIの見た目に関するロジックはコンポーネントに残すべきです。カスタムフックは「何をするか」を担当し、「どう見せるか」はコンポーネントに任せるのが適切な設計です。また、1つのコンポーネントでしか使わないロジックもフックに切り出す必要はありません。',
        hint: 'カスタムフックの責務は「ロジックの再利用」であり、UIには関与しません',
        tags: ['hooks', 'custom-hooks', 'design'],
      },
      {
        id: 'ch3',
        question:
          'useEffectで副作用を実装したカスタムフックで、必ずcleanup（クリーンアップ）が必要なケースはどれですか？',
        options: [
          'データのフェッチ（fetch）を実行する場合',
          'setIntervalでタイマーを登録する場合',
          'useStateで状態を更新する場合',
          '単純な計算処理を実行する場合',
        ],
        correctIndex: 1,
        explanation:
          'setIntervalでタイマーを登録した場合、コンポーネントがアンマウントされてもタイマーが動き続けるため、必ずclearIntervalでクリーンアップする必要があります。addEventListener、WebSocket接続なども同様にcleanupが必須です。',
        hint: 'アンマウント後も動き続けるとメモリリークや予期しない動作の原因になるものは何でしょうか',
        tags: ['hooks', 'custom-hooks', 'useEffect', 'cleanup'],
      },
      {
        id: 'ch4',
        question:
          'カスタムフックで関数を返す際、useCallbackでラップする理由として正しいものはどれですか？',
        options: [
          '関数の処理速度を高速化するため',
          '関数の参照を安定させ、使う側での不要な再レンダリングを防ぐため',
          'TypeScriptの型チェックを通すため',
          'メモリ使用量を削減するため',
        ],
        correctIndex: 1,
        explanation:
          'useCallbackを使わないと、カスタムフックが再実行されるたびに新しい関数が生成されます。関数は参照で比較されるため、使う側のコンポーネントでReact.memoが効かず、不要な再レンダリングが発生してしまいます。useCallbackで参照を安定させることで、この問題を防げます。',
        hint: 'JavaScriptでは関数やオブジェクトは「参照」で比較されることを思い出しましょう',
        tags: ['hooks', 'custom-hooks', 'useCallback', 'performance'],
      },
    ],
  },
  {
    id: 'data-fetching-quiz',
    title: 'データ取得',
    description: 'データ取得の理解度を確認',
    relatedLessonIds: ['data-fetching'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'df1',
        question: 'useEffectでデータ取得する際、AbortControllerを使う主な理由は何ですか？',
        options: [
          'Race ConditionとUnmounted後のsetStateを防ぐため',
          'APIリクエストの速度を上げるため',
          'コンポーネントの再レンダリングを防ぐため',
          'fetchの代わりにaxiosを使えるようにするため',
        ],
        correctIndex: 0,
        explanation:
          'AbortControllerは、連続リクエストで古いデータが新しいデータを上書きするRace Conditionと、コンポーネントがアンマウントされた後にsetStateが呼ばれるメモリリーク警告を防ぐために使います。cleanup関数でcontroller.abort()を呼ぶことで、不要になったリクエストをキャンセルできます。',
        hint: 'レッスンで説明されていた「よくある間違い」の1番と2番を思い出してください',
        tags: ['fetch', 'AbortController', 'race-condition'],
      },
      {
        id: 'df2',
        question:
          "以下のコードの問題点は何ですか？\n\n```tsx\nuseEffect(() => {\n  fetch('/api/users')\n    .then(r => r.json())\n    .then(setUsers);\n}, []);\n```",
        options: [
          'エラーハンドリングがなく、アンマウント後のsetStateも起きる',
          'async/awaitを使っていない',
          '依存配列が空配列になっている',
          'fetchの代わりにaxiosを使うべき',
        ],
        correctIndex: 0,
        explanation:
          'このコードには、エラーハンドリングがないこと、コンポーネントがアンマウントされた後にsetUsersが呼ばれる可能性があること、連続リクエストでrace conditionが起きる可能性があることなど、複数の問題があります。AbortControllerとtry-catchでこれらを防ぐ必要があります。',
        hint: 'レッスンの冒頭で「⚠️ 問題のある実装」として紹介されていたコードです',
        tags: ['fetch', 'useEffect', 'error-handling'],
      },
      {
        id: 'df3',
        question: 'データ取得時に考慮すべき4つの状態とは何ですか？',
        options: [
          'loading / error / empty / success',
          'pending / rejected / fulfilled / cancelled',
          'idle / fetching / success / failure',
          'initial / loading / done / retry',
        ],
        correctIndex: 0,
        explanation:
          'データ取得では、loading（読み込み中）、error（エラー発生）、empty（データが空）、success（データ取得成功）の4状態を明示的に分岐することで、すべてのケースに適切なUIを表示できます。TypeScriptの判別共用体を使うと状態分岐漏れを防げます。',
        hint: 'レッスンの「よくある間違い」3番で説明されていました',
        tags: ['state-management', 'ui', 'typescript'],
      },
      {
        id: 'df4',
        question:
          'レッスンで「実務では使用を強く推奨」されているデータ取得ライブラリの組み合わせはどれですか？',
        options: [
          'SWR または TanStack Query',
          'Redux または MobX',
          'Axios または Fetch',
          'React Router または Next.js',
        ],
        correctIndex: 0,
        explanation:
          'レッスンでは、キャッシュ、複数コンポーネントでのデータ共有、再取得、ポーリング、楽観的更新が必要な実務では、SWRやTanStack Query（旧React Query）の使用が強く推奨されています。自前実装は基礎を理解するための学習目的で行います。',
        hint: '「設計判断の基準」セクションで「いつライブラリを使うか」として紹介されていました',
        tags: ['library', 'best-practices', 'swr'],
      },
    ],
  },
  {
    id: 'error-boundaries-quiz',
    title: 'Error Boundary',
    description: 'Error Boundaryの理解度を確認',
    relatedLessonIds: ['error-boundaries'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'eb1',
        question: 'Error Boundaryが直接キャッチ「できない」エラーはどれですか？',
        options: [
          'レンダリング中に発生したコンポーネントのエラー',
          'イベントハンドラ内で発生したエラー',
          'getDerivedStateFromErrorで発生したエラー',
          'constructorで発生したエラー',
        ],
        correctIndex: 1,
        explanation:
          'Error Boundaryはレンダリング中のエラーのみをキャッチします。イベントハンドラ内のエラーはtry-catchで自分でハンドリングする必要があります。非同期エラー（fetch、setTimeoutなど）もshowBoundaryで明示的に委譲する必要があります。',
        hint: 'ボタンクリックなどのユーザー操作時に発生するエラーの処理方法を思い出してください',
        tags: ['error', 'boundary'],
      },
      {
        id: 'eb2',
        question: 'Error Boundaryの推奨配置方法として正しいものはどれですか？',
        options: [
          'アプリ全体を1つのError Boundaryで囲むだけで十分',
          'アプリ全体、ページ単位、重要なウィジェット単位の3層構造で配置する',
          'すべてのコンポーネントを個別にError Boundaryで囲む',
          'Error Boundaryはルートコンポーネントにのみ必要',
        ],
        correctIndex: 1,
        explanation:
          '推奨は3層構造での配置です。（1）アプリ全体（最後の砦）、（2）ページ/ルート単位、（3）重要なウィジェット単位。こうすることで、1箇所でエラーが起きても他の部分は動作し続け、障害の影響範囲を最小化できます。',
        hint: 'エラー発生時に「どこまで影響させたいか」を考える必要があります',
        tags: ['error', 'boundary', 'architecture'],
      },
      {
        id: 'eb3',
        question:
          '非同期処理（fetch）でエラーが発生した場合、Error Boundaryでキャッチするための正しい方法はどれですか？',
        options: [
          'useEffect内でthrow errorすれば自動的にキャッチされる',
          'try-catchでキャッチして、showBoundaryで明示的に委譲する',
          'async/awaitを使えば自動的にError Boundaryがキャッチする',
          '.catch()で投げたエラーは自動的にError Boundaryに届く',
        ],
        correctIndex: 1,
        explanation:
          '非同期エラーはError Boundaryでは直接キャッチされません。useEffect内でtry-catchを使ってエラーをキャッチし、showBoundary(error)で明示的にError Boundaryに委譲する必要があります。または、loading/error状態を自分で管理してUIに反映する方法もあります。',
        hint: 'レッスンのAsyncWidgetコンポーネントの実装を参考にしてください',
        tags: ['error', 'boundary', 'async'],
      },
      {
        id: 'eb4',
        question: 'フォールバックUIに必ず含めるべき要素はどれですか？',
        options: [
          'エラーメッセージのみ表示すれば十分',
          '再試行ボタンやホームに戻るボタンなど、ユーザーが次に取れるアクションを提供する',
          'エラーの詳細なスタックトレースをすべて表示する',
          'エラーが発生したことをユーザーに知らせない',
        ],
        correctIndex: 1,
        explanation:
          'フォールバックUIには必ず「再試行」「ホームに戻る」「サポートに連絡」など、ユーザーが次に取れるアクションを含める必要があります。エラーが起きたとき、ユーザーが何もできないUIは最悪のUXになります。復旧手段を提供することで、ユーザーは自分で問題を解決できる可能性があります。',
        hint: 'エラー発生時のユーザー体験を考えてください',
        tags: ['error', 'boundary', 'ux'],
      },
    ],
  },
  {
    id: 'form-validation-quiz',
    title: 'フォームバリデーション',
    description: 'フォームバリデーションの理解度を確認',
    relatedLessonIds: ['form-validation'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'fv1',
        question: 'フォームバリデーションのタイミングについて、最も適切な説明はどれですか？',
        options: [
          'submit時バリデーションを基本とし、ユーザーが入力完了後にまとめて検証する',
          'change時バリデーションを基本とし、入力のたびにリアルタイムでエラーを表示する',
          'blur時バリデーションのみを使用し、フィールドを離れたときだけ検証する',
          'バリデーションは常にサーバーサイドで行い、クライアント側では実装しない',
        ],
        correctIndex: 0,
        explanation:
          'submit時バリデーションを基本とすることで、ユーザーは入力途中に怒られることがなく、複数フィールドの関連チェックも自然にできます。blur時やchange時は補助的に使用します。',
        hint: 'ユーザーが「入力途中」に怒られない設計を考えましょう',
        tags: ['form', 'validation', 'ux'],
      },
      {
        id: 'fv2',
        question:
          '次のコードの問題点として最も適切なものはどれですか？\n\nconst [name, setName] = useState("");\nconst [email, setEmail] = useState("");\nconst [password, setPassword] = useState("");\nconst [phone, setPhone] = useState("");\nconst [address, setAddress] = useState("");',
        options: [
          'フィールドごとに個別のuseStateを使用しており、管理が困難になる',
          'useStateの初期値が空文字列になっている',
          'constではなくletを使用すべきである',
          'フィールド数が少なすぎて実用的でない',
        ],
        correctIndex: 0,
        explanation:
          'フィールドごとに個別のuseStateを使用すると、フィールドが増えるたびに管理が困難になります。オブジェクトで一括管理することで、汎用的な更新関数を作成でき、バリデーション時もformDataをそのまま渡せます。',
        hint: 'フィールドが10個以上になったときのことを考えてみましょう',
        tags: ['form', 'react', 'state'],
      },
      {
        id: 'fv3',
        question:
          'バリデーションロジックをUIから分離する主な利点として、正しくないものはどれですか？',
        options: [
          '単体テストが書きやすくなる',
          '同じルールをサーバーサイドでも使える',
          'バリデーションの実行速度が向上する',
          'バリデーションルールの変更が1箇所で済む',
        ],
        correctIndex: 2,
        explanation:
          'バリデーションロジックを分離しても、実行速度は向上しません。主な利点は、テストのしやすさ、再利用性、保守性の向上です。純粋関数として分離することで、単体テストが容易になり、サーバーサイドとの共有も可能になります。',
        hint: 'パフォーマンスではなく、コードの品質や保守性に注目しましょう',
        tags: ['validation', 'architecture', 'testing'],
      },
      {
        id: 'fv4',
        question:
          '次のコードの問題点として最も適切なものはどれですか？\n\nconst handleChange = (value: string) => {\n  setEmail(value);\n  if (!value.includes("@")) {\n    setError("無効なメールアドレスです");\n  }\n};',
        options: [
          '入力のたびにバリデーションが実行され、ユーザーが入力途中でエラーを見ることになる',
          'value.includes()ではなく正規表現を使うべきである',
          'setEmailとsetErrorを同時に呼び出しているため、無限ループになる',
          'async/awaitを使用していないため、非同期処理ができない',
        ],
        correctIndex: 0,
        explanation:
          'onChange時に即座にバリデーションを実行すると、「t」と入力した瞬間に「無効なメールアドレスです」が表示され、UX崩壊につながります。submit時またはblur時にバリデーションを行い、「touched」状態を管理することで、適切なタイミングでエラーを表示できます。',
        hint: 'ユーザーが「まだ入力中なのに怒られている」と感じないか考えましょう',
        tags: ['form', 'validation', 'ux'],
      },
    ],
  },
  {
    id: 'loading-error-states-quiz',
    title: 'ローディングとエラー状態',
    description: 'ローディングとエラー状態の管理の理解度を確認',
    relatedLessonIds: ['loading-error-states'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'le1',
        question: '非同期UIの状態管理で推奨される5つの状態として正しいものはどれですか？',
        options: [
          'idle / loading / error / success',
          'idle / loading / error / empty',
          'idle / loading / error / empty / success',
          'loading / error / complete / success',
        ],
        correctIndex: 2,
        explanation:
          '非同期UIでは、idle（初期状態）、loading（読み込み中）、error（エラー発生）、empty（データなし）、success（データ取得成功）の5状態を明示的に管理することで、UIの曖昧さをなくし、すべてのケースに対応できます。booleanだけの管理では状態の区別がつきません。',
        hint: 'レッスンで紹介されているDiscriminated Union型の定義を思い出してください',
        tags: ['loading', 'error', 'state'],
      },
      {
        id: 'le2',
        question: 'race conditionを防ぐための対策として適切なものはどれですか？',
        options: [
          'すべてのリクエストをawaitで順次実行する',
          'リクエストごとにIDを発行し、最新のIDと一致する場合のみ状態を更新する',
          'useEffectの依存配列を空にする',
          'setTimeoutで遅延させてからリクエストを送る',
        ],
        correctIndex: 1,
        explanation:
          'race conditionは、後から発行したリクエストが先に返ることで古いデータが表示される問題です。requestIdRefを使ってリクエストごとにIDを発行し、currentRequestId === requestIdRef.currentの場合のみ状態を更新することで、古いリクエストの結果を無視できます。AbortControllerで前のリクエストをキャンセルする方法もあります。',
        hint: 'レッスンのuseFetchカスタムフックでrequestIdRefがどう使われているか確認してください',
        tags: ['race-condition', 'async', 'state'],
      },
      {
        id: 'le3',
        question: 'エラー発生時のUIデザインで必ず含めるべき要素はどれですか？',
        options: [
          'エラーメッセージのみ表示',
          'console.errorでログ出力のみ',
          'エラーメッセージと「再試行」などの次のアクションを提供',
          '画面を真っ白にしてページリロードを促す',
        ],
        correctIndex: 2,
        explanation:
          'エラー時は、エラーメッセージの表示だけでなく、ユーザーが次に何をすべきかを示す「再試行」ボタンや「ホームに戻る」リンクなどのアクションを必ず提供します。console.errorだけではユーザーには何も伝わらず、「無反応UI」になってしまいます。',
        hint: 'ErrorMessageコンポーネントにonRetryプロパティが含まれている理由を考えてください',
        tags: ['error', 'ux', 'ui'],
      },
      {
        id: 'le4',
        question: 'useEffectの依存配列で無限ループを防ぐために正しいのはどれですか？',
        options: [
          'オブジェクトや配列をそのまま依存配列に入れる',
          'オブジェクトのプリミティブ値（例: filters.status）を依存配列に入れる',
          '依存配列を常に空配列にする',
          '依存配列を指定しない',
        ],
        correctIndex: 1,
        explanation:
          'オブジェクトや配列は毎回新しい参照が作られるため、依存配列に入れると無限ループになります。代わりに、オブジェクトの中のプリミティブ値（文字列、数値など）を依存配列に指定することで、実際に値が変わった時のみuseEffectが再実行されます。オブジェクトが必要な場合はuseMemoで参照を安定させます。',
        hint: 'レッスンの「よくある間違い3」で、filtersオブジェクトとfilters.statusの違いを確認してください',
        tags: ['useEffect', 'dependency', 'hooks'],
      },
    ],
  },
  {
    id: 'react-forms-quiz',
    title: 'フォーム処理',
    description: 'react-hook-formの理解度を確認',
    relatedLessonIds: ['react-forms'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'rf1',
        question: 'react-hook-formの`register`関数の役割として正しいものはどれですか？',
        options: [
          'フォーム入力要素をreact-hook-formに登録し、バリデーションルールを設定する',
          'フォームの送信処理を実行する',
          'フォームのエラーメッセージを表示する',
          'フォームの初期値を設定する',
        ],
        correctIndex: 0,
        explanation:
          '`register`関数は、input要素などのフォーム入力要素をreact-hook-formに登録し、バリデーションルール（required, minLengthなど）を設定する役割を持ちます。',
        hint: "コード例の`{...register('email', { required: 'メールアドレスは必須です' })}`の部分に注目してみましょう",
        tags: ['form', 'react-hook-form', 'register'],
      },
      {
        id: 'rf2',
        question:
          '以下のコードで、パスワードフィールドに最小文字数8文字のバリデーションを追加する正しい方法はどれですか？',
        options: [
          "{...register('password', { minLength: { value: 8, message: '8文字以上' } })}",
          "{...register('password', { min: 8 })}",
          "{...register('password', { length: 8 })}",
          "{...register('password', { validate: length > 8 })}",
        ],
        correctIndex: 0,
        explanation:
          'react-hook-formでは、minLengthオプションをオブジェクト形式で指定します。valueプロパティに最小文字数、messageプロパティにエラーメッセージを設定します。',
        hint: 'レッスンのpasswordフィールドのバリデーション設定を確認してみましょう',
        tags: ['form', 'react-hook-form', 'validation'],
      },
      {
        id: 'rf3',
        question: 'Zodとreact-hook-formを連携させる際に必要なものはどれですか？',
        options: [
          '@hookform/resolvers/zodからzodResolverをインポートし、useFormのresolverオプションに渡す',
          'zodスキーマをregister関数に直接渡す',
          'useFormの代わりにuseZodFormフックを使用する',
          'zodスキーマをhandleSubmit関数に渡す',
        ],
        correctIndex: 0,
        explanation:
          'Zodとreact-hook-formを連携するには、@hookform/resolvers/zodパッケージのzodResolverを使用し、useFormのresolverオプションに`zodResolver(schema)`を渡します。',
        hint: 'レッスンの「Zodとの連携」セクションのuseFormの引数に注目してください',
        tags: ['form', 'react-hook-form', 'zod', 'validation'],
      },
      {
        id: 'rf4',
        question:
          'formState.errorsオブジェクトを使ってエラーメッセージを表示する正しい方法はどれですか？',
        options: [
          '{errors.email && <span>{errors.email.message}</span>}',
          '{errors.email.show()}',
          '<ErrorMessage error={errors.email} />',
          '{displayError(errors.email)}',
        ],
        correctIndex: 0,
        explanation:
          'errors.email が存在する場合に条件付きレンダリングを行い、errors.email.messageプロパティでエラーメッセージを表示します。これはreact-hook-formの標準的なエラー表示パターンです。',
        hint: 'レッスンのコード例で、emailフィールドの下のエラー表示部分を見てみましょう',
        tags: ['form', 'react-hook-form', 'error-handling'],
      },
    ],
  },
  {
    id: 'react-router-basics-quiz',
    title: 'React Router基礎',
    description: 'React Routerの基本の理解度を確認',
    relatedLessonIds: ['react-router-basics'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'rr1',
        question:
          'React Routerでページ遷移を行う際、なぜ<a>タグではなく<Link>コンポーネントを使うべきですか？',
        options: [
          'ページのリロードを防ぎ、SPA（シングルページアプリケーション）として動作させるため',
          '<Link>の方がコードが短く書けるため',
          'SEO対策として検索エンジンに認識されやすくなるため',
          '<a>タグはReactで使用できないため',
        ],
        correctIndex: 0,
        explanation:
          '<a>タグを使うとページ全体がリロードされてしまいますが、<Link>コンポーネントを使うことでクライアントサイドルーティングが実現され、ページをリロードせずにURLに応じた画面を表示できます。',
        hint: 'React Routerの最大の特徴は、ページリロードなしでの画面遷移です。',
        tags: ['router', 'navigation', 'spa'],
      },
      {
        id: 'rr2',
        question:
          '動的ルート /users/:userId でURLパラメータを取得するために使用するフックはどれですか？',
        options: ['useSearchParams()', 'useParams()', 'useNavigate()', 'useLoaderData()'],
        correctIndex: 1,
        explanation:
          'useParams()フックを使用することで、URLパス内のパラメータ（:userId など）を取得できます。useSearchParams()はクエリパラメータ（?page=1 など）の取得に使用します。',
        hint: 'パラメータ（params）という単語に注目してください。',
        tags: ['router', 'hooks', 'params'],
      },
      {
        id: 'rr3',
        question: '<Outlet />コンポーネントの役割として正しいものはどれですか？',
        options: [
          'ルート定義を簡潔に記述するためのヘルパーコンポーネント',
          '親ルートのレイアウト内で子ルートのコンポーネントを表示する場所を指定する',
          'エラーが発生した際のフォールバック表示を行う',
          'ローディング中の画面を表示する',
        ],
        correctIndex: 1,
        explanation:
          '<Outlet />は、ネストされたルート構造において、親コンポーネント（レイアウト）内で子ルートのコンポーネントをレンダリングする位置を指定します。これにより、ヘッダーやフッターなどの共通レイアウトを維持しながら、ページごとの内容を切り替えることができます。',
        hint: 'レイアウトの共有に関するセクションを思い出してください。',
        tags: ['router', 'layout', 'components'],
      },
      {
        id: 'rr4',
        question:
          "次のコードの問題点は何ですか？\n\nfunction BadComponent() {\n  const navigate = useNavigate();\n  if (!user) {\n    navigate('/login');\n  }\n  return <div>Content</div>;\n}",
        options: [
          'useNavigate()の戻り値を変数に代入してはいけない',
          'レンダリング中にnavigate()を呼び出している',
          'navigate()の引数が間違っている',
          'userの存在チェックに!演算子を使用している',
        ],
        correctIndex: 1,
        explanation:
          'navigate()をレンダリング中（関数コンポーネントの本体内）で直接呼び出すのは推奨されません。正しくは、useEffect内で呼び出すか、イベントハンドラ内で実行する必要があります。レンダリング中に副作用を起こすと予期しない動作を引き起こす可能性があります。',
        hint: 'レッスンの「よくある間違い」セクションの3番目を確認してください。',
        tags: ['router', 'hooks', 'best-practices'],
      },
    ],
  },
  {
    id: 'router-advanced-quiz',
    title: 'React Router応用',
    description: '動的ルート、ネストルート、認証ガードの理解度を確認',
    relatedLessonIds: ['router-advanced'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'ra1',
        question: 'ネストルートで子ルートを表示する場所を指定するために使うコンポーネントは？',
        options: ['<Outlet />', '<Route />', '<Children />', '<Nested />'],
        correctIndex: 0,
        explanation:
          '<Outlet />は親ルートのレイアウト内で子ルートを表示する位置を指定するコンポーネントです。これにより、ヘッダーやサイドバーなどの共通UIを保ちながらコンテンツ部分だけを切り替えられます。',
        hint: '親ルートのレイアウトに配置して、子ルートの表示位置を決めるコンポーネントです',
        tags: ['router', 'nested', 'layout'],
      },
      {
        id: 'ra2',
        question: 'URLパラメータ（例: /users/:userId）から値を取得するために使うフックは？',
        options: ['useParams()', 'useSearchParams()', 'useLocation()', 'useNavigate()'],
        correctIndex: 0,
        explanation:
          'useParams()は動的ルートのパラメータ（:userId など）を取得するフックです。const { userId } = useParams() のように使います。useSearchParams()はクエリパラメータ（?q=xxx）、useLocation()は現在のロケーション情報、useNavigate()は遷移関数を取得します。',
        hint: '動的ルートの「:」で定義したパラメータを取得するフックです',
        tags: ['router', 'dynamic', 'hooks'],
      },
      {
        id: 'ra3',
        question:
          '未ログインユーザーを保護されたページからログインページにリダイレクトする正しい実装は？',
        options: [
          'if (!user) return <Navigate to="/login" replace />',
          'if (!user) window.location.href = "/login"',
          'if (!user) history.push("/login")',
          'if (!user) useNavigate()("/login")',
        ],
        correctIndex: 0,
        explanation:
          '<Navigate>コンポーネントを使うことで、React Routerの仕組みに従った宣言的なリダイレクトができます。replace属性により履歴を置き換え、戻るボタンで保護ページに戻れないようにします。window.location.hrefは画面全体がリロードされるため非推奨です。',
        hint: 'React Routerのコンポーネントを使った宣言的なリダイレクトが推奨されます',
        tags: ['router', 'auth', 'redirect'],
      },
      {
        id: 'ra4',
        question: 'URLに入れるべき情報として適切なものはどれ？',
        options: [
          '検索条件やフィルタ設定（共有・ブックマークしたい情報）',
          'モーダルの開閉状態やタブの選択状態',
          'フォーム入力中の一時的な値',
          'スクロール位置やアニメーション状態',
        ],
        correctIndex: 0,
        explanation:
          'URLには「共有したい」「ブックマークしたい」「リロードで消えてほしくない」情報を入れます。検索条件やページ番号はこれに該当します。モーダル開閉やフォーム入力中の値など、一時的なUI状態はstateで管理します。「このURLを人に送れるか？」を判断基準にしましょう。',
        hint: '「このURLを人に送って意味があるか？」を考えてみましょう',
        tags: ['router', 'best-practice', 'url'],
      },
    ],
  },
  {
    id: 'useCallback-useMemo-quiz',
    title: 'useCallback/useMemo',
    description: 'useCallback/useMemoの理解度を確認',
    relatedLessonIds: ['useCallback-useMemo'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'um1',
        question: 'useMemoの主な用途として最も適切なものはどれですか？',
        options: [
          '重い計算結果をキャッシュして、不要な再計算を防ぐ',
          '関数の参照を安定化させて、子コンポーネントの再レンダリングを防ぐ',
          'コンポーネント全体をメモ化して、propsが変わらない限り再レンダリングを防ぐ',
          '非同期処理の結果をキャッシュして、APIリクエストを減らす',
        ],
        correctIndex: 0,
        explanation:
          'useMemoは計算結果をキャッシュするためのフックです。依存配列の値が変わらない限り、前回の計算結果を再利用し、不要な再計算を防ぎます。関数のメモ化はuseCallback、コンポーネントのメモ化はReact.memoが担当します。',
        hint: 'useMemoは「値」のメモ化に使用します',
        tags: ['useMemo', 'performance'],
      },
      {
        id: 'um2',
        question:
          '次のコードについて、正しい説明はどれですか？\n\n```tsx\nfunction Parent() {\n  const handleClick = useCallback(() => {}, []);\n  return <Child onClick={handleClick} />;\n}\n\nfunction Child({ onClick }) {\n  return <button onClick={onClick}>Click</button>;\n}\n```',
        options: [
          'useCallbackを使っているので、Childは再レンダリングされない',
          'ChildをReact.memoでラップしていないため、Parentが再レンダリングするたびにChildも再レンダリングされる',
          '依存配列が空なので、handleClickは毎回新しい関数が生成される',
          'useCallbackの使い方が間違っているため、エラーが発生する',
        ],
        correctIndex: 1,
        explanation:
          'useCallbackは関数の参照を安定化させますが、それだけでは子コンポーネントの再レンダリングは防げません。子コンポーネントがReact.memoでラップされていない場合、親が再レンダリングするたびに子も再レンダリングされます。useCallbackはReact.memoと組み合わせて使う必要があります。',
        hint: 'useCallbackだけでは効果がありません。何と組み合わせる必要があるでしょうか？',
        tags: ['useCallback', 'React.memo', 'performance'],
      },
      {
        id: 'um3',
        question:
          '次のコードで依存配列に関する問題はどれですか？\n\n```tsx\nconst [userId, setUserId] = useState(1);\nconst [filterType, setFilterType] = useState("all");\n\nconst fetchUser = useCallback(() => {\n  fetch(`/api/users/${userId}`);\n}, []);\n\nconst filtered = useMemo(\n  () => items.filter(i => i.type === filterType),\n  [items]\n);\n```',
        options: [
          'fetchUserの依存配列にuserIdがなく、filteredの依存配列にfilterTypeがない',
          'useCallbackとuseMemoの依存配列は常に空でなければならない',
          'userIdとfilterTypeをstateで管理しているのが間違い',
          '問題なく、正しいコードである',
        ],
        correctIndex: 0,
        explanation:
          '依存配列には、関数や計算で使用しているすべての外部変数を含める必要があります。fetchUserはuserIdを使っているのに依存配列に含まれていないため、古いuserIdを参照し続けます。同様に、filteredはfilterTypeを使っているのに依存配列に含まれていないため、filterTypeが変わっても再計算されません。ESLintのexhaustive-depsルールを有効にすると、このような漏れを検出できます。',
        hint: '関数や計算の中で使っている変数は、すべて依存配列に含める必要があります',
        tags: ['useCallback', 'useMemo', 'dependencies'],
      },
      {
        id: 'um4',
        question: 'メモ化が不要で、直接計算した方が良いケースはどれですか？',
        options: [
          '単純な算術計算や文字列の結合',
          '配列のフィルタリングやソート処理',
          'React.memoされた子コンポーネントに渡す関数',
          'useEffectの依存配列に含まれるオブジェクト',
        ],
        correctIndex: 0,
        explanation:
          'メモ化自体にもコストがかかるため、単純な計算（count * 2や文字列結合など）は直接実行した方が速いことがあります。メモ化が有効なのは、重い計算（配列のfilter/sort）や参照の安定化が必要な場合（memo化された子へのprops、useEffect依存）です。「メモ化すれば速くなる」は誤解で、過度な最適化は避けるべきです。',
        hint: 'メモ化にもコストがあります。どんな場合に最適化が不要でしょうか？',
        tags: ['useMemo', 'performance', 'optimization'],
      },
    ],
  },
  {
    id: 'useEffect-hook-quiz',
    title: 'useEffect',
    description: 'useEffectの理解度を確認',
    relatedLessonIds: ['useEffect-hook'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'ue1',
        question: 'useEffectの主な用途として正しいものはどれですか？',
        options: [
          '副作用（データ取得、DOM操作、購読など）の処理',
          '状態の管理',
          'コンポーネントのスタイル定義',
          'ルーティングの設定',
        ],
        correctIndex: 0,
        explanation:
          'useEffectは、コンポーネントの副作用（データ取得、DOM操作、購読など）を処理するためのフックです。状態管理にはuseStateを使用します。',
        hint: 'useEffectは「副作用」を管理するフックです',
        tags: ['useEffect', 'side-effects'],
      },
      {
        id: 'ue2',
        question: '依存配列に空配列[]を指定した場合、useEffect内の処理はいつ実行されますか？',
        options: [
          'コンポーネントのマウント時に1回だけ',
          '毎回のレンダリング後',
          'コンポーネントのアンマウント時のみ',
          '依存する値が変更されたとき',
        ],
        correctIndex: 0,
        explanation:
          '依存配列に空配列[]を指定すると、useEffect内の処理は初回レンダリング後（マウント時）に1回だけ実行されます。',
        hint: '空配列は「依存する値がない」ことを意味します',
        tags: ['useEffect', 'dependency-array'],
      },
      {
        id: 'ue3',
        question:
          '次のコードでクリーンアップ関数が実行されるタイミングはいつですか？\n\nuseEffect(() => {\n  const interval = setInterval(() => {}, 1000);\n  return () => clearInterval(interval);\n}, []);',
        options: [
          'コンポーネントのアンマウント時',
          'コンポーネントのマウント時',
          '毎回のレンダリング後',
          'エラーが発生したとき',
        ],
        correctIndex: 0,
        explanation:
          'useEffectから返される関数（クリーンアップ関数）は、コンポーネントのアンマウント時に実行されます。タイマーやイベントリスナーなどのリソースを解放するために使用します。',
        hint: 'returnで返される関数は「後片付け」のためのものです',
        tags: ['useEffect', 'cleanup'],
      },
      {
        id: 'ue4',
        question:
          'イベントリスナーを登録する際、なぜクリーンアップ関数でremoveEventListenerを呼ぶ必要がありますか？',
        options: [
          'メモリリークを防ぐため',
          'パフォーマンスを向上させるため',
          'エラーを防ぐため',
          'コードを読みやすくするため',
        ],
        correctIndex: 0,
        explanation:
          'イベントリスナーを解除しないと、コンポーネントがアンマウントされてもリスナーが残り続け、メモリリークの原因となります。クリーンアップ関数で必ず解除する必要があります。',
        hint: 'リソースを適切に解放しないと何が起こるでしょうか',
        tags: ['useEffect', 'cleanup', 'memory-leak'],
      },
    ],
  },
  {
    id: 'useReducer-hook-quiz',
    title: 'useReducer',
    description: 'useReducerの理解度を確認',
    relatedLessonIds: ['useReducer-hook'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'ur1',
        question: 'useReducerの第一引数と第二引数は何ですか？',
        options: [
          'reducer関数と初期状態',
          '初期状態とreducer関数',
          'action と state',
          'dispatch と state',
        ],
        correctIndex: 0,
        explanation:
          'useReducerは第一引数にreducer関数、第二引数に初期状態を受け取ります。useReducer(reducer, initialState)の形式で使用します。',
        hint: 'useReducer(?, ?)の順番を考えてみましょう',
        tags: ['useReducer', 'state'],
      },
      {
        id: 'ur2',
        question: 'reducer関数の中で状態を更新する際、必ず守るべき原則は何ですか？',
        options: [
          '新しいオブジェクトを返す（イミュータブルに更新）',
          '既存の状態を直接変更する',
          'dispatchを呼び出す',
          'useStateと併用する',
        ],
        correctIndex: 0,
        explanation:
          'reducer関数では、既存の状態を変更せず、常に新しい状態オブジェクトを返す必要があります。これによりReactが変更を正しく検知できます。',
        hint: 'Reactの状態管理の基本原則を思い出してみましょう',
        tags: ['useReducer', 'immutability'],
      },
      {
        id: 'ur3',
        question: 'useStateの代わりにuseReducerを使うべきケースはどれですか？',
        options: [
          '単純な真偽値の切り替え',
          '複数の関連する状態があり、更新ロジックが複雑な場合',
          '文字列を1つだけ管理する場合',
          'useStateが使えない場合',
        ],
        correctIndex: 1,
        explanation:
          'useReducerは、複数の関連する状態があり、次の状態が前の状態に依存する場合や、更新ロジックが複雑な場合に適しています。単純な状態管理にはuseStateで十分です。',
        hint: 'レッスンの「useStateとの使い分け」セクションを思い出してみましょう',
        tags: ['useReducer', 'useState', 'state'],
      },
      {
        id: 'ur4',
        question: 'dispatch({ type: "increment" })を実行すると何が起こりますか？',
        options: [
          'reducerが呼び出され、actionに基づいて新しい状態が計算される',
          '状態が直接1増える',
          'incrementという名前の関数が実行される',
          'エラーが発生する',
        ],
        correctIndex: 0,
        explanation:
          'dispatchを呼び出すと、渡されたactionオブジェクトと現在の状態を引数としてreducer関数が実行されます。reducerはactionのtypeを判定し、対応する新しい状態を返します。',
        hint: 'dispatchとreducerの関係を考えてみましょう',
        tags: ['useReducer', 'dispatch', 'action'],
      },
    ],
  },
  {
    id: 'useRef-hook-quiz',
    title: 'useRef',
    description: 'useRefの理解度を確認',
    relatedLessonIds: ['useRef-hook'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'urf1',
        question: 'useRefの主な用途として正しいものを選んでください',
        options: [
          'DOM要素への参照と再レンダリングを起こさない値の保持',
          '画面に表示する値の管理と状態の更新',
          'APIからのデータ取得と非同期処理',
          'コンポーネント間のデータ共有とグローバル状態管理',
        ],
        correctIndex: 0,
        explanation:
          'useRefは主に「DOM要素への参照」と「再レンダリングを起こさずに値を保持」するために使用します。画面に表示する値の管理にはuseStateを使用します。',
        hint: 'useRefは再レンダリングを起こさない特徴があります',
        tags: ['useRef', 'basics'],
      },
      {
        id: 'urf2',
        question:
          '次のコードで「+1」ボタンをクリックしても画面が更新されない理由は何ですか？\n\n```tsx\nconst count = useRef(0);\nreturn <button onClick={() => count.current++}>{count.current}</button>;\n```',
        options: [
          'useRefの値を変更しても再レンダリングが発生しないため',
          'ref.currentの更新方法が間違っているため',
          'useRefは数値を保持できないため',
          'ボタンのonClickイベントが正しく設定されていないため',
        ],
        correctIndex: 0,
        explanation:
          'useRefは値が変更されても再レンダリングを起こしません。画面に表示する値にはuseStateを使う必要があります。ref.currentの値は内部的に更新されていますが、画面には反映されません。',
        hint: 'useRefとuseStateの違いを考えてみましょう',
        tags: ['useRef', 'useState', 'pitfalls'],
      },
      {
        id: 'urf3',
        question: 'DOM要素への参照を安全に操作するために必要なことは何ですか？',
        options: [
          'オプショナルチェーン（?.）やif文でnullチェックを行う',
          'ref.currentを依存配列に追加する',
          'useRefの初期値にDOM要素を直接渡す',
          'forceUpdateで強制的に再レンダリングする',
        ],
        correctIndex: 0,
        explanation:
          'refの初期値はnullであり、DOM要素がマウントされるまでref.currentはnullのままです。そのため、inputRef.current?.focus()のようにオプショナルチェーンを使うか、if文でnullチェックを行う必要があります。',
        hint: 'refの初期値はnullで、DOMがマウントされるまでnullのままです',
        tags: ['useRef', 'dom', 'safety'],
      },
      {
        id: 'urf4',
        question: 'タイマーのintervalIdをuseRefで保持する理由として最も適切なものはどれですか？',
        options: [
          '再レンダリングが発生してもIDが保持され、停止ボタンでclearIntervalできるため',
          'useStateよりもメモリ効率が良いため',
          '画面にintervalIdを表示する必要があるため',
          'useEffectの依存配列に含める必要があるため',
        ],
        correctIndex: 0,
        explanation:
          'intervalIdは画面に表示する必要がなく、再レンダリングを起こす必要もありません。useRefで保持することで、再レンダリングが発生してもIDが保持され、stopボタンでclearInterval(intervalRef.current)を呼び出してタイマーを停止できます。',
        hint: 'intervalIdは画面に表示する必要がないデータです',
        tags: ['useRef', 'timer', 'use-case'],
      },
    ],
  },
  // Advanced quizzes
  {
    id: 'react-performance-quiz',
    title: 'パフォーマンス最適化',
    description: 'Reactパフォーマンス最適化の理解度を確認',
    relatedLessonIds: ['react-performance'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'rp1',
        question:
          "以下のコードでReact.memoが効かない原因として最も適切なものはどれか？\n\n```tsx\nfunction Parent() {\n  const [count, setCount] = useState(0);\n  return (\n    <MemoizedChild\n      onClick={() => console.log('click')}\n      style={{ color: 'red' }}\n    />\n  );\n}\n```",
        options: [
          'onClick propsとstyle propsが毎回新しい参照になるため、shallow comparisonで差分が検出される',
          'MemoizedChildコンポーネントの内部でuseStateを使用しているため',
          'Parent コンポーネントでuseCallbackを使用していないため',
          'React.memoは関数コンポーネントには使用できないため',
        ],
        correctIndex: 0,
        explanation:
          'React.memoはpropsのshallow comparisonを行い、propsが同じなら再レンダリングをスキップします。しかし、インライン関数（onClick）とインラインオブジェクト（style）は毎回新しい参照が作られるため、propsが変わったと判断され、React.memoの効果がありません。useCallbackとuseMemoで参照を安定させる必要があります。',
        hint: 'オブジェクトと関数の「参照の同一性」について考えてみましょう。',
        tags: ['React.memo', 'useCallback', 'shallow-comparison'],
      },
      {
        id: 'rp2',
        question:
          'レッスンの「判断基準」表によると、useMemoを使った最適化を「する」べき状況はどれか？',
        options: [
          '配列が50件以下でフィルタリング処理を行う場合',
          'React DevTools Profilerで16msを超えるレンダリングが計測された場合',
          '単純な足し算（a + b）の計算を行う場合',
          'とりあえず念のため最適化しておきたい場合',
        ],
        correctIndex: 1,
        explanation:
          'レッスンでは「Profilerで16ms超のレンダリング」を最適化すべき状況（◎ する）としています。16msは60fps（1秒間に60フレーム）を維持するための閾値で、これを超えるとユーザー体感に影響します。配列50件以下、単純な計算、「念のため」の最適化は不要（× しない）とされています。',
        hint: '60fpsを維持するための時間の閾値を考えましょう。',
        tags: ['useMemo', 'profiler', 'measurement'],
      },
      {
        id: 'rp3',
        question:
          '以下の練習問題のコードレビューで、最も重大な問題はどれか？\n\n```tsx\nfunction ProductList({ products, onSelect }) {\n  const filtered = useMemo(\n    () => products.filter(p => p.name.includes(filter)),\n    [products, filter]\n  );\n  return (\n    <div>\n      {filtered.map((product, index) => (\n        <ProductCard\n          key={index}\n          onClick={() => onSelect(product.id)}\n          style={{ marginBottom: 8 }}\n        />\n      ))}\n    </div>\n  );\n}\nconst ProductCard = memo(({ product, onClick, style }) => (\n  <div style={style} onClick={onClick}>{product.name}</div>\n));\n```',
        options: [
          'keyにインデックスを使用しているため、配列の順序が変わると全アイテムが再マウントされる',
          'useMemoの依存配列にproductsとfilterが含まれていないため',
          'ProductCardでmemoを使っているがonClickとstyleが毎回新しい参照になるため効果がない',
          'ProductListコンポーネントでuseStateを使用していないため',
        ],
        correctIndex: 0,
        explanation:
          '最も重大な問題はkeyにインデックスを使用していることです。配列の順序が変わる（例：フィルタリングや並び替え）と、Reactは全アイテムを「別物」と判断してアンマウント→再マウントします。レッスンでは「keyには一意で安定したIDを使う」ことが推奨されており、`key={product.id}`とすべきです。onClickとstyleの問題も重要ですが、keyの問題の方がパフォーマンスへの影響が大きいです。',
        hint: 'Reactがリストの各要素を識別する仕組みについて考えましょう。',
        tags: ['key', 'list-rendering', 'code-review'],
      },
      {
        id: 'rp4',
        question:
          "Contextの値を最適化する際、以下のコードの問題点と正しい修正方法の組み合わせとして最も適切なものはどれか？\n\n```tsx\nfunction ThemeProvider({ children }) {\n  const [theme, setTheme] = useState('light');\n  return (\n    <ThemeContext.Provider value={{ theme, setTheme }}>\n      {children}\n    </ThemeContext.Provider>\n  );\n}\n```",
        options: [
          '問題: valueが毎回新しいオブジェクトになる / 修正: `const value = useMemo(() => ({ theme, setTheme }), [theme]);`',
          '問題: ThemeContext.Providerを使用している / 修正: useContextフックを使用する',
          '問題: childrenが再レンダリングされる / 修正: childrenをReact.memoでラップする',
          '問題: setThemeが依存配列に含まれていない / 修正: `useMemo(() => ({ theme, setTheme }), [theme, setTheme]);`',
        ],
        correctIndex: 0,
        explanation:
          'Contextの値がオブジェクトの場合、毎回新しい参照が作られるとすべての購読コンポーネントが再レンダリングされます。レッスンでは「Context.ProviderのvalueはuseMemoでメモ化する」ことが推奨されています。setThemeはsetState関数なので依存配列に含める必要はありません（参照が安定している）。正しい修正は`useMemo(() => ({ theme, setTheme }), [theme])`です。',
        hint: 'Context.Providerのvalueの参照が変わると、何が起きるか考えましょう。',
        tags: ['context', 'useMemo', 're-rendering'],
      },
    ],
  },
  {
    id: 'state-management-patterns-quiz',
    title: '状態管理パターン',
    description: '状態管理パターンの理解度を確認',
    relatedLessonIds: ['state-management-patterns'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'smp1',
        question:
          "以下の状態のうち、Contextで管理すべきでないものはどれですか？\n\n```tsx\nconst AppContext = createContext({\n  user: null,           // A\n  theme: 'light',       // B\n  isMenuOpen: false,    // C\n  selectedProductId: null // D\n});\n```",
        options: [
          'C（isMenuOpen）とD（selectedProductId）の両方',
          'A（user）とB（theme）の両方',
          'C（isMenuOpen）のみ',
          '全てContextで管理すべき',
        ],
        correctIndex: 0,
        explanation:
          'isMenuOpenはヘッダー内でしか使わないLocalな状態、selectedProductIdは商品ページでしか使わないため、これらをグローバルなContextに入れるべきではありません。一方、userやthemeはアプリ全体で使われるため、Contextで管理するのが適切です。状態のスコープは「誰が使うか」で判断します。',
        hint: '「この状態は誰が使う？」を考えましょう。1-2コンポーネントで使う状態はLocalで十分です。',
        tags: ['state-scope', 'context', 'pitfall'],
      },
      {
        id: 'smp2',
        question:
          "以下の状態管理設計で、UI StateとDomain Stateを分離するための正しい改善方法はどれですか？\n\n```tsx\ntype State = {\n  users: User[];           // サーバーから取得\n  selectedUserId: string;  // ユーザー選択\n  isLoading: boolean;      // ローディング状態\n  sortOrder: 'asc' | 'desc'; // ソート順\n};\n```",
        options: [
          'usersとisLoadingはTanStack Queryなどで管理し、selectedUserIdとsortOrderはuseStateで管理する',
          '全ての状態を1つのuseReducerで管理する',
          '全ての状態を外部ストア（Zustand等）で管理する',
          'usersとselectedUserIdをContext、isLoadingとsortOrderをuseStateで管理する',
        ],
        correctIndex: 0,
        explanation:
          'Domain State（users、isLoading）はサーバーと同期が必要なため、TanStack Queryなどのサーバー状態管理ライブラリで扱います。UI State（selectedUserId、sortOrder）はローカルで完結するため、useStateで管理します。この分離により、キャッシュ戦略が明確になり、テストも容易になります。',
        hint: '「この状態はサーバーにあるべきか、クライアントだけで持つべきか」を考えましょう。',
        tags: ['ui-state', 'domain-state', 'separation'],
      },
      {
        id: 'smp3',
        question: 'カートの状態管理でuseReducerを使うべき理由として最も適切なものはどれですか？',
        options: [
          '複数のアクション（追加、削除、数量変更、クリア）が相互に関連する複雑な状態遷移があるため',
          'グローバルに状態を共有したいため',
          'useStateより処理速度が速いため',
          'Contextと組み合わせる際に必須だから',
        ],
        correctIndex: 0,
        explanation:
          'useReducerは「複数のアクションが状態を変更する」「状態遷移のロジックが複雑」な場合に適しています。カートの場合、追加時に既存アイテムの数量を増やす、削除時にフィルタリングする、など複数の状態遷移があり、これらをReducerで一元管理することで見通しが良くなります。useReducerはグローバル化や速度のためのツールではありません。',
        hint: '「複数のアクションが状態を変更する」「状態遷移が複雑」な場合を考えましょう。',
        tags: ['useReducer', 'complex-state', 'cart'],
      },
      {
        id: 'smp4',
        question:
          '状態の寿命（ライフサイクル）に基づいた管理方法の組み合わせとして正しいものはどれですか？\n\n- モーダルの開閉状態\n- ユーザーのログイン状態\n- フォームの入力値\n- テーマ設定（ダークモード）',
        options: [
          'useState / Context+外部ストア / useState / localStorage+Context',
          'Context / useState / Context / useState',
          '全てlocalStorage+外部ストア',
          'useState / localStorage / Context / useReducer',
        ],
        correctIndex: 0,
        explanation:
          '状態の寿命に応じて適切な管理方法を選びます。モーダル開閉は一時的な状態でuseState、ログイン状態はセッション中保持でContext+外部ストア、フォーム入力はページ内でuseState、テーマ設定は永続化が必要でlocalStorage+Contextが適切です。寿命が短い状態ほどLocalに、長い状態ほど上位で管理します。',
        hint: '一時的/ページ/セッション/永続の4つの寿命を考えましょう。',
        tags: ['lifecycle', 'state-lifetime', 'management-method'],
      },
    ],
  },
  {
    id: 'testing-basics-quiz',
    title: 'テスト基礎',
    description: 'Reactテストの基礎の理解度を確認',
    relatedLessonIds: ['testing-basics'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'tb1',
        question:
          "以下のテストコードの問題点として最も適切なものはどれか？\n\n```tsx\nit('sets isOpen state to true when clicking button', () => {\n  const { result } = renderHook(() => useModal());\n  act(() => {\n    result.current.open();\n  });\n  expect(result.current.isOpen).toBe(true);\n});\n```",
        options: [
          '内部stateを直接検証しているため、リファクタリング時にテストが壊れやすい',
          'act()の使い方が間違っているため、警告が発生する',
          'renderHookではなくrenderを使うべきである',
          'waitForを使わずに即座に検証しているため、非同期処理に対応できない',
        ],
        correctIndex: 0,
        explanation:
          'このテストは内部の実装詳細（isOpenというstate名）に依存しています。isOpenをisVisibleに変更しただけでテストが壊れてしまいます。ユーザーに見える結果（モーダルコンテンツが表示される）をテストすべきです。',
        hint: '「ユーザー視点のテスト」の原則を思い出してください。実装を変えても動作が同じなら、テストは通るべきです。',
        tags: ['testing', 'pitfalls', 'implementation-details'],
      },
      {
        id: 'tb2',
        question: 'テストピラミッドに関する説明として最も適切なものはどれか？',
        options: [
          'E2Eテストは本番環境に最も近いため、全てのテストケースをE2Eでカバーすべきである',
          'Unitテストを多く、Integrationテストを中程度、E2Eテストを少なくするのが原則である',
          'Integrationテストだけあれば十分で、UnitテストとE2Eテストは不要である',
          'カバレッジ100%を達成するため、全レイヤーで同じ数のテストを書くべきである',
        ],
        correctIndex: 1,
        explanation:
          'テストピラミッドの原則は、下層（Unit）を厚く、上層（E2E）を薄くすることです。Unitテストは速くて安定、E2Eは遅くて不安定なため、コスト効率を最大化するにはこの配分が最適です。E2Eはクリティカルパスのみをカバーします。',
        hint: '各レイヤーの速度と信頼性のトレードオフを考えてください。',
        tags: ['testing', 'test-pyramid', 'strategy'],
      },
      {
        id: 'tb3',
        question:
          "以下のコードで適切な待機方法はどれか？\n\n```tsx\nit('API呼び出し後にデータが表示される', async () => {\n  const user = userEvent.setup();\n  render(<UserList />);\n  await user.click(screen.getByRole('button', { name: '読み込む' }));\n  // データ表示を確認したい\n});\n```",
        options: [
          "expect(await screen.findByText('John')).toBeInTheDocument();",
          "await new Promise(r => setTimeout(r, 500)); expect(screen.getByText('John')).toBeInTheDocument();",
          "expect(screen.getByText('John')).toBeInTheDocument();",
          "await waitFor(() => {}); expect(screen.getByText('John')).toBeInTheDocument();",
        ],
        correctIndex: 0,
        explanation:
          'findByは非同期処理を適切に待機できるため、API呼び出し後の要素取得に最適です。固定時間のsetTimeoutは環境によって不安定になり、waitForの空呼び出しも意味がありません。',
        hint: 'findByは要素が見つかるまで自動的に待機します。',
        tags: ['testing', 'async', 'testing-library'],
      },
      {
        id: 'tb4',
        question:
          'バリデーションロジックとUIコンポーネントのテスト戦略として最も適切なものはどれか？',
        options: [
          'validateEmail関数の全パターン（空文字、無効形式、有効形式など）をLoginFormのIntegrationテストで検証する',
          'validateEmail関数はUnitテストで全パターンを検証し、LoginFormでは連携確認（エラー表示、送信可否）のみテストする',
          '全てE2Eテストでカバーし、UnitテストとIntegrationテストは書かない',
          'カバレッジ100%達成のため、両方で同じパターンを重複してテストする',
        ],
        correctIndex: 1,
        explanation:
          'ロジックとUIの責務を分離することで、効率的なテスト戦略が実現できます。validateEmailのような純粋なロジックはUnitテストで高速に全パターンを検証し、LoginFormのIntegrationテストでは「バリデーション結果がUIに正しく反映されるか」という連携のみを確認します。これにより重複を避け、高速で保守しやすいテストスイートになります。',
        hint: '「UIテストでロジックを検証する」のPitfallsセクションを思い出してください。',
        tags: ['testing', 'separation-of-concerns', 'unit-vs-integration'],
      },
    ],
  },
  {
    id: 'typescript-with-react-quiz',
    title: 'TypeScriptとReact',
    description: 'TypeScriptとReactの理解度を確認',
    relatedLessonIds: ['typescript-with-react'],
    timeLimitSec: 300,
    questions: [
      {
        id: 'tr1',
        question:
          '以下のコードにおいて、型設計上の問題点として最も適切なものはどれか？\n\n```tsx\ntype User = {\n  id: string;\n  name: string;\n  isLoading: boolean;\n  error: Error | null;\n};\n\nconst user: User = await fetchUser();\n```',
        options: [
          'Domain型（User）にUI状態（isLoading、error）が混入しており、責務が分離されていない',
          'Errorオブジェクトをnullと共用体にするべきではなく、undefinedを使うべき',
          'idとnameの型がstringで統一されており、区別できない',
          'async/await構文を使っているため、型推論が正しく機能しない',
        ],
        correctIndex: 0,
        explanation:
          'Domain型（APIから返されるビジネスロジック用の型）にUI状態（isLoading、errorなど）を混ぜると責務が曖昧になります。User型はAPIスキーマのみを表現し、UI状態は`AsyncState<User>`などの別の型で管理すべきです。',
        hint: 'レッスンの「UI用の型とDomain型の混同」セクションを参照してください。',
        tags: ['typescript', 'design', 'discriminated-union'],
      },
      {
        id: 'tr2',
        question:
          '外部APIからのレスポンスデータを安全に処理する方法として、最も適切なものはどれか？\n\n```tsx\nasync function fetchUser(id: string) {\n  const response = await fetch(`/api/users/${id}`);\n  const data = await response.json();\n  // ここでdataをどう処理するか？\n}\n```',
        options: [
          '`const user = data as User;` で型アサーションを使い、User型として扱う',
          '`const data: User = await response.json();` で直接User型を指定する',
          '`const data: unknown = await response.json();` で受け取り、型ガード関数で検証してからUser型として扱う',
          '`const data: any = await response.json();` で受け取り、後でUser型に変換する',
        ],
        correctIndex: 2,
        explanation:
          'API境界では何が返ってくるか信頼できないため、まず`unknown`で受け取り、型ガード関数（`isUser(data): data is User`）で実際のデータ構造を検証してから型安全に使用します。型アサーション（as）や直接型指定は実行時の検証がないため危険です。',
        hint: 'レッスンの「型ガード（API境界で使う）」セクションと「なぜunknown + 型ガードを推奨するのか」を参照してください。',
        tags: ['typescript', 'type-guard', 'api'],
      },
      {
        id: 'tr3',
        question:
          '以下のコンポーネントにおいて、Generic `<T>` を使用する必要性について最も適切な判断はどれか？\n\n```tsx\ntype UserCardProps<T extends User> = {\n  user: T;\n  onSelect: (user: T) => void;\n};\n\nfunction UserCard<T extends User>({ user, onSelect }: UserCardProps<T>) {\n  return <div onClick={() => onSelect(user)}>{user.name}</div>;\n}\n```',
        options: [
          '必要。User型を拡張した様々な型に対応できるため、汎用性が高まる',
          '不要。このコンポーネントは特定のUser型でしか使われておらず、過剰なGenericで可読性を下げている',
          '必要。TypeScriptのベストプラクティスとして、コンポーネントは常にGenericで定義すべき',
          '不要。Reactコンポーネントでは型パラメータを使用できないため、削除が必須',
        ],
        correctIndex: 1,
        explanation:
          'このコンポーネントは1箇所（User型）でしか使われていないため、Genericは不要です。`type UserCardProps = { user: User; onSelect: (user: User) => void; }`とシンプルに書くべきです。Genericは複数の異なる型で再利用される場合にのみ価値があります。',
        hint: 'レッスンの「過剰なGeneric」セクションと「なぜGenericは必要な場合だけなのか」を参照してください。',
        tags: ['typescript', 'generic', 'design'],
      },
      {
        id: 'tr4',
        question:
          "Discriminated Unionを使った状態管理において、以下のコードの利点として最も適切なものはどれか？\n\n```tsx\ntype AsyncState<T> =\n  | { status: 'idle' }\n  | { status: 'loading' }\n  | { status: 'error'; error: Error }\n  | { status: 'success'; data: T };\n\nswitch (state.status) {\n  case 'success':\n    return <p>{state.data.name}</p>; // state.dataは確実に存在\n}\n```",
        options: [
          'switch文を使うことでコードの実行速度が向上し、パフォーマンスが改善される',
          'statusプロパティで型が自動的に絞り込まれ、成功時にはstate.dataが確実に存在することをTypeScriptが保証する',
          'すべての状態を1つのオブジェクトで管理できるため、メモリ使用量が削減される',
          '非同期処理の順序を保証し、loading → success の順に必ず実行される',
        ],
        correctIndex: 1,
        explanation:
          "Discriminated Union（判別可能な共用体型）では、共通プロパティ（status）で分岐すると、TypeScriptが自動的に型を絞り込みます。`case 'success'`では`state.data`が確実に存在し、`case 'error'`では`state.error`が存在することが型レベルで保証されるため、実行時エラーを防げます。",
        hint: 'レッスンの「Discriminated Unionで状態を表現」セクションを参照してください。',
        tags: ['typescript', 'discriminated-union', 'type-narrowing'],
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
