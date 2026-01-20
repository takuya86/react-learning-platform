import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonFilter } from '@/features/lessons/LessonFilter';
import type { Difficulty } from '@/domain/types';

describe('LessonFilter', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedTag: '',
    onTagChange: vi.fn(),
    selectedDifficulty: '' as Difficulty | '',
    onDifficultyChange: vi.fn(),
    availableTags: ['react', 'hooks', 'state', 'testing'],
  };

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<LessonFilter {...defaultProps} />);

      const searchInput = screen.getByLabelText('レッスンをタイトルやタグで検索');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'タイトルやタグで検索...');
    });

    it('should render tag filter select', () => {
      render(<LessonFilter {...defaultProps} />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      expect(tagSelect).toBeInTheDocument();
    });

    it('should render difficulty filter select', () => {
      render(<LessonFilter {...defaultProps} />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      expect(difficultySelect).toBeInTheDocument();
    });

    it('should render all available tags as options', () => {
      render(<LessonFilter {...defaultProps} />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      expect(tagSelect).toBeInTheDocument();

      // Check for "すべてのタグ" option
      expect(screen.getByRole('option', { name: 'すべてのタグ' })).toBeInTheDocument();

      // Check for individual tag options
      expect(screen.getByRole('option', { name: 'react' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'hooks' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'state' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'testing' })).toBeInTheDocument();
    });

    it('should render all difficulty options', () => {
      render(<LessonFilter {...defaultProps} />);

      expect(screen.getByRole('option', { name: 'すべての難易度' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '初級' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '中級' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '上級' })).toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('should call onSearchChange when typing in search input', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();

      render(<LessonFilter {...defaultProps} onSearchChange={onSearchChange} />);

      const searchInput = screen.getByLabelText('レッスンをタイトルやタグで検索');
      await user.type(searchInput, 'r');
      await user.type(searchInput, 'e');

      expect(onSearchChange).toHaveBeenCalled();
      expect(onSearchChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('should display current search query value', () => {
      render(<LessonFilter {...defaultProps} searchQuery="test query" />);

      const searchInput = screen.getByLabelText('レッスンをタイトルやタグで検索');
      expect(searchInput).toHaveValue('test query');
    });

    it('should handle clearing search input', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();

      render(<LessonFilter {...defaultProps} searchQuery="test" onSearchChange={onSearchChange} />);

      const searchInput = screen.getByLabelText('レッスンをタイトルやタグで検索');
      await user.clear(searchInput);

      expect(onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Tag Filter', () => {
    it('should call onTagChange when selecting a tag', async () => {
      const user = userEvent.setup();
      const onTagChange = vi.fn();

      render(<LessonFilter {...defaultProps} onTagChange={onTagChange} />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      await user.selectOptions(tagSelect, 'react');

      expect(onTagChange).toHaveBeenCalledWith('react');
    });

    it('should display selected tag value', () => {
      render(<LessonFilter {...defaultProps} selectedTag="hooks" />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      expect(tagSelect).toHaveValue('hooks');
    });

    it('should handle selecting "すべてのタグ" option', async () => {
      const user = userEvent.setup();
      const onTagChange = vi.fn();

      render(<LessonFilter {...defaultProps} selectedTag="react" onTagChange={onTagChange} />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      await user.selectOptions(tagSelect, '');

      expect(onTagChange).toHaveBeenCalledWith('');
    });

    it('should render with empty tags array', () => {
      render(<LessonFilter {...defaultProps} availableTags={[]} />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      expect(tagSelect).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'すべてのタグ' })).toBeInTheDocument();
    });

    it('should render with single tag', () => {
      render(<LessonFilter {...defaultProps} availableTags={['react']} />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      expect(tagSelect).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'すべてのタグ' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'react' })).toBeInTheDocument();
    });
  });

  describe('Difficulty Filter', () => {
    it('should call onDifficultyChange when selecting a difficulty', async () => {
      const user = userEvent.setup();
      const onDifficultyChange = vi.fn();

      render(<LessonFilter {...defaultProps} onDifficultyChange={onDifficultyChange} />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      await user.selectOptions(difficultySelect, 'beginner');

      expect(onDifficultyChange).toHaveBeenCalledWith('beginner');
    });

    it('should display selected difficulty value - beginner', () => {
      render(<LessonFilter {...defaultProps} selectedDifficulty="beginner" />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      expect(difficultySelect).toHaveValue('beginner');
    });

    it('should display selected difficulty value - intermediate', () => {
      render(<LessonFilter {...defaultProps} selectedDifficulty="intermediate" />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      expect(difficultySelect).toHaveValue('intermediate');
    });

    it('should display selected difficulty value - advanced', () => {
      render(<LessonFilter {...defaultProps} selectedDifficulty="advanced" />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      expect(difficultySelect).toHaveValue('advanced');
    });

    it('should handle selecting "すべての難易度" option', async () => {
      const user = userEvent.setup();
      const onDifficultyChange = vi.fn();

      render(
        <LessonFilter
          {...defaultProps}
          selectedDifficulty="beginner"
          onDifficultyChange={onDifficultyChange}
        />
      );

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      await user.selectOptions(difficultySelect, '');

      expect(onDifficultyChange).toHaveBeenCalledWith('');
    });
  });

  describe('Combined Filters', () => {
    it('should handle all filters being set simultaneously', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();
      const onTagChange = vi.fn();
      const onDifficultyChange = vi.fn();

      render(
        <LessonFilter
          {...defaultProps}
          onSearchChange={onSearchChange}
          onTagChange={onTagChange}
          onDifficultyChange={onDifficultyChange}
        />
      );

      const searchInput = screen.getByLabelText('レッスンをタイトルやタグで検索');
      const tagSelect = screen.getByLabelText('タグでフィルター');
      const difficultySelect = screen.getByLabelText('難易度でフィルター');

      await user.type(searchInput, 'test');
      await user.selectOptions(tagSelect, 'react');
      await user.selectOptions(difficultySelect, 'beginner');

      expect(onSearchChange).toHaveBeenCalled();
      expect(onTagChange).toHaveBeenCalledWith('react');
      expect(onDifficultyChange).toHaveBeenCalledWith('beginner');
    });

    it('should display all current filter values', () => {
      render(
        <LessonFilter
          {...defaultProps}
          searchQuery="react hooks"
          selectedTag="hooks"
          selectedDifficulty="intermediate"
        />
      );

      expect(screen.getByLabelText('レッスンをタイトルやタグで検索')).toHaveValue('react hooks');
      expect(screen.getByLabelText('タグでフィルター')).toHaveValue('hooks');
      expect(screen.getByLabelText('難易度でフィルター')).toHaveValue('intermediate');
    });
  });

  describe('Accessibility', () => {
    it('should have search role on container', () => {
      render(<LessonFilter {...defaultProps} />);

      const container = screen.getByRole('search');
      expect(container).toBeInTheDocument();
    });

    it('should have group role for filters section', () => {
      render(<LessonFilter {...defaultProps} />);

      const filtersGroup = screen.getByRole('group', { name: 'フィルター条件' });
      expect(filtersGroup).toBeInTheDocument();
    });

    it('should have accessible labels for all inputs', () => {
      render(<LessonFilter {...defaultProps} />);

      expect(screen.getByLabelText('レッスン検索')).toBeInTheDocument();
      expect(screen.getByLabelText('レッスンをタイトルやタグで検索')).toBeInTheDocument();
      expect(screen.getByLabelText('タグフィルター')).toBeInTheDocument();
      expect(screen.getByLabelText('タグでフィルター')).toBeInTheDocument();
      expect(screen.getByLabelText('難易度フィルター')).toBeInTheDocument();
      expect(screen.getByLabelText('難易度でフィルター')).toBeInTheDocument();
    });

    it('should have proper id attributes for form controls', () => {
      render(<LessonFilter {...defaultProps} />);

      expect(screen.getByLabelText('レッスンをタイトルやタグで検索')).toHaveAttribute(
        'id',
        'lesson-search'
      );
      expect(screen.getByLabelText('タグでフィルター')).toHaveAttribute('id', 'tag-filter');
      expect(screen.getByLabelText('難易度でフィルター')).toHaveAttribute(
        'id',
        'difficulty-filter'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long tag names', () => {
      const longTags = [
        'very-long-tag-name-that-might-cause-layout-issues',
        'another-extremely-long-tag-name',
      ];

      render(<LessonFilter {...defaultProps} availableTags={longTags} />);

      expect(
        screen.getByRole('option', { name: 'very-long-tag-name-that-might-cause-layout-issues' })
      ).toBeInTheDocument();
    });

    it('should handle special characters in tag names', () => {
      const specialTags = ['React/Redux', 'C++', 'Node.js', '@angular'];

      render(<LessonFilter {...defaultProps} availableTags={specialTags} />);

      expect(screen.getByRole('option', { name: 'React/Redux' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'C++' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Node.js' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '@angular' })).toBeInTheDocument();
    });

    it('should handle many tags', () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i + 1}`);

      render(<LessonFilter {...defaultProps} availableTags={manyTags} />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      expect(tagSelect).toBeInTheDocument();

      // Get all options from both tag and difficulty selects
      const allOptions = screen.getAllByRole('option');

      // Tag select has: 50 tags + "すべてのタグ" = 51 options
      // Difficulty select has: 4 options (すべての難易度, 初級, 中級, 上級)
      // Total: 55 options
      expect(allOptions.length).toBeGreaterThanOrEqual(51);
    });

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup();
      const onTagChange = vi.fn();
      const onDifficultyChange = vi.fn();

      render(
        <LessonFilter
          {...defaultProps}
          onTagChange={onTagChange}
          onDifficultyChange={onDifficultyChange}
        />
      );

      const tagSelect = screen.getByLabelText('タグでフィルター');
      const difficultySelect = screen.getByLabelText('難易度でフィルター');

      // Rapidly change filters
      await user.selectOptions(tagSelect, 'react');
      await user.selectOptions(difficultySelect, 'beginner');
      await user.selectOptions(tagSelect, 'hooks');
      await user.selectOptions(difficultySelect, 'advanced');

      expect(onTagChange).toHaveBeenCalledTimes(2);
      expect(onDifficultyChange).toHaveBeenCalledTimes(2);
    });
  });
});
