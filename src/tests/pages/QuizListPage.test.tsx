import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuizListPage } from '@/pages/QuizListPage';
import { ProgressProvider } from '@/features/progress';
import type { Quiz } from '@/domain/types';

// Mock quizzes data using vi.hoisted to avoid hoisting issues
const mockQuizzes = vi.hoisted(
  () =>
    [
      {
        id: 'quiz-1',
        title: 'React基礎クイズ',
        description: 'Reactの基本概念についての理解度を確認します。',
        relatedLessonIds: ['react-basics', 'jsx-basics'],
        questions: [
          {
            id: 'q1',
            question: 'Reactのコンポーネントは何を返しますか？',
            options: ['HTML要素', 'JSX要素', 'JavaScript文字列', 'DOMノード'],
            correctIndex: 1,
            explanation: 'Reactコンポーネントは JSX要素を返します。',
            hint: 'Reactで使う特別な構文を思い出してみましょう。',
            tags: ['react', 'jsx'],
          },
          {
            id: 'q2',
            question: 'JSXでJavaScript式を埋め込む際に使う記号は？',
            options: ['( )', '[ ]', '{ }', '< >'],
            correctIndex: 2,
            explanation: 'JSX内でJavaScript式を埋め込むには波括弧 { } を使用します。',
            hint: '変数や関数を埋め込む時に使う括弧です。',
            tags: ['jsx'],
          },
          {
            id: 'q3',
            question: 'JSXでclass属性を指定する際の正しい書き方は？',
            options: ['class', 'className', 'cssClass', 'htmlClass'],
            correctIndex: 1,
            explanation: 'JSXでは予約語との衝突を避けるため、classではなくclassNameを使用します。',
            hint: 'JavaScriptの予約語を避けるための命名です。',
            tags: ['jsx'],
          },
        ],
      },
      {
        id: 'quiz-2',
        title: 'React Hooksクイズ',
        description: 'useStateとuseEffectについての理解度を確認します。',
        relatedLessonIds: ['useState-hook', 'useEffect-hook'],
        questions: [
          {
            id: 'h1',
            question: 'useStateの戻り値は何ですか？',
            options: ['値のみ', '配列', 'オブジェクト', '関数'],
            correctIndex: 1,
            explanation: 'useStateは[state, setState]という配列を返します。',
            hint: '分割代入で受け取ることができます。',
            tags: ['hooks', 'useState'],
          },
          {
            id: 'h2',
            question: 'useEffectはいつ実行されますか？',
            options: ['レンダー前', 'レンダー中', 'レンダー後', 'イベント発生時'],
            correctIndex: 2,
            explanation: 'useEffectはコンポーネントのレンダー後に実行されます。',
            hint: '副作用を扱うためのフックです。',
            tags: ['hooks', 'useEffect'],
          },
        ],
      },
      {
        id: 'quiz-3',
        title: 'コンポーネント設計クイズ',
        description: 'Reactコンポーネントの設計について学びます。',
        relatedLessonIds: ['component-design'],
        questions: [
          {
            id: 'c1',
            question: 'propsとstateの違いは何ですか？',
            options: [
              'どちらも同じ',
              'propsは外部から、stateは内部で管理',
              'propsは可変、stateは不変',
              '違いはない',
            ],
            correctIndex: 1,
            explanation:
              'propsは親から渡される不変の値、stateはコンポーネント内で管理する可変の値です。',
            hint: '親子関係を考えてみましょう。',
            tags: ['props', 'state'],
          },
        ],
      },
    ] as Quiz[]
);

// Mock quizzes data module
vi.mock('@/data', () => ({
  quizzes: mockQuizzes,
}));

// Create mock progress hook
const mockUseProgress = vi.hoisted(() =>
  vi.fn(() => ({
    progress: {
      version: 3,
      completedLessons: [],
      completedQuizzes: [],
      completedExercises: [],
      openedLessons: [],
      lastActivity: '',
      quizAttempts: [],
    },
    markLessonOpened: vi.fn(),
    completeLesson: vi.fn(),
    completeQuiz: vi.fn(),
    completeExercise: vi.fn(),
    recordQuizAttempt: vi.fn(),
    isLessonCompleted: vi.fn(),
    isLessonOpened: vi.fn(),
    getCompletedLessonsCount: vi.fn(() => 0),
    getCompletedLessonIds: vi.fn(() => []),
    getTotalLessonsOpened: vi.fn(() => 0),
    resetProgress: vi.fn(),
    setProgress: vi.fn(),
  }))
);

// Mock progress hooks
vi.mock('@/features/progress', async () => {
  const actual = await vi.importActual('@/features/progress');
  return {
    ...actual,
    useProgress: mockUseProgress,
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ProgressProvider>{ui}</ProgressProvider>
    </BrowserRouter>
  );
};

describe('QuizListPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - basic structure', () => {
    it('should render page title', () => {
      renderWithProviders(<QuizListPage />);

      expect(screen.getByText('クイズ一覧')).toBeInTheDocument();
    });

    it('should render page subtitle', () => {
      renderWithProviders(<QuizListPage />);

      expect(screen.getByText('学んだ内容をクイズで確認しましょう')).toBeInTheDocument();
    });

    it('should render all quiz cards', () => {
      renderWithProviders(<QuizListPage />);

      expect(screen.getByText('React基礎クイズ')).toBeInTheDocument();
      expect(screen.getByText('React Hooksクイズ')).toBeInTheDocument();
      expect(screen.getByText('コンポーネント設計クイズ')).toBeInTheDocument();
    });

    it('should render quiz descriptions', () => {
      renderWithProviders(<QuizListPage />);

      expect(screen.getByText('Reactの基本概念についての理解度を確認します。')).toBeInTheDocument();
      expect(
        screen.getByText('useStateとuseEffectについての理解度を確認します。')
      ).toBeInTheDocument();
      expect(screen.getByText('Reactコンポーネントの設計について学びます。')).toBeInTheDocument();
    });
  });

  describe('quiz card display', () => {
    it('should display question count for each quiz', () => {
      renderWithProviders(<QuizListPage />);

      expect(screen.getByText('3 問')).toBeInTheDocument(); // quiz-1
      expect(screen.getByText('2 問')).toBeInTheDocument(); // quiz-2
      expect(screen.getByText('1 問')).toBeInTheDocument(); // quiz-3
    });

    it('should display related lesson IDs', () => {
      renderWithProviders(<QuizListPage />);

      expect(screen.getByText('react-basics')).toBeInTheDocument();
      expect(screen.getByText('jsx-basics')).toBeInTheDocument();
      expect(screen.getByText('useState-hook')).toBeInTheDocument();
      expect(screen.getByText('useEffect-hook')).toBeInTheDocument();
      expect(screen.getByText('component-design')).toBeInTheDocument();
    });

    it('should display "関連レッスン:" label', () => {
      renderWithProviders(<QuizListPage />);

      const labels = screen.getAllByText('関連レッスン:');
      expect(labels).toHaveLength(mockQuizzes.length);
    });

    it('should display start quiz button for incomplete quizzes', () => {
      renderWithProviders(<QuizListPage />);

      const startButtons = screen.getAllByText('クイズを始める');
      expect(startButtons).toHaveLength(mockQuizzes.length);
    });
  });

  describe('quiz completion status', () => {
    beforeEach(() => {
      mockUseProgress.mockReturnValue({
        progress: {
          version: 3,
          completedLessons: [],
          completedQuizzes: ['quiz-1', 'quiz-2'],
          completedExercises: [],
          openedLessons: [],
          lastActivity: '',
          quizAttempts: [],
        },
        markLessonOpened: vi.fn(),
        completeLesson: vi.fn(),
        completeQuiz: vi.fn(),
        completeExercise: vi.fn(),
        recordQuizAttempt: vi.fn(),
        isLessonCompleted: vi.fn(),
        isLessonOpened: vi.fn(),
        getCompletedLessonsCount: vi.fn(() => 0),
        getCompletedLessonIds: vi.fn(() => []),
        getTotalLessonsOpened: vi.fn(() => 0),
        resetProgress: vi.fn(),
        setProgress: vi.fn(),
      });
    });

    it('should display completion badge for completed quizzes', () => {
      renderWithProviders(<QuizListPage />);

      const completedBadges = screen.getAllByText('完了');
      expect(completedBadges).toHaveLength(2);
    });

    it('should display retry button for completed quizzes', () => {
      renderWithProviders(<QuizListPage />);

      expect(screen.getAllByText('もう一度挑戦')).toHaveLength(2);
      expect(screen.getAllByText('クイズを始める')).toHaveLength(1);
    });

    it('should not display completion badge for incomplete quizzes', () => {
      mockUseProgress.mockReturnValue({
        progress: {
          version: 3,
          completedLessons: [],
          completedQuizzes: [],
          completedExercises: [],
          openedLessons: [],
          lastActivity: '',
          quizAttempts: [],
        },
        markLessonOpened: vi.fn(),
        completeLesson: vi.fn(),
        completeQuiz: vi.fn(),
        completeExercise: vi.fn(),
        recordQuizAttempt: vi.fn(),
        isLessonCompleted: vi.fn(),
        isLessonOpened: vi.fn(),
        getCompletedLessonsCount: vi.fn(() => 0),
        getCompletedLessonIds: vi.fn(() => []),
        getTotalLessonsOpened: vi.fn(() => 0),
        resetProgress: vi.fn(),
        setProgress: vi.fn(),
      });

      renderWithProviders(<QuizListPage />);

      expect(screen.queryByText('完了')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should have correct links to quiz pages', () => {
      renderWithProviders(<QuizListPage />);

      const links = screen.getAllByRole('link');
      const quizLinks = links.filter((link) => link.getAttribute('href')?.startsWith('/quiz/'));

      expect(quizLinks).toHaveLength(mockQuizzes.length);
      expect(quizLinks[0]).toHaveAttribute('href', '/quiz/quiz-1');
      expect(quizLinks[1]).toHaveAttribute('href', '/quiz/quiz-2');
      expect(quizLinks[2]).toHaveAttribute('href', '/quiz/quiz-3');
    });

    it('should have accessible link text for incomplete quizzes', () => {
      renderWithProviders(<QuizListPage />);

      const startLinks = screen.getAllByText('クイズを始める');
      startLinks.forEach((link) => {
        expect(link).toHaveAttribute('href');
        expect(link.getAttribute('href')).toMatch(/^\/quiz\//);
      });
    });

    it('should have accessible link text for completed quizzes', () => {
      mockUseProgress.mockReturnValue({
        progress: {
          version: 3,
          completedLessons: [],
          completedQuizzes: ['quiz-1'],
          completedExercises: [],
          openedLessons: [],
          lastActivity: '',
          quizAttempts: [],
        },
        markLessonOpened: vi.fn(),
        completeLesson: vi.fn(),
        completeQuiz: vi.fn(),
        completeExercise: vi.fn(),
        recordQuizAttempt: vi.fn(),
        isLessonCompleted: vi.fn(),
        isLessonOpened: vi.fn(),
        getCompletedLessonsCount: vi.fn(() => 0),
        getCompletedLessonIds: vi.fn(() => []),
        getTotalLessonsOpened: vi.fn(() => 0),
        resetProgress: vi.fn(),
        setProgress: vi.fn(),
      });

      renderWithProviders(<QuizListPage />);

      const retryLink = screen.getByText('もう一度挑戦');
      expect(retryLink).toHaveAttribute('href', '/quiz/quiz-1');
    });
  });

  describe('quiz list rendering', () => {
    it('should render quiz grid container', () => {
      renderWithProviders(<QuizListPage />);

      // Check that the page structure is rendered
      expect(screen.getByText('クイズ一覧')).toBeInTheDocument();
      // All quizzes should be rendered
      expect(screen.getByText('React基礎クイズ')).toBeInTheDocument();
      expect(screen.getByText('React Hooksクイズ')).toBeInTheDocument();
      expect(screen.getByText('コンポーネント設計クイズ')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<QuizListPage />);

      const title = screen.getByRole('heading', { level: 1, name: 'クイズ一覧' });
      expect(title).toBeInTheDocument();
    });

    it('should have proper heading for quiz titles', () => {
      renderWithProviders(<QuizListPage />);

      const quizHeading = screen.getByRole('heading', { name: 'React基礎クイズ' });
      expect(quizHeading).toBeInTheDocument();
    });

    it('should have accessible links', () => {
      renderWithProviders(<QuizListPage />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
        expect(link.textContent).toBeTruthy();
      });
    });
  });

  describe('quiz card structure', () => {
    it('should render cards with proper structure', () => {
      renderWithProviders(<QuizListPage />);

      // Check for card components (they should be rendered as divs or articles)
      expect(screen.getByText('React基礎クイズ').closest('[class*="card"]')).toBeInTheDocument();
    });

    it('should display badges with correct variants', () => {
      renderWithProviders(<QuizListPage />);

      // Question count badges should be present
      const questionBadges = screen.getAllByText(/\d+ 問/);
      expect(questionBadges.length).toBeGreaterThan(0);
    });

    it('should render related lessons in badge format', () => {
      renderWithProviders(<QuizListPage />);

      const relatedBadges = screen.getAllByText(/react-basics|jsx-basics|useState-hook/);
      expect(relatedBadges.length).toBeGreaterThan(0);
    });
  });

  describe('progress integration', () => {
    it('should correctly check quiz completion from progress', () => {
      const completedQuizzes = ['quiz-1', 'quiz-3'];
      mockUseProgress.mockReturnValue({
        progress: {
          version: 3,
          completedLessons: [],
          completedQuizzes,
          completedExercises: [],
          openedLessons: [],
          lastActivity: '',
          quizAttempts: [],
        },
        markLessonOpened: vi.fn(),
        completeLesson: vi.fn(),
        completeQuiz: vi.fn(),
        completeExercise: vi.fn(),
        recordQuizAttempt: vi.fn(),
        isLessonCompleted: vi.fn(),
        isLessonOpened: vi.fn(),
        getCompletedLessonsCount: vi.fn(() => 0),
        getCompletedLessonIds: vi.fn(() => []),
        getTotalLessonsOpened: vi.fn(() => 0),
        resetProgress: vi.fn(),
        setProgress: vi.fn(),
      });

      renderWithProviders(<QuizListPage />);

      // Should have 2 completed badges
      expect(screen.getAllByText('完了')).toHaveLength(2);
      // Should have 2 retry buttons
      expect(screen.getAllByText('もう一度挑戦')).toHaveLength(2);
      // Should have 1 start button
      expect(screen.getAllByText('クイズを始める')).toHaveLength(1);
    });

    it('should handle all quizzes completed', () => {
      mockUseProgress.mockReturnValue({
        progress: {
          version: 3,
          completedLessons: [],
          completedQuizzes: ['quiz-1', 'quiz-2', 'quiz-3'],
          completedExercises: [],
          openedLessons: [],
          lastActivity: '',
          quizAttempts: [],
        },
        markLessonOpened: vi.fn(),
        completeLesson: vi.fn(),
        completeQuiz: vi.fn(),
        completeExercise: vi.fn(),
        recordQuizAttempt: vi.fn(),
        isLessonCompleted: vi.fn(),
        isLessonOpened: vi.fn(),
        getCompletedLessonsCount: vi.fn(() => 0),
        getCompletedLessonIds: vi.fn(() => []),
        getTotalLessonsOpened: vi.fn(() => 0),
        resetProgress: vi.fn(),
        setProgress: vi.fn(),
      });

      renderWithProviders(<QuizListPage />);

      // All quizzes should show completion badge
      expect(screen.getAllByText('完了')).toHaveLength(3);
      // All buttons should be retry buttons
      expect(screen.getAllByText('もう一度挑戦')).toHaveLength(3);
      // No start buttons
      expect(screen.queryByText('クイズを始める')).not.toBeInTheDocument();
    });
  });

  describe('quiz metadata display', () => {
    it('should display multiple related lessons correctly', () => {
      renderWithProviders(<QuizListPage />);

      // First quiz has 2 related lessons
      expect(screen.getByText('react-basics')).toBeInTheDocument();
      expect(screen.getByText('jsx-basics')).toBeInTheDocument();

      // Second quiz has 2 related lessons
      expect(screen.getByText('useState-hook')).toBeInTheDocument();
      expect(screen.getByText('useEffect-hook')).toBeInTheDocument();
    });

    it('should display single related lesson correctly', () => {
      renderWithProviders(<QuizListPage />);

      // Third quiz has 1 related lesson
      expect(screen.getByText('component-design')).toBeInTheDocument();
    });

    it('should display correct question count for different quizzes', () => {
      renderWithProviders(<QuizListPage />);

      // Each quiz has different question counts
      const questionCounts = screen.getAllByText(/\d+ 問/);
      const counts = questionCounts.map((el) => el.textContent);

      expect(counts).toContain('3 問'); // quiz-1
      expect(counts).toContain('2 問'); // quiz-2
      expect(counts).toContain('1 問'); // quiz-3
    });
  });
});
