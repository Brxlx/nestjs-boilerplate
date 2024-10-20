import swc from 'unplugin-swc';
import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * Configures the Vitest testing framework for end-to-end (E2E) tests.
 *
 * - Includes all files with the `.e2e-spec.ts` extension for testing.
 * - Enables global test variables.
 * - Sets the root directory for tests to the current directory.
 * - Specifies a setup file (`./test/setup-e2e.ts`) to be executed before running tests.
 * - Configures the use of TypeScript path aliases (`@`) by integrating the `vite-tsconfig-paths` plugin.
 * - Configures the use of the SWC compiler for building the test files, setting the module type to `es6`.
 */
export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    setupFiles: ['./test/setup-e2e.ts'],
  },
  // resolve: {
  //   alias: [{ find: '@', replacement: resolve(__dirname, './src') }],
  // },
  plugins: [
    tsConfigPaths(),
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: 'es6' },
    }),
  ],
});
