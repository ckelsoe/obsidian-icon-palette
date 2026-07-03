import { ButtonComponent, Modal, Setting } from 'obsidian';
import IconPalettePlugin from 'src/IconPalettePlugin.js';
import type { Category, FileItem } from 'src/types.js';
import { STRINGS } from 'src/registry.js';
import PathListComponent from 'src/components/PathListComponent.js';
import IconPicker from 'src/dialogs/IconPicker.js';

/**
 * Dialog for previewing the items matched by a rule.
 */
export default class RuleChecker extends Modal {
	private readonly plugin: IconPalettePlugin;
	private readonly page: Category;
	private readonly matches: FileItem[];

	private constructor(plugin: IconPalettePlugin, page: Category, matches: FileItem[]) {
		super(plugin.app);
		this.plugin = plugin;
		this.page = page;
		this.matches = matches;

		// Allow hotkeys in dialog
		this.plugin.registerDialogHotkeys(this.scope);
	}

	/**
	 * Open a dialog to preview a list of matches.
	 */
	static open(plugin: IconPalettePlugin, page: Category, matches: FileItem[]): void {
		new RuleChecker(plugin, page, matches).open();
	}

	/**
	 * @override
	 */
	onOpen(): void {
		this.containerEl.addClass('mod-confirmation');
		this.modalEl.addClass('icon-palette-rule-checker');
		this.contentEl.addClass('icon-palette-highlight-tree');

		switch (this.page) {
			case 'file': {
				this.setTitle(this.matches.length === 1
					? STRINGS.ruleChecker.fileMatch
					: STRINGS.ruleChecker.filesMatch.replace('{#}', this.matches.length.toString())
				);
				break;
			}
			case 'folder': {
				this.setTitle(this.matches.length === 1
					? STRINGS.ruleChecker.folderMatch
					: STRINGS.ruleChecker.foldersMatch.replace('{#}', this.matches.length.toString())
				);
			}
		}

		// BUTTONS: Highlight
		const buttons: ButtonComponent[] = [];
		new Setting(this.contentEl).setName(STRINGS.ruleChecker.highlight)
			.addButton(button => { button
				.setButtonText(STRINGS.ruleEditor.source.tree)
				.onClick(() => {
					buttons.forEach(button => button.buttonEl.removeClass('icon-palette-button-selected'));
					button.buttonEl.addClass('icon-palette-button-selected');
					this.contentEl.addClass('icon-palette-highlight-tree');
					this.contentEl.removeClasses(['icon-palette-highlight-name', 'icon-palette-highlight-extension']);
				});
				button.buttonEl.addClass('icon-palette-button-selected');
				buttons.push(button);
			})
			.addButton(button => { button
				.setButtonText(STRINGS.ruleEditor.source.name)
				.onClick(() => {
					buttons.forEach(button => button.buttonEl.removeClass('icon-palette-button-selected'));
					button.buttonEl.addClass('icon-palette-button-selected');
					this.contentEl.removeClasses(['icon-palette-highlight-tree', 'icon-palette-highlight-extension']);
					this.contentEl.addClass('icon-palette-highlight-name');
				});
				buttons.push(button);
			})
			.addButton(button => { button
				.setButtonText(STRINGS.ruleEditor.source.extension)
				.setDisabled(this.page !== 'file')
				.onClick(() => {
					buttons.forEach(button => button.buttonEl.removeClass('icon-palette-button-selected'));
					button.buttonEl.addClass('icon-palette-button-selected');
					this.contentEl.removeClasses(['icon-palette-highlight-tree', 'icon-palette-highlight-name']);
					this.contentEl.addClass('icon-palette-highlight-extension');
				});
				buttons.push(button);
			});

		// LIST: Matches
		const pathList = new PathListComponent(this.contentEl);
		const defaultIcon = this.page === 'folder' ? 'lucide-folder' : 'lucide-file';
		for (const match of this.matches) {
			const { tree, basename, extension } = this.plugin.splitFilePath(match.id);
			const rule = this.plugin.ruleManager?.checkRuling(this.page, match.id) ?? match;
			pathList.addPath(path => path
				.setPathText(tree, basename, extension)
				.setIcon(rule.icon ?? defaultIcon)
				.setIconColor(rule.color ?? null)
				.setIconTooltip(STRINGS.iconPicker.changeIcon)
				.onIconClick(() => IconPicker.openSingle(this.plugin, match, (newIcon, newColor) => {
					this.plugin.saveFileIcon(match, newIcon, newColor);
					match.icon = newIcon;
					match.color = newColor;
					path.setIcon(newIcon ?? defaultIcon);
					path.setIconColor(newColor);
				}))
			);
		}
	}
}
