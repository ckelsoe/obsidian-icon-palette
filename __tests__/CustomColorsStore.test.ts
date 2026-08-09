import { describe, it, expect } from '@jest/globals';
import CustomColorsStore from '../src/CustomColorsStore.js';

describe('CustomColorsStore.normalize', () => {
	it('trims and lowercases so hex case and padding collapse to one key', () => {
		expect(CustomColorsStore.normalize('  #AABBCC ')).toBe('#aabbcc');
		expect(CustomColorsStore.normalize('#aabbcc')).toBe(CustomColorsStore.normalize('#AABBCC'));
	});
});

describe('CustomColorsStore.has', () => {
	it('matches regardless of case', () => {
		expect(CustomColorsStore.has(['#aabbcc'], '#AABBCC')).toBe(true);
		expect(CustomColorsStore.has(['#aabbcc'], '#112233')).toBe(false);
	});

	it('is false for an empty list', () => {
		expect(CustomColorsStore.has([], '#aabbcc')).toBe(false);
	});
});

describe('CustomColorsStore.save', () => {
	it('front-inserts a new color and reports a change', () => {
		const colors = ['#111111'];
		expect(CustomColorsStore.save(colors, '#222222', 12)).toBe(true);
		expect(colors).toEqual(['#222222', '#111111']);
	});

	it('moves an existing color to the front (dedup, no duplicate)', () => {
		const colors = ['#111111', '#222222', '#333333'];
		expect(CustomColorsStore.save(colors, '#333333', 12)).toBe(true);
		expect(colors).toEqual(['#333333', '#111111', '#222222']);
	});

	it('dedups case-insensitively when moving to the front, adopting the newly saved casing', () => {
		const colors = ['#111111', '#aabbcc'];
		expect(CustomColorsStore.save(colors, '#AABBCC', 12)).toBe(true);
		expect(colors).toEqual(['#AABBCC', '#111111']);
	});

	it('is a case-insensitive no-op when the color is already at the front and within cap', () => {
		const colors = ['#aabbcc', '#111111'];
		expect(CustomColorsStore.save(colors, '#AABBCC', 12)).toBe(false);
		expect(colors).toEqual(['#aabbcc', '#111111']);
	});

	it('still enforces the cap when the color is already at the front but the list is over cap', () => {
		const colors = ['#aabbcc', '#111111', '#222222'];
		expect(CustomColorsStore.save(colors, '#aabbcc', 2)).toBe(true);
		expect(colors).toEqual(['#aabbcc', '#111111']);
	});

	it('is a no-op when the color is already at the front', () => {
		const colors = ['#111111', '#222222'];
		expect(CustomColorsStore.save(colors, '#111111', 12)).toBe(false);
		expect(colors).toEqual(['#111111', '#222222']);
	});

	it('trims to the cap, dropping the oldest', () => {
		const colors = ['#222222', '#333333'];
		expect(CustomColorsStore.save(colors, '#111111', 2)).toBe(true);
		expect(colors).toEqual(['#111111', '#222222']);
	});

	it('does not throw, trims to empty, and reports the change for a non-positive cap', () => {
		const zero = ['#111111'];
		let zeroChanged = false;
		expect(() => { zeroChanged = CustomColorsStore.save(zero, '#222222', 0); }).not.toThrow();
		expect(zeroChanged).toBe(true);
		expect(zero).toEqual([]);

		const negative = ['#111111'];
		let negativeChanged = false;
		expect(() => { negativeChanged = CustomColorsStore.save(negative, '#222222', -5); }).not.toThrow();
		expect(negativeChanged).toBe(true);
		expect(negative).toEqual([]);
	});
});

describe('CustomColorsStore.remove', () => {
	it('removes a matching color case-insensitively and reports a change', () => {
		const colors = ['#aabbcc', '#111111'];
		expect(CustomColorsStore.remove(colors, '#AABBCC')).toBe(true);
		expect(colors).toEqual(['#111111']);
	});

	it('is a no-op when the color is not present', () => {
		const colors = ['#111111'];
		expect(CustomColorsStore.remove(colors, '#222222')).toBe(false);
		expect(colors).toEqual(['#111111']);
	});
});

describe('CustomColorsStore.getName / setName', () => {
	it('returns an empty string when a color has no name', () => {
		expect(CustomColorsStore.getName({}, '#aabbcc')).toBe('');
	});

	it('sets a name, trims it, and reports a change', () => {
		const names: Record<string, string> = {};
		expect(CustomColorsStore.setName(names, '#AABBCC', '  Brand blue  ')).toBe(true);
		expect(names).toEqual({ '#aabbcc': 'Brand blue' });
		expect(CustomColorsStore.getName(names, '#aabbcc')).toBe('Brand blue');
	});

	it('reads and writes case-insensitively via the normalized key', () => {
		const names: Record<string, string> = {};
		CustomColorsStore.setName(names, '#aabbcc', 'Sky');
		expect(CustomColorsStore.getName(names, '#AABBCC')).toBe('Sky');
	});

	it('is a no-op when the name is unchanged', () => {
		const names = { '#aabbcc': 'Sky' };
		expect(CustomColorsStore.setName(names, '#AABBCC', 'Sky')).toBe(false);
	});

	it('deletes the entry (not stores an empty string) when the name is blank, reporting a change only when one existed', () => {
		const names = { '#aabbcc': 'Sky' };
		expect(CustomColorsStore.setName(names, '#aabbcc', '   ')).toBe(true);
		expect(names).toEqual({});
		expect(CustomColorsStore.setName(names, '#aabbcc', '')).toBe(false);
	});

	it('does not read inherited object keys as a name (e.g. "constructor")', () => {
		const names: Record<string, string> = {};
		// Without an own-property guard, names["constructor"] resolves up the
		// prototype chain to a function, which would become a menu title.
		expect(CustomColorsStore.getName(names, 'constructor')).toBe('');
		// setName treats the inherited key as absent, so a blank is a no-op...
		expect(CustomColorsStore.setName(names, 'constructor', '')).toBe(false);
		// ...and a real name creates an own property that then reads back.
		expect(CustomColorsStore.setName(names, 'constructor', 'Weird')).toBe(true);
		expect(CustomColorsStore.getName(names, 'constructor')).toBe('Weird');
	});

	it('stores a "__proto__" name as an own property without corrupting the prototype', () => {
		const names: Record<string, string> = {};
		expect(CustomColorsStore.setName(names, '__proto__', 'Name')).toBe(true);
		// The name persists as an own data property...
		expect(CustomColorsStore.getName(names, '__proto__')).toBe('Name');
		expect(Object.prototype.hasOwnProperty.call(names, '__proto__')).toBe(true);
		// ...and the object's prototype is untouched (no setter was invoked).
		expect(Object.getPrototypeOf(names)).toBe(Object.prototype);
	});
});

describe('CustomColorsStore.pruneNames', () => {
	it('drops names whose color is no longer in the list', () => {
		const names = { '#aabbcc': 'Sky', '#111111': 'Ink' };
		expect(CustomColorsStore.pruneNames(['#aabbcc'], names)).toBe(true);
		expect(names).toEqual({ '#aabbcc': 'Sky' });
	});

	it('keeps a name when the color is still present under different casing', () => {
		const names = { '#aabbcc': 'Sky' };
		expect(CustomColorsStore.pruneNames(['#AABBCC'], names)).toBe(false);
		expect(names).toEqual({ '#aabbcc': 'Sky' });
	});

	it('prunes the name of a color evicted past the cap by save()', () => {
		const colors = ['#222222', '#333333'];
		const names = { '#333333': 'Old', '#222222': 'Keep' };
		CustomColorsStore.save(colors, '#111111', 2); // evicts #333333
		expect(CustomColorsStore.pruneNames(colors, names)).toBe(true);
		expect(names).toEqual({ '#222222': 'Keep' });
	});

	it('prunes the name of a removed color', () => {
		const colors = ['#aabbcc', '#111111'];
		const names = { '#aabbcc': 'Sky', '#111111': 'Ink' };
		CustomColorsStore.remove(colors, '#aabbcc');
		expect(CustomColorsStore.pruneNames(colors, names)).toBe(true);
		expect(names).toEqual({ '#111111': 'Ink' });
	});
});

describe('customColorNames load normalization', () => {
	// Mirrors IconPalettePlugin.loadSettings: rebuild the names map through setName
	// (normalizing keys, dropping blank/non-string names) then prune orphans, so a
	// hand-edited or older data.json loads into the same shape the UI writes.
	it('normalizes mixed-case keys and prunes names whose color is gone', () => {
		const raw: Record<string, unknown> = { '#AABBCC': 'Sky', '#123456': 'Orphan', '#ffffff': '  ', bad: 42 };
		const colors = ['#aabbcc'];
		const names: Record<string, string> = {};
		for (const [color, name] of Object.entries(raw)) {
			if (typeof name === 'string') CustomColorsStore.setName(names, color, name);
		}
		CustomColorsStore.pruneNames(colors, names);
		expect(names).toEqual({ '#aabbcc': 'Sky' });
		expect(CustomColorsStore.getName(names, '#AABBCC')).toBe('Sky');
	});
});
