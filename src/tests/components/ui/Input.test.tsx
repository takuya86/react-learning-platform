import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';
import { createRef } from 'react';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
      render(<Input label="Username" name="username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      render(<Input name="test" />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should render wrapper div', () => {
      const { container } = render(<Input />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Label Association', () => {
    it('should associate label with input using name as id', () => {
      render(<Input label="Email" name="email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should use explicit id over name for label association', () => {
      render(<Input label="Password" name="pwd" id="password-input" />);
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('id', 'password-input');
    });

    it('should create htmlFor attribute on label', () => {
      const { container } = render(<Input label="Test" name="test" />);
      const label = container.querySelector('label');
      expect(label).toHaveAttribute('for', 'test');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      render(<Input name="test" error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not display error message when error is not provided', () => {
      render(<Input name="test" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should apply error class when error exists', () => {
      render(<Input name="test" error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toMatch(/inputError/);
    });

    it('should not apply error class when no error', () => {
      render(<Input name="test" />);
      const input = screen.getByRole('textbox');
      expect(input.className).not.toMatch(/inputError/);
    });
  });

  describe('Accessibility', () => {
    it('should set aria-invalid to true when error exists', () => {
      render(<Input name="test" error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should set aria-invalid to false when no error', () => {
      render(<Input name="test" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should associate error message with input using aria-describedby', () => {
      render(<Input name="test" error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBe('test-error');
      expect(screen.getByText('Error message')).toHaveAttribute('id', 'test-error');
    });

    it('should not set aria-describedby when no error', () => {
      render(<Input name="test" />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('should render error message with role="alert"', () => {
      render(<Input name="test" error="Error message" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Error message');
    });

    it('should render error message with aria-live="polite"', () => {
      render(<Input name="test" error="Error message" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Input Props', () => {
    it('should accept and apply custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-input');
    });

    it('should accept placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should accept type attribute', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should accept disabled attribute', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should accept required attribute', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should accept value attribute', () => {
      render(<Input value="test value" onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('should accept defaultValue attribute', () => {
      render(<Input defaultValue="default value" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('default value');
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it('should call onFocus when input receives focus', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when input loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('should allow programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();

      expect(ref.current).toHaveFocus();
    });
  });

  describe('Combined Props', () => {
    it('should render with label, error, and custom props', () => {
      render(
        <Input
          label="Email Address"
          name="email"
          error="Invalid email"
          placeholder="user@example.com"
          type="email"
          className="custom"
        />
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('placeholder', 'user@example.com');
      expect(input.className).toContain('custom');
      expect(input.className).toMatch(/inputError/);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
