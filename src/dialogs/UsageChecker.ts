import { ButtonComponent, Modal, Setting } from 'obsidian';
import IconPalettePlugin from 'src/IconPalettePlugin.js';
import type { FileItem } from 'src/types.js';
import { STRINGS } from 'src/registry.js';
import PathListComponent from 'src/components/PathListComponent.js';
import IconPicker from 'src/dialogs/IconPicker.js';

/**
 * Dialog for viewing unused icons found in the data file.
 */
export default class UsageChecker extends Modal {
	private readonly plugin: IconPalettePlugin;
	private readonly unusedIcons: Set<FileItem>;

	// Components
	private pathList!: PathListComponent;

	private constructor(plugin: IconPalettePlugin, unusedIcons: FileItem[]) {
		super(plugin.app);
		this.plugin = plugin;
		this.unusedIcons = new Set(unusedIcons);

		// Allow hotkeys in dialog
		this.plugin.registerDialogHotkeys(this.scope);
	}

	/**
	 * Open a dialog to view a list of unused icons.
	 */
	static open(plugin: IconPalettePlugin, unusedIcons: FileItem[]): void {
		new UsageChecker(plugin, unusedIcons).open();
	}

	/**
	 * @override
	 */
	async onOpen(): Promise<void> {
		this.containerEl.addClass('mod-confirmation');
		this.modalEl.addClass('icon-palette-rule-checker');
		this.contentEl.addClass('icon-palette-highlight-tree');
		this.setTitle(STRINGS.usageChecker.unusedIcons);

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
				.onClick(() => {
					buttons.forEach(button => button.buttonEl.removeClass('icon-palette-button-selected'));
					button.buttonEl.addClass('icon-palette-button-selected');
					this.contentEl.removeClasses(['icon-palette-highlight-tree', 'icon-palette-highlight-name']);
					this.contentEl.addClass('icon-palette-highlight-extension');
				});
				buttons.push(button);
			});

		// LIST: Unused icons
		this.pathList = new PathListComponent(this.contentEl);
		for (const file of this.unusedIcons) {
			const { tree, basename, extension } = this.plugin.splitFilePath(file.id);
			this.pathList.addPath(path => path
				.setIcon(file.icon ?? null)
				.setIconColor(file.color ?? null)
				.setIconTooltip(STRINGS.iconPicker.changeIcon)
				.onIconClick(() => IconPicker.openSingle(this.plugin, file, (newIcon, newColor) => {
					this.plugin.saveFileIcon(file, newIcon, newColor);
					file.icon = newIcon;
					file.color = newColor;
					path.setIcon(newIcon);
					path.setIconColor(newColor);
				}))
				.setPathText(tree, basename, extension)
				.setRemoveTooltip(STRINGS.menu.removeIcon)
				.onRemoveClick(() => {
					this.plugin.saveFileIcon(file, null, null);
					this.unusedIcons.delete(file);
					path.pathEl.remove();
					if (this.unusedIcons.size === 0) this.addPlaceholderItem();
				})
			);
		}

		if (this.unusedIcons.size === 0) this.addPlaceholderItem();
	}

	private addPlaceholderItem(): void {
		this.pathList.addPath(path => path
			.setIcon('lucide-check')
			.setPathText('', STRINGS.usageChecker.noUnusedIconsFound)
			.setClass('icon-palette-placeholder')
		);
	}
}
