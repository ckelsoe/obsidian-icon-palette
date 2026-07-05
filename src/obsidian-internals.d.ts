// Central catalogue of the internal, undocumented Obsidian API surface this
// plugin reaches through unchecked casts. None of these shapes is part of
// Obsidian's public API; each may change between releases (Hyrum's Law). They
// were previously declared inline across IconPalettePlugin.ts, IconPaletteSettingTab.ts,
// RibbonIconManager.ts, TabIconManager.ts, and IconPicker.ts; centralising them
// here keeps the full internal-API dependency auditable in one place when a new
// Obsidian version ships. The casts themselves are unchanged.

import type { Hotkey, Menu } from 'obsidian';
import type { Category } from 'src/types.js';

// --- Internal data shapes read through the augmentation interfaces below ---

export interface BookmarkBase {
	type?: Category;
	path?: string;
	subpath?: string;
	ctime?: string;
	title?: string;
	query?: string;
	url?: string;
	items?: BookmarkBase[];
}

export interface TagBase {
	id: string;
	name: string;
}

export interface PropertyBase {
	name?: string;
	widget?: string;
}

export interface MetadataWidget {
	icon?: string;
}

export interface RibbonItemBase {
	id?: string;
	title?: string;
	icon?: string;
	hidden?: boolean;
	buttonEl?: HTMLElement;
}

export interface HotkeyManagerBase {
	customKeys?: Record<string, Hotkey[]>;
}

export interface MenuItemWithIconElement {
	iconEl?: HTMLElement;
}

// `MenuItem.setSubmenu()` returns a nested Menu to populate. It is a real,
// long-standing runtime method but is absent from Obsidian's published
// obsidian.d.ts, so it cannot be called through the public type. Because it
// carries no `@since` tag, the obsidianmd no-unsupported-api rule (which version-
// gates only documented APIs) neither flags nor vouches for it; a human review
// could still question the undocumented reach. Used for the pinned/recent submenu
// in FileIconManager.
export interface MenuItemWithSubmenu {
	setSubmenu?: () => Menu;
}

// --- App augmentations ---

export interface AppWithInternalPlugins {
	internalPlugins?: {
		plugins?: {
			bookmarks?: {
				instance?: {
					items?: BookmarkBase[];
				};
			};
		};
	};
}

export interface AppWithMetadataTypes {
	metadataTypeManager?: {
		properties?: Record<string, PropertyBase>;
		getWidget?: (type: string) => MetadataWidget | undefined;
	};
}

export interface AppWithHotkeys {
	hotkeyManager?: HotkeyManagerBase;
}

export interface AppWithCustomCss {
	customCss?: {
		theme?: string;
	};
}

export interface AppWithPlugins {
	plugins?: {
		plugins?: Record<string, unknown>;
	};
}

export interface AppWithSettingsUI {
	setting?: {
		close: () => void;
	};
	openWithDefaultApp?: (path: string) => void | Promise<void>;
}

export interface AppWithMobileNavbar {
	mobileNavbar?: {
		ribbonMenuItemEl?: HTMLElement;
	};
}

// --- Workspace augmentations ---

export interface WorkspaceWithRibbon {
	leftRibbon?: {
		items?: RibbonItemBase[];
	};
}

export interface WorkspaceRibbonLike {
	leftRibbon?: {
		ribbonItemsEl?: HTMLElement;
	};
}

export interface WorkspaceLeafWithElements {
	containerEl?: HTMLElement;
	tabHeaderInnerIconEl?: HTMLElement;
	tabHeaderEl?: HTMLElement;
	parent?: {
		isStacked?: boolean;
	};
}

// Superset of the two inline WorkspaceSplitWithMobileTabs interfaces that
// previously lived in IconPalettePlugin.ts and TabIconManager.ts. All members
// are optional, so each cast site sees the members it needs and ignores the
// rest; merging is behaviour-preserving.
export interface WorkspaceSplitWithMobileTabs {
	activeTabContentEl?: HTMLElement;
	activeTabIconEl?: HTMLElement;
	activeTabSelectEl?: HTMLElement;
	activeTabHeaderEl?: HTMLElement;
}

export interface WorkspaceWithMobileSplits {
	leftSplit?: WorkspaceSplitWithMobileTabs;
	rightSplit?: WorkspaceSplitWithMobileTabs;
}

// --- Metadata cache and vault augmentations ---

export interface MetadataCacheWithTags {
	getTags(): Record<string, number>;
}

export interface VaultWithConfig {
	getConfig?: (key: string) => string | null;
}
