import { describe, it, expect } from '@jest/globals';
import SuggestionDialogIconManager from '../src/managers/SuggestionDialogIconManager.js';

// isModalTypeEnabled is a pure static; unit-test it through a narrow typed
// handle so the decision is exercised without constructing a manager (the
// constructor patches SuggestModal.prototype). Mirrors the RuleManager test
// pattern. Call through a wrapper so it stays bound (satisfies unbound-method).
type Settings = {
	showQuickSwitcherIcons: boolean;
	showMoveFileIcons: boolean;
};
const SuggestionDialogIconManagerInternal =
	SuggestionDialogIconManager as unknown as {
		isModalTypeEnabled(modalType: string, settings: Settings): boolean;
	};
const isModalTypeEnabled = (modalType: string, settings: Settings): boolean =>
	SuggestionDialogIconManagerInternal.isModalTypeEnabled(modalType, settings);

// These mirror the private modal-type constants in the source module. The
// quick-switcher family shares one setting; the "Move file" dialog has its own.
const MOVE_FILE_DIALOG = 'mfd';
const QUICK_SWITCHERS = ['qs', 'qs++', 'aqs'];

describe('SuggestionDialogIconManager.isModalTypeEnabled', () => {
	it('gates the "Move file" dialog on showMoveFileIcons only', () => {
		expect(
			isModalTypeEnabled(MOVE_FILE_DIALOG, {
				showMoveFileIcons: true,
				showQuickSwitcherIcons: false,
			}),
		).toBe(true);
		expect(
			isModalTypeEnabled(MOVE_FILE_DIALOG, {
				showMoveFileIcons: false,
				showQuickSwitcherIcons: true,
			}),
		).toBe(false);
	});

	it('gates every quick switcher on showQuickSwitcherIcons only', () => {
		for (const modalType of QUICK_SWITCHERS) {
			expect(
				isModalTypeEnabled(modalType, {
					showQuickSwitcherIcons: true,
					showMoveFileIcons: false,
				}),
			).toBe(true);
			expect(
				isModalTypeEnabled(modalType, {
					showQuickSwitcherIcons: false,
					showMoveFileIcons: true,
				}),
			).toBe(false);
		}
	});

	it('does not let one enabled toggle light up the other dialog family', () => {
		// The bug this guards: a single global gate turned both families on when
		// either toggle was set. Each family must honor only its own setting.
		const quickOnly: Settings = {
			showQuickSwitcherIcons: true,
			showMoveFileIcons: false,
		};
		expect(isModalTypeEnabled(MOVE_FILE_DIALOG, quickOnly)).toBe(false);
		for (const modalType of QUICK_SWITCHERS) {
			expect(isModalTypeEnabled(modalType, quickOnly)).toBe(true);
		}

		const moveOnly: Settings = {
			showQuickSwitcherIcons: false,
			showMoveFileIcons: true,
		};
		expect(isModalTypeEnabled(MOVE_FILE_DIALOG, moveOnly)).toBe(true);
		for (const modalType of QUICK_SWITCHERS) {
			expect(isModalTypeEnabled(modalType, moveOnly)).toBe(false);
		}
	});
});
