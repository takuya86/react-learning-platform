import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      const { container } = render(<Card>Test</Card>);
      const card = container.firstChild;
      expect(card).toBeInstanceOf(HTMLDivElement);
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-card');
    });

    it('should spread additional HTML props', () => {
      render(
        <Card data-testid="test-card" role="article">
          Test
        </Card>
      );
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('role', 'article');
    });
  });

  describe('CardHeader', () => {
    it('should render header with children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      const { container } = render(<CardHeader>Test</CardHeader>);
      const header = container.firstChild;
      expect(header).toBeInstanceOf(HTMLDivElement);
    });

    it('should apply custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('custom-header');
    });

    it('should spread additional HTML props', () => {
      render(<CardHeader data-testid="card-header">Header</CardHeader>);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('should render title with children', () => {
      render(<CardTitle>Title Text</CardTitle>);
      expect(screen.getByText('Title Text')).toBeInTheDocument();
    });

    it('should render as h3 element', () => {
      render(<CardTitle>Test Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3, name: 'Test Title' });
      expect(title).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title.className).toContain('custom-title');
    });

    it('should spread additional HTML props', () => {
      render(<CardTitle id="card-title">Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveAttribute('id', 'card-title');
    });
  });

  describe('CardDescription', () => {
    it('should render description with children', () => {
      render(<CardDescription>Description Text</CardDescription>);
      expect(screen.getByText('Description Text')).toBeInTheDocument();
    });

    it('should render as p element', () => {
      const { container } = render(<CardDescription>Test</CardDescription>);
      const description = container.querySelector('p');
      expect(description).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CardDescription className="custom-desc">Description</CardDescription>
      );
      const description = container.querySelector('p');
      expect(description?.className).toContain('custom-desc');
    });

    it('should spread additional HTML props', () => {
      render(<CardDescription data-testid="card-desc">Description</CardDescription>);
      expect(screen.getByTestId('card-desc')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('should render content with children', () => {
      render(<CardContent>Main Content</CardContent>);
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      const { container } = render(<CardContent>Test</CardContent>);
      const content = container.firstChild;
      expect(content).toBeInstanceOf(HTMLDivElement);
    });

    it('should apply custom className', () => {
      const { container } = render(<CardContent className="custom-content">Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content.className).toContain('custom-content');
    });

    it('should spread additional HTML props', () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('should render footer with children', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      const { container } = render(<CardFooter>Test</CardFooter>);
      const footer = container.firstChild;
      expect(footer).toBeInstanceOf(HTMLDivElement);
    });

    it('should apply custom className', () => {
      const { container } = render(<CardFooter className="custom-footer">Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toContain('custom-footer');
    });

    it('should spread additional HTML props', () => {
      render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    });
  });

  describe('Full Card Composition', () => {
    it('should render complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card Title</CardTitle>
            <CardDescription>Test Card Description</CardDescription>
          </CardHeader>
          <CardContent>Test Card Content</CardContent>
          <CardFooter>Test Card Footer</CardFooter>
        </Card>
      );

      expect(
        screen.getByRole('heading', { level: 3, name: 'Test Card Title' })
      ).toBeInTheDocument();
      expect(screen.getByText('Test Card Description')).toBeInTheDocument();
      expect(screen.getByText('Test Card Content')).toBeInTheDocument();
      expect(screen.getByText('Test Card Footer')).toBeInTheDocument();
    });

    it('should render card with only title and content', () => {
      render(
        <Card>
          <CardTitle>Simple Title</CardTitle>
          <CardContent>Simple Content</CardContent>
        </Card>
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText('Simple Content')).toBeInTheDocument();
    });
  });
});
