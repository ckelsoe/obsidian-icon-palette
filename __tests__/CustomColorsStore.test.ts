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

	it('is a case-insensitive no-op when the color is already at the front', () => {
		const colors = ['#aabbcc', '#111111'];
		expect(CustomColorsStore.save(colors, '#AABBCC', 12)).toBe(false);
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
