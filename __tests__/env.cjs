const { TestEnvironment: NodeEnvironment } = require('jest-environment-node');

// Custom jest environment (node) that injects the browser/Obsidian globals
// ColorUtils touches at import time (`createDiv`, used for a static field) and
// on its runtime-independent path (`CSS.supports`). Neither exists in node.
//
// Assigning through `this.global` keeps the plain node environment (parity with
// the reference plugins) and stays clear of the `global`/`globalThis` globals
// that Obsidian code must avoid. The stubs are inert: the pure-logic tests only
// exercise the deterministic fallback paths, which never touch the real DOM.
class IconPaletteEnvironment extends NodeEnvironment {
	async setup() {
		await super.setup();
		this.global.createDiv = () => ({ setCssStyles: () => {}, style: { color: '' } });
		this.global.CSS = { supports: () => false };
		// Obsidian type-guard globals used by the rule engine (isBoolean is a
		// global; isString/isNumber are statics Obsidian adds to String/Number).
		this.global.isBoolean = (obj) => typeof obj === 'boolean';
		this.global.String.isString = (obj) => typeof obj === 'string';
		this.global.Number.isNumber = (obj) => typeof obj === 'number';
	}
}

module.exports = IconPaletteEnvironment;
