import { describe, it, expect } from '@jest/globals';
import FavoritesStore from '../src/FavoritesStore.js';
import type { FavoritesState, IconColorCombo } from '../src/types.js';

const combo = (icon: string, color: string | null = null): IconColorCombo => ({ icon, color });
const state = (pinned: IconColorCombo[] = [], recent: IconColorCombo[] = []): FavoritesState => ({ pinned, recent });
const keys = (list: IconColorCombo[]): string[] => list.map(c => `${c.icon}:${c.color ?? ''}`);

describe('FavoritesStore.comboKey', () => {
	it('treats null color and empty color as the same key', () => {
		expect(FavoritesStore.comboKey(combo('star', null))).toBe(FavoritesStore.comboKey(combo('star', '')));
	});

	it('distinguishes two colors of the same icon, and two icons', () => {
		expect(FavoritesStore.comboKey(combo('star', 'red'))).not.toBe(FavoritesStore.comboKey(combo('star', 'blue')));
		expect(FavoritesStore.comboKey(combo('star', 'red'))).not.toBe(FavoritesStore.comboKey(combo('heart', 'red')));
	});
});

describe('FavoritesStore.recordRecent', () => {
	it('front-inserts a new combo and reports a change', () => {
		const s = state([], [combo('a')]);
		expect(FavoritesStore.recordRecent(s, combo('b'), 20)).toBe(true);
		expect(keys(s.recent)).toEqual(['b:', 'a:']);
	});

	it('moves an existing combo to the front (dedup, no duplicate)', () => {
		const s = state([], [combo('a'), combo('b'), combo('c')]);
		expect(FavoritesStore.recordRecent(s, combo('c'), 20)).toBe(true);
		expect(keys(s.recent)).toEqual(['c:', 'a:', 'b:']);
	});

	it('is a no-op when the combo is already at the front', () => {
		const s = state([], [combo('a'), combo('b')]);
		expect(FavoritesStore.recordRecent(s, combo('a'), 20)).toBe(false);
		expect(keys(s.recent)).toEqual(['a:', 'b:']);
	});

	it('trims to the cap, dropping the oldest', () => {
		const s = state([], [combo('b'), combo('c')]);
		expect(FavoritesStore.recordRecent(s, combo('a'), 2)).toBe(true);
		expect(keys(s.recent)).toEqual(['a:', 'b:']);
	});

	it('does not throw and trims to empty for a non-positive cap', () => {
		const zero = state([], [combo('a')]);
		expect(() => FavoritesStore.recordRecent(zero, combo('b'), 0)).not.toThrow();
		expect(zero.recent).toEqual([]);

		const negative = state([], [combo('a')]);
		expect(() => FavoritesStore.recordRecent(negative, combo('b'), -5)).not.toThrow();
		expect(negative.recent).toEqual([]);
	});

	it('never records a combo that is currently pinned', () => {
		const s = state([combo('a')], [combo('b')]);
		expect(FavoritesStore.recordRecent(s, combo('a'), 20)).toBe(false);
		expect(keys(s.recent)).toEqual(['b:']);
	});

	it('distinguishes color variants of the same icon', () => {
		const s = state([], [combo('star', 'red')]);
		expect(FavoritesStore.recordRecent(s, combo('star', 'blue'), 20)).toBe(true);
		expect(keys(s.recent)).toEqual(['star:blue', 'star:red']);
	});
});

describe('FavoritesStore.pin / unpin', () => {
	it('pin moves a recent combo to the front of pinned and out of recent', () => {
		const s = state([combo('x')], [combo('a'), combo('b')]);
		expect(FavoritesStore.pin(s, combo('a'))).toBe(true);
		expect(keys(s.pinned)).toEqual(['a:', 'x:']);
		expect(keys(s.recent)).toEqual(['b:']);
	});

	it('pin is a no-op when already pinned', () => {
		const s = state([combo('a')], []);
		expect(FavoritesStore.pin(s, combo('a'))).toBe(false);
		expect(keys(s.pinned)).toEqual(['a:']);
	});

	it('unpin removes from pinned and reports a change', () => {
		const s = state([combo('a'), combo('b')], []);
		expect(FavoritesStore.unpin(s, combo('a'))).toBe(true);
		expect(keys(s.pinned)).toEqual(['b:']);
	});

	it('unpin is a no-op when the combo is not pinned', () => {
		const s = state([combo('a')], []);
		expect(FavoritesStore.unpin(s, combo('z'))).toBe(false);
		expect(keys(s.pinned)).toEqual(['a:']);
	});
});

describe('FavoritesStore.isPinned / visibleRecent', () => {
	it('isPinned matches by combo key', () => {
		const s = state([combo('a', 'red')], []);
		expect(FavoritesStore.isPinned(s, combo('a', 'red'))).toBe(true);
		expect(FavoritesStore.isPinned(s, combo('a', 'blue'))).toBe(false);
	});

	it('visibleRecent never returns a pinned combo, even if stale in recent', () => {
		const s = state([combo('a')], [combo('a'), combo('b')]);
		expect(keys(FavoritesStore.visibleRecent(s))).toEqual(['b:']);
	});
});
