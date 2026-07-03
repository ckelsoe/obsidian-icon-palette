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
