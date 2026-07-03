/**
 * Pure helpers for the path-keyed icon settings map (`settings.fileIcons`),
 * which stores both file and folder icons keyed by vault path. Obsidian fires a
 * single rename/delete event for a folder, not one per descendant, so the vault
 * handlers must re-key or prune every entry beneath the folder themselves;
 * otherwise a renamed folder's child icons orphan and a deleted folder's child
 * entries leak into settings.
 *
 * Kept free of Obsidian imports and generic over the value type so the logic is
 * unit-testable in isolation, matching the direction set by
 * RuleManager.evaluateOperator.
 */
export default class IconPathMap {
	/**
	 * Re-key the exact `oldPath` entry and every descendant keyed
	 * `<oldPath>/...` to sit under `newPath`. The trailing-slash boundary keeps
	 * a prefix-sibling (e.g. `Notes.md`, `Notes Archive/`) untouched when the
	 * folder `Notes` is renamed. Idempotent under a per-descendant event model:
	 * if the exact keys were already moved, the prefix scan finds nothing.
	 *
	 * @returns whether the map changed, so the caller saves settings only when needed.
	 */
	static rekeyDescendants<T>(map: Record<string, T>, oldPath: string, newPath: string): boolean {
		const prefix = oldPath + '/';
		// Remove each matching source as it is found, buffering its target, then
		// write the targets. Sources and targets are disjoint, so no target can
		// clobber a not-yet-moved source. Object.entries is a snapshot, so
		// deleting during the scan is safe.
		const moves: [to: string, value: T][] = [];
		for (const [key, value] of Object.entries(map)) {
			if (key === oldPath) {
				moves.push([newPath, value]);
				delete map[key];
			} else if (key.startsWith(prefix)) {
				moves.push([newPath + key.slice(oldPath.length), value]);
				delete map[key];
			}
		}
		for (const [to, value] of moves) {
			map[to] = value;
		}
		return moves.length > 0;
	}

	/**
	 * Delete the exact `path` entry and every descendant keyed `<path>/...`,
	 * using the same trailing-slash boundary as {@link rekeyDescendants}.
	 *
	 * @returns whether the map changed.
	 */
	static pruneDescendants<T>(map: Record<string, T>, path: string): boolean {
		const prefix = path + '/';
		let changed = false;
		for (const key of Object.keys(map)) {
			if (key === path || key.startsWith(prefix)) {
				delete map[key];
				changed = true;
			}
		}
		return changed;
	}
}
