import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeakAreas } from '@/features/quiz/components/WeakAreas';
import type { WeakArea } from '@/features/quiz/utils/analysis';

describe('WeakAreas', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      const weakAreas: WeakArea[] = [];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('苦手分野')).toBeInTheDocument();
    });

    it('should render container', () => {
      const weakAreas: WeakArea[] = [];
      const { container } = render(<WeakAreas weakAreas={weakAreas} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no weak areas', () => {
      const weakAreas: WeakArea[] = [];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('苦手分野はありません。素晴らしいです！')).toBeInTheDocument();
    });

    it('should not display list when no weak areas', () => {
      const weakAreas: WeakArea[] = [];
      const { container } = render(<WeakAreas weakAreas={weakAreas} />);
      expect(container.querySelector('ul')).not.toBeInTheDocument();
    });

    it('should not display description when no weak areas', () => {
      const weakAreas: WeakArea[] = [];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.queryByText('以下の分野の復習をおすすめします')).not.toBeInTheDocument();
    });
  });

  describe('Weak Areas List', () => {
    it('should display weak area with stats', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'JavaScript',
          wrongRate: 0.6,
          wrongCount: 3,
          totalCount: 5,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('3 / 5 問不正解')).toBeInTheDocument();
      expect(screen.getByText('(不正解率: 60%)')).toBeInTheDocument();
    });

    it('should display multiple weak areas', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'JavaScript',
          wrongRate: 0.6,
          wrongCount: 3,
          totalCount: 5,
        },
        {
          tag: 'CSS',
          wrongRate: 0.5,
          wrongCount: 2,
          totalCount: 4,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('CSS')).toBeInTheDocument();
    });

    it('should display description when weak areas exist', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'React',
          wrongRate: 0.4,
          wrongCount: 2,
          totalCount: 5,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('以下の分野の復習をおすすめします')).toBeInTheDocument();
    });
  });

  describe('Wrong Rate Formatting', () => {
    it('should round wrong rate to nearest integer', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'TypeScript',
          wrongRate: 0.666,
          wrongCount: 2,
          totalCount: 3,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('(不正解率: 67%)')).toBeInTheDocument();
    });

    it('should display 0% for zero wrong rate', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'HTML',
          wrongRate: 0,
          wrongCount: 0,
          totalCount: 5,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('(不正解率: 0%)')).toBeInTheDocument();
    });

    it('should display 100% for perfect wrong rate', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'Node.js',
          wrongRate: 1.0,
          wrongCount: 5,
          totalCount: 5,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('(不正解率: 100%)')).toBeInTheDocument();
    });
  });

  describe('Multiple Weak Areas', () => {
    it('should render all weak areas in order', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'JavaScript',
          wrongRate: 0.6,
          wrongCount: 3,
          totalCount: 5,
        },
        {
          tag: 'CSS',
          wrongRate: 0.5,
          wrongCount: 2,
          totalCount: 4,
        },
        {
          tag: 'HTML',
          wrongRate: 0.4,
          wrongCount: 2,
          totalCount: 5,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      expect(listItems[0]).toHaveTextContent('JavaScript');
      expect(listItems[1]).toHaveTextContent('CSS');
      expect(listItems[2]).toHaveTextContent('HTML');
    });

    it('should display correct stats for each weak area', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'React',
          wrongRate: 0.5,
          wrongCount: 5,
          totalCount: 10,
        },
        {
          tag: 'Vue',
          wrongRate: 0.75,
          wrongCount: 3,
          totalCount: 4,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('5 / 10 問不正解')).toBeInTheDocument();
      expect(screen.getByText('3 / 4 問不正解')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single weak area', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'Testing',
          wrongRate: 0.3,
          wrongCount: 3,
          totalCount: 10,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('3 / 10 問不正解')).toBeInTheDocument();
    });

    it('should handle very high wrong count', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'Advanced Topics',
          wrongRate: 0.9,
          wrongCount: 90,
          totalCount: 100,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('90 / 100 問不正解')).toBeInTheDocument();
    });

    it('should handle small decimal wrong rates', () => {
      const weakAreas: WeakArea[] = [
        {
          tag: 'Basics',
          wrongRate: 0.045,
          wrongCount: 1,
          totalCount: 22,
        },
      ];
      render(<WeakAreas weakAreas={weakAreas} />);
      expect(screen.getByText('(不正解率: 5%)')).toBeInTheDocument();
    });
  });
});
