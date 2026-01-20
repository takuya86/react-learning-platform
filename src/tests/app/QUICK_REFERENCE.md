# App Tests - Quick Reference Guide

## Run Tests

```bash
# Run all app tests
npm run test:run -- src/tests/app

# Run with coverage
npm run test:run -- --coverage src/tests/app

# Run specific file
npm run test:run -- src/tests/app/Layout.test.tsx

# Watch mode
npm run test -- src/tests/app
```

---

## Test Files at a Glance

| File                 | Tests | What it Tests                           |
| -------------------- | ----- | --------------------------------------- |
| `App.test.tsx`       | 3     | Root app, providers, router integration |
| `Layout.test.tsx`    | 34    | Navigation, auth UI, theming, routing   |
| `providers.test.tsx` | 10    | Provider composition, hierarchy         |
| `router.test.tsx`    | 23    | Route config, params, protection        |

**Total**: 70+ tests

---

## Common Test Patterns

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should handle click', async () => {
  const user = userEvent.setup();
  render(<Component />);

  await user.click(screen.getByText('Button'));

  expect(mockFunction).toHaveBeenCalled();
});
```

### Testing Authentication States

```typescript
// Mock auth state
mockUseAuth.mockReturnValue({
  user: { email: 'test@example.com' },
  role: 'admin',
  signOut: mockSignOut,
});

// Test guest state
mockUseAuth.mockReturnValue({
  user: null,
  role: 'user',
  signOut: mockSignOut,
});
```

### Testing Routes

```typescript
const renderWithRouter = (initialRoute = '/') => {
  window.history.pushState({}, 'Test page', initialRoute);
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  );
};

renderWithRouter('/admin');
```

### Testing Async Operations

```typescript
it('should handle async action', async () => {
  render(<Component />);

  await user.click(screen.getByText('Action'));

  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

---

## Mocking Cheat Sheet

### Mock Auth Hook

```typescript
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// In test
mockUseAuth.mockReturnValue({
  user: { email: 'test@example.com' },
  role: 'user',
  signOut: mockSignOut,
});
```

### Mock Component

```typescript
vi.mock('@/app/providers', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));
```

### Mock Module

```typescript
vi.mock('react-router-dom', () => ({
  RouterProvider: ({ router }: { router: unknown }) => (
    <div data-testid="router-provider">Router</div>
  ),
}));
```

---

## Common Queries

### By Role (Preferred)

```typescript
screen.getByRole('button');
screen.getByRole('navigation');
screen.getByRole('heading', { level: 1 });
screen.getByRole('link', { name: 'ログイン' });
```

### By Text

```typescript
screen.getByText('レッスン');
screen.getByText(/React学習/);
```

### By Test ID

```typescript
screen.getByTestId('metrics-card');
```

### By Label

```typescript
screen.getByLabelText('クイックアクセスメニュー');
```

---

## Assertions

### Existence

```typescript
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();
```

### Visibility

```typescript
expect(element).toBeVisible();
expect(element).not.toBeVisible();
```

### Attributes

```typescript
expect(link).toHaveAttribute('href', '/login');
expect(element).toHaveClass('active');
```

### Content

```typescript
expect(element).toHaveTextContent('Hello');
expect(container).toContainElement(child);
```

### Functions

```typescript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(arg);
```

---

## Coverage Commands

```bash
# Generate coverage report
npm run test:coverage -- src/tests/app

# View HTML report
open coverage/index.html

# Check specific file
npm run test:run -- --coverage src/app/Layout.tsx
```

---

## Debugging Tests

### View Test Output

```typescript
import { screen } from '@testing-library/react';

// Print rendered HTML
screen.debug();

// Print specific element
screen.debug(screen.getByRole('navigation'));
```

### Check Element Presence

```typescript
// Throws if not found (good for debugging)
screen.getByText('Text');

// Returns null if not found (good for assertions)
screen.queryByText('Text');

// Wait for element (async)
await screen.findByText('Text');
```

### Log Element Attributes

```typescript
const element = screen.getByRole('button');
console.log(element.className);
console.log(element.getAttribute('data-testid'));
```

---

## Before/After Hooks

### Setup and Cleanup

```typescript
import { beforeEach, afterEach } from 'vitest';

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test', () => {
    // Test code
  });
});
```

---

## Test Structure Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component } from '@/path/to/Component';

// Mocks
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockFunction = vi.fn();

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render component', () => {
      // Arrange
      render(<Component />);

      // Act (if needed)

      // Assert
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('user interaction', () => {
    it('should handle click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<Component />);

      // Act
      await user.click(screen.getByText('Button'));

      // Assert
      await waitFor(() => {
        expect(mockFunction).toHaveBeenCalled();
      });
    });
  });
});
```

---

## Troubleshooting

### Test Fails: "Element not found"

1. Check if element is rendered: `screen.debug()`
2. Check query type: `getBy` vs `queryBy` vs `findBy`
3. Check if element is in DOM but not visible
4. Wait for async rendering: `await screen.findByText('Text')`

### Test Fails: "Function not called"

1. Check if mock is set up correctly
2. Clear mocks in `beforeEach`
3. Await async operations: `await user.click()`
4. Check if correct mock function is being tested

### Test Fails: "Unable to find role"

1. Check if element has correct role
2. Use `screen.getByRole()` with options: `{ name: 'Label' }`
3. Check accessibility tree: Use browser dev tools
4. Try alternative query: `getByLabelText`, `getByTestId`

### Coverage Not Increasing

1. Check if file is mocked (mocked files don't count)
2. Verify test actually renders the component
3. Check if component has conditional branches not covered
4. Run with `--coverage` flag to see detailed report

---

## Tips

### Do's ✅

- Use `userEvent` over `fireEvent`
- Query by role/label (accessibility)
- Clean up mocks in `beforeEach`
- Test user behavior, not implementation
- Use `waitFor` for async operations
- Write descriptive test names

### Don'ts ❌

- Don't use `act()` unless necessary
- Don't test implementation details
- Don't query by class names or IDs (prefer roles)
- Don't forget to clear mocks
- Don't skip async `await`
- Don't test library code

---

## File Structure

```
src/tests/app/
├── App.test.tsx              # Root app tests
├── Layout.test.tsx           # Layout & navigation tests
├── providers.test.tsx        # Provider composition tests
├── router.test.tsx           # Router configuration tests
├── README.md                 # Detailed documentation
├── TEST_SUMMARY.md          # Comprehensive summary
└── QUICK_REFERENCE.md       # This file
```

---

## Resources

- [Testing Library Docs](https://testing-library.com/)
- [Vitest Docs](https://vitest.dev/)
- [User Event Docs](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Need Help?**

1. Check test patterns in existing tests
2. Read detailed docs in `README.md`
3. Check coverage report: `npm run test:coverage`
4. Run specific test: `npm run test -- -t "test name"`
