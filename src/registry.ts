// Runtime registries and constants, extracted from IconPalettePlugin.ts. These
// carry no dependency on the lifecycle class, so importing them from here (not
// from the entry file) breaks the runtime back-cycle to the plugin.

import EMOJIS from 'src/Emojis.js';
import STRINGS from 'src/Strings.js';

/**
 * Icon registry, populated during plugin load from the icon libraries.
 */
export const ICONS = new Map<string, string>();

export { EMOJIS, STRINGS };

// Plugin tabs that contain a file, but should still display a tab-specific icon
export const PLUGIN_TAB_TYPES = [
	'backlink',
	'file-properties',
	'footnotes',
	'outgoing-link',
	'outline',
];
