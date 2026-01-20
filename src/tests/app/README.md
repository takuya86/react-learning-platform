# App Directory Tests

Comprehensive unit tests for the `/src/app/` directory.

## Test Files

### App.test.tsx

Tests the root App component.

**Coverage:**

- AppProviders wrapper rendering
- RouterProvider integration
- Provider hierarchy

**Test Cases:**

- Renders AppProviders wrapper
- Renders RouterProvider inside AppProviders
- Passes router configuration to RouterProvider

---

### Layout.test.tsx

Tests the application layout component with navigation and auth states.

**Coverage:**

- Header and navigation rendering
- User authentication states (guest, user, admin)
- Logout functionality
- Admin theme application
- Navigation link behavior
- Layout structure (header, main, footer)
- Error handling

**Test Cases:**

#### Not Authenticated (18 tests)

- Renders header with navigation
- Renders logo link
- Renders all navigation links
- Renders login link
- Does not render logout button
- Does not render admin link

#### Authenticated User (4 tests)

- Displays user email
- Renders logout button
- Calls signOut on logout click
- Does not render login link

#### Admin User (2 tests)

- Renders admin link for admin users
- Has correct href for admin link

#### Admin Theme (3 tests)

- Does not apply admin theme on non-admin pages
- Applies admin theme on admin pages
- Applies admin theme on admin subpages

#### Navigation Links (2 tests)

- Has correct hrefs for all navigation links
- Applies active class to current route

#### Layout Structure (4 tests)

- Renders main content area
- Renders footer
- Displays footer text
- Renders outlet for child routes

#### Error Handling (1 test)

- Handles signOut errors gracefully

---

### providers.test.tsx

Tests the AppProviders component that composes all context providers.

**Coverage:**

- Provider hierarchy (Auth > Sync > Progress)
- SyncedProgressProvider integration
- Progress change callback connection
- Multiple children handling
- Edge cases

**Test Cases:**

#### Provider Hierarchy (2 tests)

- Renders all providers in correct order
- Renders child content

#### SyncedProgressProvider Integration (2 tests)

- Passes onProgressChange callback to ProgressProvider
- Connects ProgressProvider with SyncProvider

#### Multiple Children (2 tests)

- Renders multiple children
- Preserves child component order

#### Provider Composition (1 test)

- Provides context from all providers

#### Edge Cases (3 tests)

- Handles null children
- Handles undefined children
- Handles empty fragment

---

### router.test.tsx

Tests the React Router configuration.

**Coverage:**

- Route structure validation
- Public routes (login, auth callback)
- Protected routes (all authenticated pages)
- Admin routes with role protection
- Route parameters
- Route uniqueness
- Element definitions

**Test Cases:**

#### Route Structure (3 tests)

- Is a valid router configuration
- Has public routes at root level
- Has protected routes under root path

#### Public Routes (2 tests)

- Defines login route
- Defines auth callback route

#### Protected Routes (6 tests)

- Has dashboard as index route
- Defines lessons routes
- Defines roadmap route
- Defines quiz routes
- Defines progress route
- Defines notes route
- Defines catch-all 404 route

#### Admin Routes (3 tests)

- Defines admin dashboard route
- Defines admin backlog route
- Defines admin metrics route

#### Route Parameters (3 tests)

- Has id parameter in lesson detail route
- Has id parameter in exercise route
- Has id parameter in quiz route

#### Route Count Validation (2 tests)

- Has expected number of protected routes
- Has expected number of public routes

#### Route Elements (2 tests)

- Has element defined for each route
- Has element defined for protected child routes

#### Route Paths Uniqueness (2 tests)

- Has unique paths at root level
- Has unique paths in protected routes

---

## Running Tests

```bash
# Run all app tests
npm run test:run -- src/tests/app

# Run with coverage
npm run test:run -- --coverage src/tests/app

# Run specific test file
npm run test:run -- src/tests/app/Layout.test.tsx

# Watch mode
npm run test -- src/tests/app
```

## Test Patterns

### Mocking Strategy

1. **External Dependencies**: Mock all external modules

   ```typescript
   vi.mock('@/features/auth', () => ({
     useAuth: () => mockUseAuth(),
   }));
   ```

2. **Child Components**: Mock with data-testid for verification

   ```typescript
   vi.mock('@/app/providers', () => ({
     AppProviders: ({ children }: { children: React.ReactNode }) => (
       <div data-testid="app-providers">{children}</div>
     ),
   }));
   ```

3. **Router**: Use BrowserRouter for testing navigation
   ```typescript
   render(
     <BrowserRouter>
       <Routes>
         <Route path="*" element={<Layout />} />
       </Routes>
     </BrowserRouter>
   );
   ```

### Testing Patterns

1. **AAA Pattern**: Arrange, Act, Assert

   ```typescript
   it('should call signOut when logout button is clicked', async () => {
     // Arrange
     const user = userEvent.setup();
     renderWithRouter();

     // Act
     const logoutButton = screen.getByText('ログアウト');
     await user.click(logoutButton);

     // Assert
     expect(mockSignOut).toHaveBeenCalledTimes(1);
   });
   ```

2. **User Event**: Use `@testing-library/user-event` for interactions

   ```typescript
   const user = userEvent.setup();
   await user.click(button);
   ```

3. **Accessibility Testing**: Test with roles and labels
   ```typescript
   expect(screen.getByRole('banner')).toBeInTheDocument();
   expect(screen.getByLabelText('クイックアクセスメニュー')).toBeInTheDocument();
   ```

## Coverage Goals

- **Target**: 70%+ coverage for app directory
- **Current**: Run `npm run test:run -- --coverage src/tests/app` to check
- **Focus Areas**:
  - All component rendering paths
  - User interactions
  - Authentication states
  - Navigation behavior
  - Error handling

## Test Organization

```
src/tests/app/
├── App.test.tsx           # Root App component (3 tests)
├── Layout.test.tsx        # Layout with navigation (34 tests)
├── providers.test.tsx     # Provider composition (10 tests)
├── router.test.tsx        # Route configuration (23 tests)
└── README.md             # This file
```

**Total Test Cases**: 70+ tests

## Maintenance

### Adding New Routes

1. Add route to `src/app/router.tsx`
2. Add test case in `router.test.tsx`
3. Update route count expectations

### Adding New Providers

1. Add provider to `src/app/providers.tsx`
2. Add hierarchy test in `providers.test.tsx`
3. Update mock configurations

### Modifying Layout

1. Update `src/app/Layout.tsx`
2. Add/update tests in `Layout.test.tsx`
3. Test all auth states
