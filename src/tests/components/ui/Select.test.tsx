import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/components/ui/Select';
import { createRef } from 'react';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  describe('Rendering', () => {
    it('should render select element', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with label when provided', () => {
      render(<Select label="Choose Option" name="choice" options={mockOptions} />);
      expect(screen.getByLabelText('Choose Option')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      render(<Select options={mockOptions} />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should render all provided options', () => {
      render(<Select options={mockOptions} />);
      mockOptions.forEach((option) => {
        expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument();
      });
    });

    it('should render wrapper div', () => {
      const { container } = render(<Select options={mockOptions} />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Label Association', () => {
    it('should associate label with select using name as id', () => {
      render(<Select label="Category" name="category" options={mockOptions} />);
      const select = screen.getByLabelText('Category');
      expect(select).toHaveAttribute('id', 'category');
    });

    it('should use explicit id over name for label association', () => {
      render(<Select label="Status" name="stat" id="status-select" options={mockOptions} />);
      const select = screen.getByLabelText('Status');
      expect(select).toHaveAttribute('id', 'status-select');
    });

    it('should create htmlFor attribute on label', () => {
      const { container } = render(<Select label="Test" name="test" options={mockOptions} />);
      const label = container.querySelector('label');
      expect(label).toHaveAttribute('for', 'test');
    });
  });

  describe('Options', () => {
    it('should render correct number of options', () => {
      render(<Select options={mockOptions} />);
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(mockOptions.length);
    });

    it('should set correct value attribute for each option', () => {
      render(<Select options={mockOptions} />);
      mockOptions.forEach((option) => {
        const optionElement = screen.getByRole('option', {
          name: option.label,
        }) as HTMLOptionElement;
        expect(optionElement.value).toBe(option.value);
      });
    });

    it('should display correct label text for each option', () => {
      render(<Select options={mockOptions} />);
      mockOptions.forEach((option) => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });
  });

  describe('Placeholder', () => {
    it('should render placeholder option when provided', () => {
      render(<Select options={mockOptions} placeholder="Select an option" />);
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should make placeholder option disabled', () => {
      render(<Select options={mockOptions} placeholder="Select an option" />);
      const placeholderOption = screen.getByText('Select an option') as HTMLOptionElement;
      expect(placeholderOption.disabled).toBe(true);
    });

    it('should set empty value for placeholder option', () => {
      render(<Select options={mockOptions} placeholder="Select an option" />);
      const placeholderOption = screen.getByText('Select an option') as HTMLOptionElement;
      expect(placeholderOption.value).toBe('');
    });

    it('should not render placeholder when not provided', () => {
      render(<Select options={mockOptions} />);
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(mockOptions.length);
    });

    it('should render placeholder as first option', () => {
      render(<Select options={mockOptions} placeholder="Choose..." />);
      const allOptions = screen.getAllByRole('option');
      expect(allOptions[0]).toHaveTextContent('Choose...');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      render(<Select name="test" options={mockOptions} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not display error message when error is not provided', () => {
      render(<Select name="test" options={mockOptions} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should apply error class when error exists', () => {
      render(<Select name="test" options={mockOptions} error="Error message" />);
      const select = screen.getByRole('combobox');
      expect(select.className).toMatch(/selectError/);
    });

    it('should not apply error class when no error', () => {
      render(<Select name="test" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select.className).not.toMatch(/selectError/);
    });
  });

  describe('Accessibility', () => {
    it('should set aria-invalid to true when error exists', () => {
      render(<Select name="test" options={mockOptions} error="Error message" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('should set aria-invalid to false when no error', () => {
      render(<Select name="test" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'false');
    });

    it('should associate error message with select using aria-describedby', () => {
      render(<Select name="test" options={mockOptions} error="Error message" />);
      const select = screen.getByRole('combobox');
      const errorId = select.getAttribute('aria-describedby');
      expect(errorId).toBe('test-error');
      expect(screen.getByText('Error message')).toHaveAttribute('id', 'test-error');
    });

    it('should not set aria-describedby when no error', () => {
      render(<Select name="test" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('aria-describedby');
    });

    it('should render error message with role="alert"', () => {
      render(<Select name="test" options={mockOptions} error="Error message" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Error message');
    });

    it('should render error message with aria-live="polite"', () => {
      render(<Select name="test" options={mockOptions} error="Error message" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Select Props', () => {
    it('should accept and apply custom className', () => {
      render(<Select className="custom-select" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('custom-select');
    });

    it('should accept disabled attribute', () => {
      render(<Select disabled options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should accept required attribute', () => {
      render(<Select required options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });

    it('should accept value attribute', () => {
      render(<Select value="option2" onChange={() => {}} options={mockOptions} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });

    it('should accept defaultValue attribute', () => {
      render(<Select defaultValue="option1" options={mockOptions} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option1');
    });

    it('should accept multiple attribute', () => {
      render(<Select multiple options={mockOptions} />);
      const select = screen.getByRole('listbox');
      expect(select).toHaveAttribute('multiple');
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when user selects an option', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Select onChange={handleChange} options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'option2');

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should update selected value when user makes selection', async () => {
      const user = userEvent.setup();

      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      await user.selectOptions(select, 'option3');

      expect(select.value).toBe('option3');
    });

    it('should call onFocus when select receives focus', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();

      render(<Select onFocus={handleFocus} options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.click(select);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when select loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(<Select onBlur={handleBlur} options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.click(select);
      await user.tab();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to select element', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select ref={ref} options={mockOptions} />);

      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
      expect(ref.current?.tagName).toBe('SELECT');
    });

    it('should allow programmatic focus via ref', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select ref={ref} options={mockOptions} />);

      ref.current?.focus();

      expect(ref.current).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty options array', () => {
      render(<Select options={[]} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      const options = screen.queryAllByRole('option');
      expect(options).toHaveLength(0);
    });

    it('should render with single option', () => {
      const singleOption = [{ value: 'only', label: 'Only Option' }];
      render(<Select options={singleOption} />);
      expect(screen.getByRole('option', { name: 'Only Option' })).toBeInTheDocument();
    });

    it('should handle options with special characters', () => {
      const specialOptions = [
        { value: 'test&value', label: 'Test & Value' },
        { value: 'test<value', label: 'Test < Value' },
      ];
      render(<Select options={specialOptions} />);
      expect(screen.getByText('Test & Value')).toBeInTheDocument();
      expect(screen.getByText('Test < Value')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should render with label, placeholder, error, and custom props', () => {
      render(
        <Select
          label="Priority Level"
          name="priority"
          error="Please select a priority"
          placeholder="Select priority"
          options={mockOptions}
          className="custom"
          required
        />
      );

      const select = screen.getByLabelText('Priority Level');
      expect(select).toBeRequired();
      expect(select.className).toContain('custom');
      expect(select.className).toMatch(/selectError/);
      expect(screen.getByText('Please select a priority')).toBeInTheDocument();
      expect(screen.getByText('Select priority')).toBeInTheDocument();
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
