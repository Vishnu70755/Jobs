import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './src/test/setup.ts',
      './src/test/accessibility/setup.ts'
    ],
    css: false,
    // Coverage reporting setup
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Exclude node_modules and test files
      exclude: [
        'node_modules/',
        'src/test/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'tests/',
        '{*.config,vitest}.{ts,js}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, '../attached_assets'),
    },
  },
});