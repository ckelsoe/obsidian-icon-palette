import { describe, it, expect } from '@jest/globals';
import IconPathMap from '../src/IconPathMap.js';

type Icon = { icon?: string | null; color?: string | null };

// A folder `Notes` with iconed descendants, plus two prefix-siblings that share
// the leading `Notes` string but are NOT under the folder. The trailing-slash
// boundary must leave both siblings untouched.
function sampleMap(): Record<string, Icon> {
	return {
		'Notes': { color: 'red' },
		'Notes/a.md': { color: 'blue' },
		'Notes/sub/b.md': { icon: 'star' },
		'Notes.md': { color: 'green' },
		'Notes Archive/c.md': { color: 'yellow' },
	};
}

describe('IconPathMap.rekeyDescendants', () => {
	it('re-keys the folder and every descendant, leaving prefix-siblings', () => {
		const map = sampleMap();
		const changed = IconPathMap.rekeyDescendants(map, 'Notes', 'Journal');
		expect(changed).toBe(true);
		expect(map).toEqual({
			'Journal': { color: 'red' },
			'Journal/a.md': { color: 'blue' },
			'Journal/sub/b.md': { icon: 'star' },
			'Notes.md': { color: 'green' },
			'Notes Archive/c.md': { color: 'yellow' },
		});
	});

	it('moves only the exact key for a plain file rename (no descendants)', () => {
		const map: Record<string, Icon> = { 'a.md': { color: 'red' }, 'ab.md': { color: 'blue' } };
		const changed = IconPathMap.rekeyDescendants(map, 'a.md', 'b.md');
		expect(changed).toBe(true);
		expect(map).toEqual({ 'b.md': { color: 'red' }, 'ab.md': { color: 'blue' } });
	});

	it('reports no change when nothing is keyed under the path', () => {
		const map: Record<string, Icon> = { 'x.md': { color: 'red' } };
		const changed = IconPathMap.rekeyDescendants(map, 'Notes', 'Journal');
		expect(changed).toBe(false);
		expect(map).toEqual({ 'x.md': { color: 'red' } });
	});
});

describe('IconPathMap.pruneDescendants', () => {
	it('deletes the folder key and every descendant, leaving prefix-siblings', () => {
		const map = sampleMap();
		const changed = IconPathMap.pruneDescendants(map, 'Notes');
		expect(changed).toBe(true);
		expect(map).toEqual({
			'Notes.md': { color: 'green' },
			'Notes Archive/c.md': { color: 'yellow' },
		});
	});

	it('deletes a single file key with no descendants', () => {
		const map: Record<string, Icon> = { 'a.md': { color: 'red' }, 'ab.md': { color: 'blue' } };
		const changed = IconPathMap.pruneDescendants(map, 'a.md');
		expect(changed).toBe(true);
		expect(map).toEqual({ 'ab.md': { color: 'blue' } });
	});

	it('reports no change when the path is absent', () => {
		const map: Record<string, Icon> = { 'x.md': { color: 'red' } };
		const changed = IconPathMap.pruneDescendants(map, 'Notes');
		expect(changed).toBe(false);
		expect(map).toEqual({ 'x.md': { color: 'red' } });
	});
});

describe('IconPathMap end-to-end folder flow (plan regression scenario)', () => {
	it('follows a rename then prunes on delete', () => {
		const map = sampleMap();
		expect(IconPathMap.rekeyDescendants(map, 'Notes', 'Journal')).toBe(true);
		expect(IconPathMap.pruneDescendants(map, 'Journal')).toBe(true);
		// Every Journal/... key and the exact Journal key are gone; siblings remain.
		expect(map).toEqual({
			'Notes.md': { color: 'green' },
			'Notes Archive/c.md': { color: 'yellow' },
		});
	});
});
