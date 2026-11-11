// Injects the browser/Obsidian globals ColorUtils touches at import time
// (`createDiv`, used for a static field) and on its runtime-independent path
// (`CSS.supports`). Neither exists in node.
//
// vi.stubGlobal keeps the test code clear of the `global`/`globalThis` globals
// that Obsidian code must avoid. The stubs are inert: the pure-logic tests only
// exercise the deterministic fallback paths, which never touch the real DOM.
vi.stubGlobal('createDiv', () => ({
	setCssStyles: () => {},
	style: { color: '' },
}));
vi.stubGlobal('CSS', { supports: () => false });
// Obsidian type-guard globals used by the rule engine (isBoolean is a global;
// isString/isNumber are statics Obsidian adds to String/Number).
vi.stubGlobal('isBoolean', (obj: unknown) => typeof obj === 'boolean');
Object.assign(String, { isString: (obj: unknown) => typeof obj === 'string' });
Object.assign(Number, { isNumber: (obj: unknown) => typeof obj === 'number' });
