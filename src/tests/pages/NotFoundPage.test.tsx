import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFoundPage } from '@/pages/NotFoundPage';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('NotFoundPage', () => {
  describe('rendering', () => {
    it('should render 404 code', () => {
      renderWithRouter(<NotFoundPage />);

      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('should render not found message', () => {
      renderWithRouter(<NotFoundPage />);

      expect(screen.getByText('ページが見つかりません')).toBeInTheDocument();
    });

    it('should render description message', () => {
      renderWithRouter(<NotFoundPage />);

      expect(
        screen.getByText('お探しのページは存在しないか、移動した可能性があります。')
      ).toBeInTheDocument();
    });

    it('should render link to home page', () => {
      renderWithRouter(<NotFoundPage />);

      const homeLink = screen.getByRole('link', { name: 'ホームに戻る' });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<NotFoundPage />);

      const codeHeading = screen.getByRole('heading', { level: 1, name: '404' });
      expect(codeHeading).toBeInTheDocument();

      const titleHeading = screen.getByRole('heading', {
        level: 2,
        name: 'ページが見つかりません',
      });
      expect(titleHeading).toBeInTheDocument();
    });

    it('should have accessible link', () => {
      renderWithRouter(<NotFoundPage />);

      const homeLink = screen.getByRole('link', { name: 'ホームに戻る' });
      expect(homeLink).toBeInTheDocument();
    });
  });
});
