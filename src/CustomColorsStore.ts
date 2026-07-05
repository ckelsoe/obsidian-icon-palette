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
		return colors.some(c => CustomColorsStore.normalize(c) === key);
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
		const existingIndex = colors.findIndex(c => CustomColorsStore.normalize(c) === key);
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
		const index = colors.findIndex(c => CustomColorsStore.normalize(c) === key);
		if (index < 0) return false;

		colors.splice(index, 1);
		return true;
	}
}
