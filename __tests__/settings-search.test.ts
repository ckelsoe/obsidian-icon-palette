// Obsidian's settings search finds a setting by its name, description and
// aliases. A section drawn by hand has none of those unless it is given them,
// so every one of them except the footer must carry a name and be searchable.

import { describe, it, expect, vi } from 'vitest';
import type IconPalettePlugin from 'src/IconPalettePlugin.js';
import IconPaletteSettingTab from 'src/IconPaletteSettingTab.js';

// The tab extends Obsidian classes at load time; the shared stub is inert and
// does not carry them, so they are added here. The plugin class and the
// dialogs pull in the whole runtime, which this test does not need.
vi.mock('obsidian', async (importOriginal) => {
	class Stub {}
	return {
		...(await importOriginal<Record<string, unknown>>()),
		ButtonComponent: Stub,
		ColorComponent: Stub,
		ExtraButtonComponent: Stub,
		Platform: { isDesktop: true, isMobile: false, isPhone: false },
		PluginSettingTab: Stub,
		Setting: Stub,
		SettingGroup: Stub,
		TextComponent: Stub,
		setIcon: () => {},
	};
});
vi.mock('src/IconPalettePlugin.js', () => ({ default: class {} }));
vi.mock('src/dialogs/RulePicker.js', () => ({ default: class {} }));
vi.mock('src/dialogs/UsageChecker.js', () => ({ default: class {} }));

interface Item {
	type?: string;
	name?: string;
	desc?: unknown;
	aliases?: unknown;
	searchable?: boolean;
	render?: unknown;
	items?: Item[];
}

function leaves(items: Item[]): Item[] {
	return items.flatMap((i) => (i.items ? leaves(i.items) : [i]));
}

describe('settings search', () => {
	const tab = new IconPaletteSettingTab({
		settings: {},
	} as unknown as IconPalettePlugin);
	const items = leaves(tab.getSettingDefinitions() as unknown as Item[]);
	const custom = items.filter((i) => i.render !== undefined && !i.type);

	it('gives every hand-drawn section a name and makes it searchable, except the footer', () => {
		// Obsidian treats an absent `searchable` as true.
		const hidden = custom.filter((i) => i.searchable === false);
		expect(hidden).toHaveLength(1);
		for (const i of custom.filter((c) => c.searchable !== false)) {
			expect(typeof i.name).toBe('string');
			expect(i.name).not.toBe('');
			expect(typeof i.desc).toBe('string');
			expect(Array.isArray(i.aliases)).toBe(true);
		}
	});

	it.each([
		['Rulebook', 'rules'],
		['Saved colors', 'swatches'],
		['View unused icons', 'orphaned'],
	])('finds %s by name and by the alias %s', (name, alias) => {
		const item = items.find((i) => i.name === name);
		expect(item?.aliases).toContain(alias);
	});
});
