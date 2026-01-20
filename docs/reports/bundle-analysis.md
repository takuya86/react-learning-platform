# Bundle Size Analysis Report

**Date:** 2026-01-20
**Bundle Version:** v0.0.0
**Analysis Tool:** vite-bundle-visualizer

## Executive Summary

Current production bundle is **1,231 KB (337 KB gzipped)**, exceeding the recommended 500 KB threshold. The bundle contains 30 MDX lesson files that are being statically imported instead of dynamically code-split, along with several large dependencies.

### Key Metrics

| Metric           | Value       | Status               |
| ---------------- | ----------- | -------------------- |
| Total JS Bundle  | 1,231.07 KB | ⚠️ Large             |
| Gzipped JS       | 336.67 KB   | ⚠️ Above target      |
| CSS Bundle       | 129.97 KB   | ✅ Acceptable        |
| Gzipped CSS      | 22.83 KB    | ✅ Good              |
| Number of Chunks | 1           | ⚠️ No code splitting |

## Current Bundle Size Breakdown

### 1. Build Output

```
dist/
├── index.html                     0.75 KB (0.41 KB gzip)
├── assets/index-BlEx_ukq.css    129.97 KB (22.83 KB gzip)
└── assets/index-54UCiTHD.js   1,231.07 KB (336.67 KB gzip) ⚠️
```

### 2. Top 10 Largest Dependencies

Based on bundle analysis, here are the largest dependencies by rendered size:

| Rank | Package                                     | Size (KB) | Gzip (KB) | Purpose                 | Tree-shakable      |
| ---- | ------------------------------------------- | --------- | --------- | ----------------------- | ------------------ |
| 1    | **react-dom/client**                        | 552.9     | 95.3      | React DOM rendering     | ❌ Core            |
| 2    | **react-router**                            | 212.5     | 46.0      | Routing                 | ❌ Core            |
| 3    | **@supabase/storage-js**                    | 91.8      | 16.5      | File storage API        | ✅ Partial         |
| 4    | **@supabase/postgrest-js**                  | 42.0      | ~10.0     | Database queries        | ❌ Core            |
| 5    | **@supabase/realtime-js** (RealtimeClient)  | 31.1      | 7.4       | Real-time subscriptions | ✅ Could lazy load |
| 6    | **@supabase/realtime-js** (RealtimeChannel) | 27.0      | 6.2       | Channel management      | ✅ Could lazy load |
| 7    | **react**                                   | 18.3      | 4.5       | React core              | ❌ Core            |
| 8    | **iceberg-js**                              | 15.8      | 3.3       | Analytics/tracking      | ✅ Could lazy load |
| 9    | **@supabase/auth-js** (helpers)             | 13.6      | ~3.0      | Authentication helpers  | ❌ Core            |
| 10   | **scheduler**                               | 11.2      | 2.6       | React scheduler         | ❌ Core            |

### 3. Additional Significant Dependencies

| Package             | Estimated Size (KB) | Gzip (KB) | Usage Count         | Notes                                                     |
| ------------------- | ------------------- | --------- | ------------------- | --------------------------------------------------------- |
| **react-hook-form** | ~25                 | ~8        | 1 file              | Used only in ExercisePage - candidate for code splitting  |
| **react-markdown**  | ~20                 | ~6        | 2 files             | Used in ExercisePage and NotePreview - could lazy load    |
| **lucide-react**    | ~15-20              | ~5-7      | 13 files            | Icons imported individually (good), but many files import |
| **@mdx-js/react**   | ~10-15              | ~3-5      | 1 file              | MDXProvider for lesson rendering                          |
| **zod**             | ~8-12               | ~3-4      | Via form validation | Schema validation                                         |

### 4. MDX Lesson Content

**Critical Issue:** All 30 MDX lesson files are being bundled into the main chunk despite attempts at lazy loading.

```
⚠️ WARNING from Vite:
"...is dynamically imported by loader.ts but also statically imported by loader.ts,
dynamic import will not move module into another chunk."
```

**Lessons (30 files):**

- react-basics.mdx
- useState-hook.mdx
- useEffect-hook.mdx
- useReducer-hook.mdx
- useRef-hook.mdx
- useCallback-useMemo.mdx
- react-context.mdx
- context-patterns.mdx
- custom-hooks.mdx
- react-forms.mdx
- form-validation.mdx
- react-router-basics.mdx
- router-advanced.mdx
- data-fetching.mdx
- loading-error-states.mdx
- error-boundaries.mdx
- react-performance.mdx
- react-strict-mode.mdx
- testing-basics.mdx
- typescript-with-react.mdx
- debugging-react.mdx
- styling-in-react.mdx
- props-basics.mdx
- children-props.mdx
- component-composition.mdx
- conditional-rendering.mdx
- lists-and-keys.mdx
- event-handling.mdx
- lifting-state-up.mdx
- state-management-patterns.mdx

**Estimated Impact:** Each lesson is approximately 2-5 KB (compressed), totaling ~60-150 KB of lesson content in the initial bundle.

## Analysis of Bundle Composition

### Dependency Distribution (Estimated)

```
Total Bundle: 1,231 KB
├── React + React DOM: ~570 KB (46%)
├── React Router: ~213 KB (17%)
├── Supabase Client: ~200 KB (16%)
├── MDX Lessons: ~60-150 KB (5-12%)
├── Form Libraries: ~45 KB (4%)
├── Other Dependencies: ~50-70 KB (4-6%)
└── Application Code: ~100-150 KB (8-12%)
```

## Critical Issues Identified

### 1. MDX Lesson Loader Configuration ⚠️ HIGH PRIORITY

**Problem:** `src/lib/lessons/loader.ts` uses `import.meta.glob()` with both eager loading (for frontmatter) and lazy loading (for components) on the same pattern. Vite sees this conflict and bundles everything statically.

**Current Code:**

```typescript
// Eager load frontmatter
const lessonMetadata = import.meta.glob<{ frontmatter: LessonFrontmatter }>(
  '/src/content/lessons/*.mdx',
  { eager: true, import: 'frontmatter' }
);

// Try to lazy load components (FAILS due to conflict)
const lessonComponents = import.meta.glob<MDXLessonModule>('/src/content/lessons/*.mdx');
```

**Impact:** ~60-150 KB of lesson content loaded on initial page load instead of on-demand.

### 2. Route-Based Code Splitting Not Implemented ⚠️ HIGH PRIORITY

**Problem:** All pages are imported directly in `router.tsx`:

```typescript
import { DashboardPage, LessonsPage, LessonDetailPage, ... } from '@/pages';
```

**Impact:** Every page component loads on initial load, including admin pages that most users never access.

### 3. Supabase Realtime Always Loaded ⚠️ MEDIUM PRIORITY

**Problem:** Realtime features (~58 KB) load even for users who may not use real-time sync features immediately.

**Impact:** ~58 KB (13.6 KB gzipped) loaded for a feature that could be lazy loaded.

### 4. No Manual Chunk Configuration ⚠️ MEDIUM PRIORITY

**Problem:** Vite's default chunking strategy creates one large bundle. No manual chunks defined for vendor libraries.

**Impact:** Poor caching strategy - any code change invalidates entire bundle.

## Optimization Recommendations

### Priority 1: Critical (High Impact, Quick Win)

#### 1.1 Fix MDX Lesson Dynamic Loading

**Impact:** Reduce initial bundle by ~60-150 KB
**Effort:** Low
**Implementation:**

Option A: Separate metadata loading from component loading

```typescript
// metadata-loader.ts - Only load frontmatter eagerly
export const lessonMetadata = import.meta.glob<{ frontmatter: LessonFrontmatter }>(
  '/src/content/lessons/*.mdx',
  { eager: true, import: 'frontmatter' }
);

// component-loader.ts - Lazy load components separately
export function loadLessonComponent(slug: string) {
  return lazy(() => import(`/src/content/lessons/${slug}.mdx`));
}
```

Option B: Use route-based loading instead

```typescript
// Let React Router handle lazy loading per lesson
{
  path: 'lessons/:id',
  lazy: () => import('./LessonDetailPage'),
}
```

#### 1.2 Implement Route-Based Code Splitting

**Impact:** Reduce initial bundle by ~100-200 KB
**Effort:** Low
**Implementation:**

```typescript
// router.tsx - Use React Router lazy loading
import { lazy } from 'react';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LessonsPage = lazy(() => import('@/pages/LessonsPage'));
const LessonDetailPage = lazy(() => import('@/pages/LessonDetailPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AdminMetricsPage = lazy(() => import('@/pages/AdminMetricsPage'));
const AdminBacklogPage = lazy(() => import('@/pages/AdminBacklogPage'));
// ... other pages
```

Add Suspense boundary in Layout:

```typescript
<Suspense fallback={<LoadingSpinner />}>
  <Outlet />
</Suspense>
```

### Priority 2: High Impact (Medium Effort)

#### 2.1 Configure Manual Vendor Chunks

**Impact:** Better caching, smaller initial load with parallel loading
**Effort:** Low
**Implementation:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          form: ['react-hook-form', '@hookform/resolvers', 'zod'],
          markdown: ['react-markdown', '@mdx-js/react'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
```

**Expected Result:**

```
dist/assets/
├── react-vendor-[hash].js    (~780 KB → 150 KB gzip)
├── supabase-[hash].js        (~200 KB → 40 KB gzip)
├── form-[hash].js            (~45 KB → 12 KB gzip)
├── markdown-[hash].js        (~35 KB → 10 KB gzip)
├── icons-[hash].js           (~20 KB → 6 KB gzip)
└── main-[hash].js            (~151 KB → 35 KB gzip)
```

#### 2.2 Lazy Load Supabase Realtime

**Impact:** Reduce initial bundle by ~58 KB (~13 KB gzipped)
**Effort:** Medium
**Implementation:**

```typescript
// features/sync/SyncProvider.tsx
import { lazy, Suspense } from 'react';

const RealtimeSync = lazy(() => import('./RealtimeSync'));

export function SyncProvider({ children }) {
  const [enableRealtime, setEnableRealtime] = useState(false);

  // Enable after initial load or on user action
  useEffect(() => {
    const timer = setTimeout(() => setEnableRealtime(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {enableRealtime && (
        <Suspense fallback={null}>
          <RealtimeSync />
        </Suspense>
      )}
      {children}
    </>
  );
}
```

#### 2.3 Lazy Load Admin Features

**Impact:** Reduce initial bundle for non-admin users by ~50-80 KB
**Effort:** Low (already behind auth check)
**Implementation:**

Ensure admin pages use route-based lazy loading (covered in 1.2), plus:

```typescript
// features/admin/* - Make sure these are not imported in main bundle
// Only import through lazy-loaded admin pages
```

### Priority 3: Medium Impact (Lower Effort)

#### 3.1 Optimize Lucide React Imports

**Impact:** Minimal (already using individual imports)
**Effort:** Very Low
**Status:** ✅ Already optimized

Current implementation is correct:

```typescript
import { BookOpen, FileText, BarChart3 } from 'lucide-react';
```

No changes needed - Vite tree-shakes unused icons.

#### 3.2 Lazy Load react-hook-form

**Impact:** Reduce initial bundle by ~25 KB for users not on exercise page
**Effort:** Low
**Implementation:**

Since react-hook-form is only used in ExercisePage, ensure ExercisePage is lazy loaded (covered in 1.2).

#### 3.3 Lazy Load react-markdown

**Impact:** Reduce initial bundle by ~20 KB for users not viewing notes
**Effort:** Low
**Implementation:**

```typescript
// NotePreview.tsx
import { lazy, Suspense } from 'react';

const Markdown = lazy(() => import('react-markdown'));

export function NotePreview({ content }) {
  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <Markdown>{content}</Markdown>
    </Suspense>
  );
}
```

### Priority 4: Long-term Optimizations

#### 4.1 Consider Alternative Router

**Impact:** Reduce bundle by ~200 KB
**Effort:** Very High
**Trade-offs:** React Router v7 provides excellent features - may not be worth the effort

Alternative: TanStack Router (~40 KB), Wouter (~2 KB)

**Recommendation:** Keep React Router v7 for now, focus on other optimizations.

#### 4.2 Evaluate Supabase Client Bundle Size

**Impact:** Potentially reduce by ~100 KB
**Effort:** Very High
**Trade-offs:** Need to maintain all features

Options:

- Use REST API directly for simple operations
- Import Supabase modules individually (may not be supported)
- Wait for Supabase to improve tree-shaking

**Recommendation:** Monitor Supabase updates, but keep current implementation.

#### 4.3 Implement Progressive Web App (PWA) with Workbox

**Impact:** Improve perceived performance through caching
**Effort:** Medium
**Implementation:**

```bash
npm install vite-plugin-pwa -D
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24, // 24 hours
            },
          },
        },
      ],
    },
  }),
];
```

## Expected Results After Optimizations

### After Priority 1 (Critical) Fixes

**Current:**

```
Main bundle: 1,231 KB (337 KB gzip)
```

**After fixes:**

```
Main bundle: ~850 KB (220 KB gzip)
Lesson chunks: 30 x ~3 KB = ~90 KB (loaded on demand)
```

**Improvement:** ~380 KB (-31%) reduction in initial load

### After Priority 1 + 2 (High Impact) Fixes

**With code splitting and manual chunks:**

```
Initial Load (parallel downloads):
├── react-vendor.js: ~780 KB → 150 KB gzip
├── supabase.js: ~140 KB → 30 KB gzip (realtime lazy loaded)
├── main.js: ~100 KB → 25 KB gzip
└── dashboard.js: ~50 KB → 12 KB gzip
Total Initial: ~217 KB gzip (was 337 KB) - 36% reduction

Lazy Loaded:
├── form.js: ~45 KB → 12 KB gzip (on exercise page)
├── markdown.js: ~35 KB → 10 KB gzip (on notes page)
├── admin pages: ~80 KB → 20 KB gzip (admin only)
├── lesson chunks: 30 x 3 KB gzip (per lesson)
└── realtime.js: ~58 KB → 13 KB gzip (after 2s delay)
```

**Total Improvement:** ~120 KB gzipped (-36%) reduction in initial load

### Target Metrics

| Metric              | Current  | After P1 | After P1+P2 | Target  |
| ------------------- | -------- | -------- | ----------- | ------- |
| Initial JS (gzip)   | 337 KB   | 220 KB   | 217 KB      | <200 KB |
| Time to Interactive | ~3.5s    | ~2.5s    | ~2.2s       | <2s     |
| Largest Chunk       | 1,231 KB | 850 KB   | 780 KB      | <500 KB |
| Number of Chunks    | 1        | 5-10     | 10-15       | 10-20   |

## Implementation Priority Order

1. **Fix MDX lesson dynamic loading** (1-2 hours)
   - Separate metadata and component loading
   - Test that lessons load correctly
   - Verify chunks are created

2. **Implement route-based code splitting** (2-3 hours)
   - Convert page imports to lazy()
   - Add Suspense boundaries
   - Test navigation between routes

3. **Configure manual vendor chunks** (1 hour)
   - Update vite.config.ts
   - Test build output
   - Verify chunk sizes

4. **Lazy load Supabase Realtime** (3-4 hours)
   - Refactor SyncProvider
   - Test sync functionality
   - Ensure no breaking changes

5. **Lazy load react-markdown** (1 hour)
   - Update NotePreview component
   - Add Suspense fallback

6. **Lazy load admin features** (already done via 1.2)
   - Verify admin pages are in separate chunks

**Total Estimated Effort:** 8-11 hours

**Expected Bundle Size After All Fixes:** ~217 KB gzipped (36% reduction)

## Monitoring and Validation

### Build Size Budget

Add to `package.json`:

```json
{
  "scripts": {
    "build:analyze": "vite build && npx vite-bundle-visualizer",
    "build:check": "npm run build && node scripts/check-bundle-size.js"
  }
}
```

Create `scripts/check-bundle-size.js`:

```javascript
const fs = require('fs');
const path = require('path');

const MAX_BUNDLE_SIZE = 250 * 1024; // 250 KB gzipped
const distDir = path.join(__dirname, '../dist/assets');

const files = fs.readdirSync(distDir);
const jsFiles = files.filter((f) => f.endsWith('.js'));

let failed = false;
jsFiles.forEach((file) => {
  const stats = fs.statSync(path.join(distDir, file));
  // Rough gzip estimation (actual gzip is ~70% smaller)
  const estimatedGzip = stats.size * 0.3;

  if (estimatedGzip > MAX_BUNDLE_SIZE) {
    console.error(
      `❌ ${file}: ${(estimatedGzip / 1024).toFixed(2)} KB (exceeds ${MAX_BUNDLE_SIZE / 1024} KB)`
    );
    failed = true;
  } else {
    console.log(`✅ ${file}: ${(estimatedGzip / 1024).toFixed(2)} KB`);
  }
});

if (failed) {
  process.exit(1);
}
```

### CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Check bundle size
  run: npm run build:check
```

## Additional Resources

- [Vite Build Optimization Guide](https://vitejs.dev/guide/build.html)
- [React Router Code Splitting](https://reactrouter.com/en/main/route/lazy)
- [MDX Dynamic Imports](https://mdxjs.com/guides/vite/)
- [Web.dev Bundle Size Guide](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)

---

**Report Generated:** 2026-01-20
**Next Review:** After implementing Priority 1 & 2 optimizations
**Owner:** Performance team
