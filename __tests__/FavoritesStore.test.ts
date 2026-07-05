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

	it('does not throw, trims to empty, and reports the change for a non-positive cap', () => {
		const zero = state([], [combo('a')]);
		let zeroChanged = false;
		expect(() => { zeroChanged = FavoritesStore.recordRecent(zero, combo('b'), 0); }).not.toThrow();
		expect(zeroChanged).toBe(true);
		expect(zero.recent).toEqual([]);

		const negative = state([], [combo('a')]);
		let negativeChanged = false;
		expect(() => { negativeChanged = FavoritesStore.recordRecent(negative, combo('b'), -5); }).not.toThrow();
		expect(negativeChanged).toBe(true);
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

describe('FavoritesStore.menuCombos', () => {
	it('caps each group independently and preserves order', () => {
		const s = state(
			[combo('p1'), combo('p2'), combo('p3'), combo('p4')],
			[combo('r1'), combo('r2'), combo('r3'), combo('r4')],
		);
		const { pinned, recent } = FavoritesStore.menuCombos(s, 3);
		expect(keys(pinned)).toEqual(['p1:', 'p2:', 'p3:']);
		expect(keys(recent)).toEqual(['r1:', 'r2:', 'r3:']);
	});

	it('returns fewer than the cap when a group is short', () => {
		const s = state([combo('a')], []);
		const { pinned, recent } = FavoritesStore.menuCombos(s, 3);
		expect(keys(pinned)).toEqual(['a:']);
		expect(recent).toEqual([]);
	});

	it('excludes a pinned combo that is stale in recent', () => {
		const s = state([combo('a')], [combo('a'), combo('b')]);
		const { pinned, recent } = FavoritesStore.menuCombos(s, 3);
		expect(keys(pinned)).toEqual(['a:']);
		expect(keys(recent)).toEqual(['b:']);
	});

	it('returns two empty lists for empty state', () => {
		const { pinned, recent } = FavoritesStore.menuCombos(state(), 3);
		expect(pinned).toEqual([]);
		expect(recent).toEqual([]);
	});

	it('does not throw and yields empty lists for a non-positive cap', () => {
		const s = state([combo('a')], [combo('b')]);
		let result: ReturnType<typeof FavoritesStore.menuCombos> | undefined;
		expect(() => { result = FavoritesStore.menuCombos(s, 0); }).not.toThrow();
		expect(result?.pinned).toEqual([]);
		expect(result?.recent).toEqual([]);
	});

	it('does not mutate the source state', () => {
		const s = state([combo('p1'), combo('p2')], [combo('r1'), combo('r2')]);
		FavoritesStore.menuCombos(s, 1);
		expect(keys(s.pinned)).toEqual(['p1:', 'p2:']);
		expect(keys(s.recent)).toEqual(['r1:', 'r2:']);
	});
});
