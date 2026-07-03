// Minimal stub of the `obsidian` module for jest. Wired in via
// moduleNameMapper in jest.config.cjs.
//
// The `obsidian` package is a peer dependency provided at runtime by
// Obsidian itself. At test time there is no real module to resolve, so any
// source file that imports from it would fail in jest without this stub.
// Tests only exercise the pure, runtime-independent helpers, so these stubs
// are deliberately inert: they satisfy the imports and return empty shapes,
// nothing more.
//
// Add more stub exports here as new source modules under test begin importing
// from obsidian. Keep them inert; behavioural testing of anything that uses
// Obsidian's runtime belongs in a real vault, not in jest.

export interface RGB {
	r: number;
	g: number;
	b: number;
}

// `Strings.ts` imports getLanguage and runs a static localiser at module load;
// return a language that short-circuits to the default (no dynamic import).
export function getLanguage(): string {
	return 'en';
}
