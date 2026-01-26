import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ExercisePage } from '@/pages/ExercisePage';
import type { LoadedLesson } from '@/lib/lessons/types';
import type { Exercise } from '@/domain/types';

// Mock window.alert globally
vi.stubGlobal('alert', vi.fn());

// Use vi.hoisted to properly hoist mock definitions before vi.mock
const { mockUseProgress, mockNavigate, mockUseParams } = vi.hoisted(() => {
  const mockCompleteExercise = vi.fn();

  const mockUseProgress = {
    completeExercise: mockCompleteExercise,
    progress: {
      completedExercises: [] as string[],
      completedLessons: [],
      completedQuizzes: [],
      openedLessons: [],
      quizAttempts: [],
      lastStudyDate: null,
      studyDates: [],
      streak: 0,
    },
  };

  const mockNavigate = vi.fn();
  const mockUseParams = vi.fn(() => ({ id: undefined }));

  return { mockUseProgress, mockNavigate, mockUseParams };
});

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
  };
});

// Mock progress hooks
vi.mock('@/features/progress', () => ({
  useProgress: () => mockUseProgress,
}));

// Mock lesson data
let mockLesson: LoadedLesson | undefined;
vi.mock('@/lib/lessons', () => ({
  getLessonById: () => mockLesson,
}));

// Mock exercise data
let mockExercise: Exercise | undefined;
vi.mock('@/data', () => ({
  getExerciseById: () => mockExercise,
}));

const renderExercisePage = () => {
  return render(
    <BrowserRouter>
      <ExercisePage />
    </BrowserRouter>
  );
};

describe('ExercisePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProgress.progress.completedExercises = [];

    // Default mock lesson
    mockLesson = {
      id: 'jsx-basics',
      title: 'JSXの基本',
      description: 'JSXの基本を学ぶ',
      tags: ['React'],
      difficulty: 'beginner',
      estimatedMinutes: 30,
      exerciseId: 'jsx-basics',
      prerequisites: [],
      relatedQuizzes: [],
      Component: vi.fn(),
    };

    // Default mock exercise
    mockExercise = {
      id: 'jsx-basics',
      title: 'JSXの基本練習',
      description: 'JSXの基本構文を練習します。',
      instructions: '## 課題\n\n自己紹介コンポーネントのpropsを設計してください。',
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
      ],
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - basic structure', () => {
    it('should render exercise page with title and description', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      expect(screen.getByRole('heading', { name: 'JSXの基本練習' })).toBeInTheDocument();
      expect(screen.getByText('JSXの基本構文を練習します。')).toBeInTheDocument();
    });

    it('should render breadcrumb navigation', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      expect(screen.getByRole('link', { name: 'レッスン一覧' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'JSXの基本' })).toBeInTheDocument();
      expect(screen.getByText('演習')).toBeInTheDocument();
    });

    it('should render exercise instructions with markdown', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      expect(screen.getByText('演習の説明')).toBeInTheDocument();
      expect(screen.getByText('課題')).toBeInTheDocument();
      expect(
        screen.getByText('自己紹介コンポーネントのpropsを設計してください。')
      ).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      expect(screen.getByLabelText('名前')).toBeInTheDocument();
      expect(screen.getByLabelText('年齢')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      expect(screen.getByRole('button', { name: '提出する' })).toBeInTheDocument();
    });

    it('should render back link to lesson', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      const backLink = screen.getByRole('link', { name: 'レッスンに戻る' });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/lessons/jsx-basics');
    });
  });

  describe('not found state', () => {
    it('should show not found message when lesson does not exist', () => {
      mockUseParams.mockReturnValue({ id: 'nonexistent' });
      mockLesson = undefined;
      renderExercisePage();

      expect(screen.getByRole('heading', { name: '演習が見つかりません' })).toBeInTheDocument();
      expect(
        screen.getByText(/指定された演習は存在しないか、このレッスンには演習がありません/)
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'レッスン一覧に戻る' })).toBeInTheDocument();
    });

    it('should show not found message when exercise does not exist', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockExercise = undefined;
      renderExercisePage();

      expect(screen.getByRole('heading', { name: '演習が見つかりません' })).toBeInTheDocument();
    });

    it('should show not found message when lesson has no exerciseId', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockLesson = { ...mockLesson!, exerciseId: undefined };
      renderExercisePage();

      expect(screen.getByRole('heading', { name: '演習が見つかりません' })).toBeInTheDocument();
    });

    it('should show not found when no id param provided', () => {
      mockUseParams.mockReturnValue({ id: undefined });
      renderExercisePage();

      expect(screen.getByRole('heading', { name: '演習が見つかりません' })).toBeInTheDocument();
    });
  });

  describe('completed state', () => {
    it('should show completed badge when exercise is completed', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockUseProgress.progress.completedExercises = ['jsx-basics'];
      renderExercisePage();

      expect(screen.getByText('完了済み')).toBeInTheDocument();
    });

    it('should not show completed badge when exercise is not completed', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockUseProgress.progress.completedExercises = [];
      renderExercisePage();

      expect(screen.queryByText('完了済み')).not.toBeInTheDocument();
    });

    it('should show "再提出する" button when exercise is completed', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockUseProgress.progress.completedExercises = ['jsx-basics'];
      renderExercisePage();

      expect(screen.getByRole('button', { name: '再提出する' })).toBeInTheDocument();
    });

    it('should show "提出する" button when exercise is not completed', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockUseProgress.progress.completedExercises = [];
      renderExercisePage();

      expect(screen.getByRole('button', { name: '提出する' })).toBeInTheDocument();
    });
  });

  describe('form field types', () => {
    it('should render text input fields', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      const nameInput = screen.getByLabelText('名前');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('placeholder', '例: 山田太郎');
    });

    it('should render textarea fields', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockExercise!.fields = [
        {
          name: 'bio',
          label: '自己紹介',
          type: 'textarea',
          placeholder: '自己紹介を書いてください',
          required: false,
        },
      ];
      renderExercisePage();

      const textarea = screen.getByPlaceholderText('自己紹介を書いてください');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('placeholder', '自己紹介を書いてください');
    });

    it('should render checkbox fields', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockExercise!.fields = [
        {
          name: 'agree',
          label: '利用規約に同意する',
          type: 'checkbox',
          required: true,
        },
      ];
      renderExercisePage();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText('利用規約に同意する')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call completeExercise when form is submitted', async () => {
      const user = userEvent.setup();
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      const nameInput = screen.getByLabelText('名前');
      const ageInput = screen.getByLabelText('年齢');
      const submitButton = screen.getByRole('button', { name: '提出する' });

      await user.type(nameInput, '山田太郎');
      await user.type(ageInput, '25');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUseProgress.completeExercise).toHaveBeenCalledWith('jsx-basics');
      });
    });

    it('should show alert message on successful submission', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      const nameInput = screen.getByLabelText('名前');
      const ageInput = screen.getByLabelText('年齢');
      const submitButton = screen.getByRole('button', { name: '提出する' });

      await user.type(nameInput, '山田太郎');
      await user.type(ageInput, '25');
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('演習を完了しました！');
      });

      alertSpy.mockRestore();
    });
  });

  describe('form validation', () => {
    it('should render required text fields with name attribute', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      renderExercisePage();

      const nameInput = screen.getByLabelText('名前');
      expect(nameInput).toHaveAttribute('name', 'name');
      expect(nameInput).toBeInTheDocument();
    });

    it('should render optional text fields', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockExercise!.fields = [
        {
          name: 'hobby',
          label: '趣味',
          type: 'text',
          placeholder: '例: 読書',
          required: false,
        },
      ];
      renderExercisePage();

      const hobbyInput = screen.getByLabelText('趣味');
      expect(hobbyInput).toHaveAttribute('name', 'hobby');
      expect(hobbyInput).toBeInTheDocument();
    });

    it('should render required checkbox fields', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockExercise!.fields = [
        {
          name: 'agree',
          label: '利用規約に同意する',
          type: 'checkbox',
          required: true,
        },
      ];
      renderExercisePage();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('name', 'agree');
      expect(checkbox).toBeInTheDocument();
    });

    it('should render required textarea fields', () => {
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockExercise!.fields = [
        {
          name: 'bio',
          label: '自己紹介',
          type: 'textarea',
          placeholder: '自己紹介を書いてください',
          required: true,
        },
      ];
      renderExercisePage();

      const textarea = screen.getByPlaceholderText('自己紹介を書いてください');
      expect(textarea).toHaveAttribute('name', 'bio');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('multiple field types in one form', () => {
    it('should render and submit form with mixed field types', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockUseParams.mockReturnValue({ id: 'jsx-basics' });
      mockExercise!.fields = [
        {
          name: 'email',
          label: 'メールアドレス',
          type: 'text',
          placeholder: 'example@example.com',
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
          name: 'agree',
          label: '利用規約に同意する',
          type: 'checkbox',
          required: true,
        },
      ];
      renderExercisePage();

      const emailInput = screen.getByLabelText('メールアドレス');
      const bioTextarea = screen.getByPlaceholderText('自己紹介を書いてください');
      const agreeCheckbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: '提出する' });

      await user.type(emailInput, 'test@example.com');
      await user.type(bioTextarea, 'こんにちは');
      await user.click(agreeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUseProgress.completeExercise).toHaveBeenCalledWith('jsx-basics');
        expect(alertSpy).toHaveBeenCalledWith('演習を完了しました！');
      });

      alertSpy.mockRestore();
    });
  });
});
