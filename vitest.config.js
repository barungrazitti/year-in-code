import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['index.js', 'config.js'],
      exclude: [
        'node_modules/',
        'test-*.js',
        '**/*.test.js',
        '**/coverage/',
        'vitest.config.js',
        'vitest.setup.js',
      ],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 70,
        statements: 30,
      },
    },
  },
});
