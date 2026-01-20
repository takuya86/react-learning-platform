import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX must come before React plugin
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - rarely changes
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client - separate chunk for better caching
          supabase: ['@supabase/supabase-js'],
          // Form handling - only loaded on exercise/form pages
          form: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // MDX rendering - loaded when viewing lessons
          mdx: ['@mdx-js/react'],
          // Icons - frequently used but cacheable
          icons: ['lucide-react'],
        },
      },
    },
  },
});
