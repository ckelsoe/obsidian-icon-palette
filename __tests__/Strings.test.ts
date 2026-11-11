import { describe, it, expect, afterEach } from 'vitest';
import Strings from '../src/Strings.js';

// `localizeDefaultStrings` is a private static. The cast gives the test a narrow
// typed handle without adding an export just for tests.
const StringsInternal = Strings as unknown as {
	localizeDefaultStrings(
		defaultStrings: Record<string, unknown>,
		localizedStrings: Record<string, unknown>,
	): void;
};

describe('localizeDefaultStrings', () => {
	afterEach(() => {
		delete (Object.prototype as Record<string, unknown>).polluted;
	});

	it('replaces default strings with translated ones', () => {
		const defaults = { menu: { open: 'Open', close: 'Close' } };
		StringsInternal.localizeDefaultStrings(defaults, {
			menu: { open: 'Ouvrir' },
		});
		expect(defaults.menu).toEqual({ open: 'Ouvrir', close: 'Close' });
	});

	it('ignores keys the defaults do not have', () => {
		const defaults: Record<string, unknown> = { menu: { open: 'Open' } };
		StringsInternal.localizeDefaultStrings(defaults, {
			stray: 'x',
			menu: { extra: 'y' },
		});
		expect(defaults).toEqual({ menu: { open: 'Open' } });
	});

	it('never writes through a __proto__ key', () => {
		const defaults = { menu: { open: 'Open' } };
		StringsInternal.localizeDefaultStrings(
			defaults,
			JSON.parse(
				'{"__proto__": {"polluted": "yes"}, "menu": {"__proto__": {"polluted": "yes"}}}',
			) as Record<string, unknown>,
		);
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});
});
