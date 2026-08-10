/**
 * Pure logic for the custom color palette: a capped, most-recently-saved-first
 * list of user-saved colors (hex swatches). No Obsidian imports, so the dedup /
 * ordering / cap rules are unit-testable in isolation, in the same pure-store
 * style as FavoritesStore (though `save` enforces the cap unconditionally, so
 * the behavior is not identical to FavoritesStore.recordRecent). The IconPicker
 * color menu and the settings tab call these and render the result; all list
 * mutation lives here.
 *
 * Every mutator returns whether the state changed, so the caller saves settings
 * only when needed.
 */
export default class CustomColorsStore {
	/**
	 * How many saved colors to keep. Older entries past the cap are dropped when a
	 * new color is saved.
	 */
	static readonly CAP = 12;

	/**
	 * Identity key for a color. Two colors are the same swatch when their trimmed,
	 * lowercased strings match, so `#AABBCC` and `#aabbcc` collapse to one entry.
	 * The only writer is Obsidian's color picker, which emits hex, so no
	 * rgb()/hex canonicalization is needed.
	 */
	static normalize(color: string): string {
		return color.trim().toLowerCase();
	}

	/**
	 * Whether the list already contains this color, compared case-insensitively.
	 */
	static has(colors: string[], color: string): boolean {
		const key = CustomColorsStore.normalize(color);
		return colors.some((c) => CustomColorsStore.normalize(c) === key);
	}

	/**
	 * Save a color at the front of the list, most-recent-first. An existing entry
	 * is moved to the front rather than duplicated; if it is already at the front
	 * and the list is within `cap` this is a no-op, but an over-cap list is still
	 * trimmed. The raw string is stored (so the swatch renders the user's exact
	 * value) while dedup compares normalized keys. The list is trimmed to `cap`.
	 */
	static save(colors: string[], color: string, cap: number): boolean {
		const key = CustomColorsStore.normalize(color);
		const existingIndex = colors.findIndex(
			(c) => CustomColorsStore.normalize(c) === key,
		);
		// Clamp: a non-positive cap trims to empty rather than throwing a
		// RangeError on a negative array length.
		const max = Math.max(0, cap);

		// Already at the front: nothing to reorder, but still enforce the cap so an
		// over-cap list (a lowered cap or a hand-edited data.json) is shrunk here
		// rather than left oversized.
		if (existingIndex === 0) {
			if (colors.length > max) {
				colors.length = max;
				return true;
			}
			return false;
		}

		if (existingIndex > 0) colors.splice(existingIndex, 1);
		colors.unshift(color);
		if (colors.length > max) colors.length = max;
		return true;
	}

	/**
	 * Remove a color from the list. No-op if it is not present.
	 */
	static remove(colors: string[], color: string): boolean {
		const key = CustomColorsStore.normalize(color);
		const index = colors.findIndex(
			(c) => CustomColorsStore.normalize(c) === key,
		);
		if (index < 0) return false;

		colors.splice(index, 1);
		return true;
	}

	/**
	 * The descriptive name a user gave a color, or `''` if it has none. Names live
	 * in a map parallel to the color list, keyed by the same normalized color, so
	 * lookup is case-insensitive and stays valid when a swatch's stored casing
	 * changes on re-save.
	 */
	static getName(names: Record<string, string>, color: string): string {
		const key = CustomColorsStore.normalize(color);
		// Own-property + type guard: a color that normalizes to an inherited key
		// (e.g. "constructor") must not return Object.prototype's value, which would
		// hand the icon-picker menu a non-string title.
		const value = Object.prototype.hasOwnProperty.call(names, key)
			? names[key]
			: undefined;
		return typeof value === 'string' ? value : '';
	}

	/**
	 * Set (or clear) a color's descriptive name. A blank/whitespace name deletes
	 * the key rather than storing `''`, so an unnamed color leaves no entry to
	 * prune later. Returns whether the map changed, matching the mutator
	 * convention on the list methods above, so the caller saves only when needed.
	 */
	static setName(
		names: Record<string, string>,
		color: string,
		name: string,
	): boolean {
		const key = CustomColorsStore.normalize(color);
		const trimmed = name.trim();
		// Own-property checks so an inherited key (e.g. "constructor") is treated as
		// absent, mirroring getName.
		const has = Object.prototype.hasOwnProperty.call(names, key);
		if (trimmed === '') {
			if (!has) return false;
			delete names[key];
			return true;
		}
		if (has && names[key] === trimmed) return false;
		// defineProperty, not `names[key] = trimmed`: a key normalizing to
		// "__proto__" would otherwise invoke the inherited setter and never store an
		// own property. This forces a plain own data property for any key.
		Object.defineProperty(names, key, {
			value: trimmed,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		return true;
	}

	/**
	 * Drop any name whose color is no longer in the list, so a color that was
	 * removed or evicted past the cap cannot strand its name. Call after `save`
	 * (which trims silently) and after `remove`. Returns whether the map changed.
	 */
	static pruneNames(
		colors: string[],
		names: Record<string, string>,
	): boolean {
		const live = new Set(colors.map((c) => CustomColorsStore.normalize(c)));
		let changed = false;
		for (const key of Object.keys(names)) {
			if (!live.has(key)) {
				delete names[key];
				changed = true;
			}
		}
		return changed;
	}
}
