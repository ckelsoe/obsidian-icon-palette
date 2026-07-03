/** @type {import('jest').Config} */
module.exports = {
	// Custom node environment injects the browser/Obsidian globals (createDiv,
	// CSS) that source modules touch at import time or on their runtime-
	// independent paths. See __tests__/env.cjs.
	testEnvironment: '<rootDir>/__tests__/env.cjs',
	testMatch: ['**/__tests__/**/*.test.ts'],
	// `obsidian` is a peer dep provided at runtime by the Obsidian app; there is
	// no real module for jest to resolve. Map it to an inert stub so source files
	// that import from it can be loaded by the test harness.
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/__tests__/__mocks__/obsidian.ts',
		// Source uses node16 resolution, so relative imports carry an explicit
		// `.js` extension. Strip it for jest so it resolves the `.ts` source.
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: {
				// Override ESNext module to CommonJS for Jest compatibility
				module: 'CommonJS',
				// Source lives under src/ while tests live under __tests__/, so
				// ts-jest's per-file program roots at __tests__/. The project
				// tsconfig enables inlineSources, which then requires an explicit
				// rootDir. jest compiles in memory, so anchor it at the repo root.
				rootDir: '.',
			},
		}],
	},
};
