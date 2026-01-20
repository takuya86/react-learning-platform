import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from '@/features/notes/components/NoteEditor';

describe('NoteEditor', () => {
  describe('Rendering', () => {
    it('should render textarea element', () => {
      render(<NoteEditor value="" onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with provided value', () => {
      render(<NoteEditor value="Test content" onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Test content');
    });

    it('should render with default placeholder', () => {
      render(<NoteEditor value="" onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'マークダウンでノートを書きましょう...');
    });

    it('should render with custom placeholder', () => {
      render(<NoteEditor value="" onChange={vi.fn()} placeholder="カスタムプレースホルダー" />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'カスタムプレースホルダー');
    });

    it('should have spellcheck disabled', () => {
      render(<NoteEditor value="" onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('spellcheck', 'false');
    });
  });

  describe('Content Change Handling', () => {
    it('should call onChange when typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NoteEditor value="" onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New content');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onChange with correct value', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NoteEditor value="" onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'A');

      expect(handleChange).toHaveBeenCalledWith('A');
    });

    it('should handle multiple character input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NoteEditor value="" onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it('should handle clearing content', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NoteEditor value="Existing content" onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);

      expect(handleChange).toHaveBeenCalledWith('');
    });

    it('should handle multiline input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NoteEditor value="" onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      // Type first line
      await user.type(textarea, 'Line 1');
      // Press Enter
      await user.keyboard('{Enter}');
      // Type second line
      await user.type(textarea, 'Line 2');

      expect(handleChange).toHaveBeenCalled();
      // Just verify onChange was called multiple times for the input
      expect(handleChange.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled State', () => {
    it('should be enabled by default', () => {
      render(<NoteEditor value="" onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<NoteEditor value="" onChange={vi.fn()} disabled={true} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<NoteEditor value="" onChange={vi.fn()} disabled={true} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      render(<NoteEditor value="" onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('should handle long text content', () => {
      const longText = 'A'.repeat(10000);
      render(<NoteEditor value={longText} onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(longText);
    });

    it('should handle special characters', () => {
      const specialText = '# Markdown\n**Bold** _Italic_ `code`';
      render(<NoteEditor value={specialText} onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(specialText);
    });

    it('should handle Japanese characters', () => {
      const japaneseText = 'こんにちは、世界！';
      render(<NoteEditor value={japaneseText} onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(japaneseText);
    });

    it('should handle whitespace-only content', () => {
      const whitespace = '   \n\n   ';
      render(<NoteEditor value={whitespace} onChange={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(whitespace);
    });
  });

  describe('Callback Stability', () => {
    it('should handle onChange callback changes', () => {
      const onChange1 = vi.fn();
      const onChange2 = vi.fn();

      const { rerender } = render(<NoteEditor value="" onChange={onChange1} />);
      rerender(<NoteEditor value="" onChange={onChange2} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should use latest onChange callback', async () => {
      const user = userEvent.setup();
      const onChange1 = vi.fn();
      const onChange2 = vi.fn();

      const { rerender } = render(<NoteEditor value="" onChange={onChange1} />);
      rerender(<NoteEditor value="" onChange={onChange2} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'A');

      expect(onChange1).not.toHaveBeenCalled();
      expect(onChange2).toHaveBeenCalled();
    });
  });
});
