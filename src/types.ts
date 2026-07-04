// Domain types for the plugin. Extracted from IconPalettePlugin.ts so that
// managers, dialogs, and components import the shared model from here instead
// of from the lifecycle class, breaking the type-level import cycle back to the
// entry file.

export type Category = 'app' | 'tab' | 'file' | 'folder' | 'group' | 'search' | 'graph' | 'url' | 'tag' | 'property' | 'ribbon' | 'rule';
export type IconLibraryFilter = 'lucide' | 'devicon' | 'simple' | 'emoji';
export type AppItemId = 'help' | 'settings' | 'pin' | 'sidebarLeft' | 'sidebarRight' | 'minimize' | 'maximize' | 'unmaximize' | 'close';

/**
 * Base interface for all icon objects.
 */
export interface Icon {
	icon: string | null;
	color: string | null;
}

/**
 * A reusable icon+color pairing for the favorites feature. Unlike {@link Icon},
 * the icon is never null: a combo is always a concrete icon or emoji. `color`
 * may be null, meaning the default/theme color; an empty-string color counts as
 * the same as null (no color) when two combos are compared for identity.
 */
export interface IconColorCombo {
	icon: string;
	color: string | null;
}

/**
 * Persisted favorites: manually pinned combos and an automatic recent list,
 * both most-recent/newest first. A combo that is pinned never also appears in
 * `recent`.
 */
export interface FavoritesState {
	pinned: IconColorCombo[];
	recent: IconColorCombo[];
}
export interface Item extends Icon {
	id: string;
	name: string;
	category: Category;
	iconDefault: string | null;
}
export type AppItem = Item;
export interface TabItem extends Item {
	isActive: boolean;
	isRoot: boolean;
	isStacked: boolean;
	iconEl: HTMLElement | null;
	tabEl: HTMLElement | null;
}
export interface FileItem extends Item {
	items: FileItem[] | null;
}
export interface BookmarkItem extends Item {
	items: BookmarkItem[] | null;
}
export type TagItem = Item;
export interface PropertyItem extends Item {
	type: string | null;
}
export interface RibbonItem extends Item {
	isHidden: boolean;
	iconEl: HTMLElement | null;
}

export interface ConditionBase {
	source?: string;
	operator?: string;
	value?: string;
}

export interface RuleBase {
	id?: string;
	name?: string;
	icon?: string;
	color?: string;
	match?: string;
	conditions?: ConditionBase[];
	enabled?: boolean;
}
