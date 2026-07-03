import { describe, it, expect } from '@jest/globals';
import ColorUtils, { COLORS } from '../src/ColorUtils.js';

// `mixToRgb` is a private static. Unit-testing it needs a narrow typed handle;
// the cast keeps the production surface unchanged (no export is added just for
// tests) while still exercising the real colour-mix arithmetic.
const ColorUtilsInternal = ColorUtils as unknown as {
	mixToRgb(colorMix: string): string;
};

describe('ColorUtils.COLORS', () => {
	it('maps the nine basic colours to Obsidian CSS variables', () => {
		expect(COLORS.size).toBe(9);
		expect(COLORS.get('red')).toBe('--color-red');
		expect(COLORS.get('gray')).toBe('--color-base-70');
	});
});

describe('ColorUtils.toRgb', () => {
	it('returns the grey fallback for an unrecognised colour', () => {
		expect(ColorUtils.toRgb('definitely-not-a-colour')).toBe('rgb(128, 128, 128)');
	});
});

describe('ColorUtils.toRgbObject', () => {
	it('parses the grey fallback into an RGB object', () => {
		expect(ColorUtils.toRgbObject('definitely-not-a-colour')).toEqual({ r: 128, g: 128, b: 128 });
	});
});

describe('ColorUtils.toHslArray', () => {
	it('converts the grey fallback to HSL grey', () => {
		expect(ColorUtils.toHslArray('definitely-not-a-colour')).toEqual([0, 0, 50]);
	});
});

describe('ColorUtils.mixToRgb', () => {
	it('mixes two colours at equal weight', () => {
		expect(ColorUtilsInternal.mixToRgb('color-mix(in srgb, rgb(255, 0, 0) 50%, rgb(0, 0, 255) 50%)'))
			.toBe('rgb(128, 0, 128)');
	});

	it('honours unequal percentages', () => {
		expect(ColorUtilsInternal.mixToRgb('color-mix(in srgb, rgb(255, 0, 0) 75%, rgb(0, 0, 0) 25%)'))
			.toBe('rgb(191, 0, 0)');
	});

	it('returns black when the string does not match the colour-mix shape', () => {
		expect(ColorUtilsInternal.mixToRgb('not-a-color-mix')).toBe('rgb(0, 0, 0)');
	});
});
