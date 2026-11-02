import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/**
 * Base path for the deployed site.
 *
 * - Project site (https://USER.github.io/REPOSITORY/): "/REPOSITORY/"
 * - Root site or custom domain:                        "/"
 *
 * The GitHub Actions workflow sets BASE_PATH from the repository name.
 * Override locally with `BASE_PATH=/ pnpm build` (or `BASE_PATH=/ pnpm dev`).
 */
const basePath = process.env.BASE_PATH ?? '/tokyo-comedy-dating-bingo/';

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['src/tests/**/*.test.ts'],
    setupFiles: ['src/tests/setup.ts'],
  },
});
