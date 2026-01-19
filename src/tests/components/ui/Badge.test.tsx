import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render badge with children text', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render badge with default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge.className).toMatch(/default/);
    });

    it('should render as span element', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply primary variant class', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge.className).toMatch(/primary/);
    });

    it('should apply success variant class', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge.className).toMatch(/success/);
    });

    it('should apply warning variant class', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge.className).toMatch(/warning/);
    });

    it('should apply danger variant class', () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText('Danger');
      expect(badge.className).toMatch(/danger/);
    });

    it('should apply default variant when not specified', () => {
      render(<Badge>No Variant</Badge>);
      const badge = screen.getByText('No Variant');
      expect(badge.className).toMatch(/default/);
    });
  });

  describe('Sizes', () => {
    it('should apply default size by default', () => {
      render(<Badge>Default Size</Badge>);
      const badge = screen.getByText('Default Size');
      expect(badge.className).not.toMatch(/small/);
    });

    it('should apply small size class', () => {
      render(<Badge size="small">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge.className).toMatch(/small/);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge.className).toContain('custom-class');
    });

    it('should spread additional HTML props', () => {
      render(
        <Badge data-testid="test-badge" title="Test Title">
          Props Test
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('title', 'Test Title');
    });

    it('should support onClick handler', () => {
      const handleClick = vi.fn();
      render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = screen.getByText('Clickable');
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should support aria attributes', () => {
      render(<Badge aria-label="Status Badge">Active</Badge>);
      const badge = screen.getByText('Active');
      expect(badge).toHaveAttribute('aria-label', 'Status Badge');
    });

    it('should support role attribute', () => {
      render(<Badge role="status">Status</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should apply variant, size, and custom class together', () => {
      render(
        <Badge variant="success" size="small" className="custom">
          Combined
        </Badge>
      );
      const badge = screen.getByText('Combined');
      expect(badge.className).toMatch(/success/);
      expect(badge.className).toMatch(/small/);
      expect(badge.className).toContain('custom');
    });
  });
});
