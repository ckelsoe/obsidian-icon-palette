import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		// TypeScript first. The build writes main.js at the repo root, and with the
		// default order a test import could pick up a build artifact over the source.
		extensions: ['.ts', '.mts', '.mjs', '.js', '.json'],
		alias: [
			// Tests run against the stub, never the real (types-only) package.
			{
				find: /^obsidian$/,
				replacement: fileURLToPath(
					new URL(
						'./__tests__/__mocks__/obsidian.ts',
						import.meta.url,
					),
				),
			},
			// Root-relative `src/...` specifiers (from the tsconfig paths mapping).
			{
				find: /^src\//,
				replacement: fileURLToPath(new URL('./src/', import.meta.url)),
			},
		],
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['__tests__/**/*.test.ts'],
		// Injects the browser/Obsidian globals source modules touch at import time.
		setupFiles: ['__tests__/setup.ts'],
		// Stryker's instrumented code runs some 20 times slower, so a mutation run
		// (stryker.config.mjs sets the flag) gets a far wider limit.
		testTimeout: process.env.ICON_PALETTE_MUTATION_RUN ? 600_000 : 30_000,
	},
});
