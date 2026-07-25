import { ExtraButtonComponent, Platform, PluginSettingTab, Setting, SettingGroup, type SettingDefinitionItem } from 'obsidian';
import IconPalettePlugin from 'src/IconPalettePlugin.js';
import type { FileItem } from 'src/types.js';
import { STRINGS } from 'src/registry.js';
import type { AppWithSettingsUI } from 'src/obsidian-internals.js';
import RulePicker from 'src/dialogs/RulePicker.js';
import UsageChecker from 'src/dialogs/UsageChecker.js';
import ColorUtils from 'src/ColorUtils.js';
import CustomColorsStore from 'src/CustomColorsStore.js';

/**
 * Exposes UI settings for the plugin.
 *
 * Dual-support (per the workspace `dual-support-settings-playbook`): Obsidian
 * 1.13+ calls getSettingDefinitions() and renders the declarative path, which
 * makes every setting findable in the global settings search. Obsidian < 1.13
 * has never heard of that method and calls display(), the imperative path. Both
 * paths route value changes through applyControlChange() so coercion and side
 * effects cannot drift. SettingDefinitionItem is imported type-only and never
 * appears in main.js, so the bundle stays clean for the 1.11.0 floor.
 */
export default class IconPaletteSettingTab extends PluginSettingTab {
	private readonly plugin: IconPalettePlugin;
	private readonly indicators = {
		biggerIcons: undefined as unknown,
		clickableIcons: undefined as unknown,
		showItemName: undefined as unknown,
		biggerSearchResults: undefined as unknown,
		colorPicker1: undefined as unknown,
		colorPicker2: undefined as unknown,
	} as Record<string, ExtraButtonComponent>;
	public icon = 'lucide-images';

	constructor(plugin: IconPalettePlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	// The four-way visibility dropdowns (on/desktop/mobile/off) share one option
	// map across both settings paths.
	private platformOptions(): Record<string, string> {
		return {
			on: STRINGS.settings.values.on,
			desktop: STRINGS.settings.values.desktop,
			mobile: STRINGS.settings.values.mobile,
			off: STRINGS.settings.values.off,
		};
	}

	private colorModeOptions(): Record<string, string> {
		return {
			list: STRINGS.settings.values.list,
			rgb: STRINGS.settings.values.rgb,
		};
	}

	private maxBackupsOptions(): Record<string, string> {
		return {
			'0': STRINGS.settings.values.none,
			'1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
			'6': '6', '7': '7', '8': '8', '9': '9',
		};
	}

	/**
	 * Declarative settings for Obsidian 1.13+. Returning object literals keeps the
	 * 1.13 types out of the runtime bundle; buttons and the saved-colors grid have
	 * no declarative control equivalent, so they render imperatively and are not
	 * search-indexable. Mirrors display() setting-for-setting.
	 */
	getSettingDefinitions(): SettingDefinitionItem[] {
		const S = STRINGS.settings;
		return [
			// Ungrouped top settings.
			{
				name: S.rulebook.name,
				desc: S.rulebook.desc,
				searchable: false,
				render: (setting: Setting) => this.renderRulesButton(setting),
			},
			{
				name: S.biggerIcons.name,
				desc: S.biggerIcons.desc,
				control: { type: 'dropdown', key: 'biggerIcons', options: this.platformOptions() },
			},
			{
				name: Platform.isDesktop ? S.clickableIcons.nameDesktop : S.clickableIcons.nameMobile,
				desc: Platform.isDesktop ? S.clickableIcons.descDesktop : S.clickableIcons.descMobile,
				control: { type: 'dropdown', key: 'clickableIcons', options: this.platformOptions() },
			},
			{
				type: 'group',
				heading: S.headingSidebarsAndTabs,
				items: [
					{ name: S.showAllFileIcons.name, desc: S.showAllFileIcons.desc, control: { type: 'toggle', key: 'showAllFileIcons' } },
					{ name: S.showAllFolderIcons.name, desc: S.showAllFolderIcons.desc, control: { type: 'toggle', key: 'showAllFolderIcons' } },
					{ name: S.minimalFolderIcons.name, desc: S.minimalFolderIcons.desc, control: { type: 'toggle', key: 'minimalFolderIcons' } },
					{ name: S.showMarkdownTabIcons.name, desc: S.showMarkdownTabIcons.desc, control: { type: 'toggle', key: 'showMarkdownTabIcons' } },
				],
			},
			{
				type: 'group',
				heading: S.headingEditor,
				items: [
					{ name: S.showTitleIcons.name, desc: S.showTitleIcons.desc, control: { type: 'toggle', key: 'showTitleIcons' } },
					{ name: S.showTagPillIcons.name, desc: S.showTagPillIcons.desc, control: { type: 'toggle', key: 'showTagPillIcons' } },
				],
			},
			{
				type: 'group',
				heading: S.headingMenusAndDialogs,
				items: [
					{ name: S.showMenuActions.name, desc: S.showMenuActions.desc, control: { type: 'toggle', key: 'showMenuActions' } },
					{ name: S.showSuggestionIcons.name, desc: S.showSuggestionIcons.desc, control: { type: 'toggle', key: 'showSuggestionIcons' } },
					{ name: S.showQuickSwitcherIcons.name, desc: S.showQuickSwitcherIcons.desc, control: { type: 'toggle', key: 'showQuickSwitcherIcons' } },
					{ name: S.showMoveFileIcons.name, desc: S.showMoveFileIcons.desc, control: { type: 'toggle', key: 'showMoveFileIcons' } },
				],
			},
			{
				type: 'group',
				heading: S.headingIconPicker,
				items: [
					{ name: S.showItemName.name, desc: S.showItemName.desc, control: { type: 'dropdown', key: 'showItemName', options: this.platformOptions() } },
					{ name: S.biggerSearchResults.name, desc: S.biggerSearchResults.desc, control: { type: 'dropdown', key: 'biggerSearchResults', options: this.platformOptions() } },
					{ name: S.maxSearchResults.name, desc: S.maxSearchResults.desc, control: { type: 'slider', key: 'maxSearchResults', min: 10, max: 300, step: 10 } },
					{ name: S.colorPicker1.name, desc: Platform.isDesktop ? S.colorPicker1.descDesktop : S.colorPicker1.descMobile, control: { type: 'dropdown', key: 'colorPicker1', options: this.colorModeOptions() } },
					{ name: S.colorPicker2.name, desc: Platform.isDesktop ? S.colorPicker2.descDesktop : S.colorPicker2.descMobile, control: { type: 'dropdown', key: 'colorPicker2', options: this.colorModeOptions() } },
				],
			},
			{
				type: 'group',
				heading: S.headingSavedColors,
				items: [
					{ name: '', searchable: false, render: (setting: Setting) => this.renderSavedColors(setting) },
				],
			},
			{
				type: 'group',
				heading: S.headingAdvanced,
				items: [
					{ name: S.uncolorHover.name, desc: S.uncolorHover.desc, control: { type: 'toggle', key: 'uncolorHover' } },
					{ name: S.uncolorDrag.name, desc: S.uncolorDrag.desc, control: { type: 'toggle', key: 'uncolorDrag' } },
					{ name: S.uncolorSelect.name, desc: S.uncolorSelect.desc, control: { type: 'toggle', key: 'uncolorSelect' } },
					{ name: S.uncolorQuick.name, desc: S.uncolorQuick.desc, control: { type: 'toggle', key: 'uncolorQuick' } },
					{ name: S.viewUnusedIcons.name, desc: S.viewUnusedIcons.desc, searchable: false, render: (setting: Setting) => this.renderViewUnusedIcons(setting) },
					// The desktop-only "open plugin folder" shortcut has no declarative
					// control slot; it stays on the imperative path. The value itself is
					// the searchable dropdown here.
					{ name: S.maxBackups.name, desc: S.maxBackups.desc, control: { type: 'dropdown', key: 'maxBackups', options: this.maxBackupsOptions() } },
				],
			},
			{
				name: '',
				searchable: false,
				render: (setting: Setting) => this.renderFooter(setting.settingEl),
			},
		];
	}

	/**
	 * Reads a settings value for a declarative control. maxBackups is stored as a
	 * number but its dropdown deals in string keys, so it is stringified at the
	 * boundary; every other value is returned as stored.
	 */
	getControlValue(key: string): unknown {
		if (key === 'maxBackups') return String(this.plugin.settings.maxBackups);
		return (this.plugin.settings as unknown as Record<string, unknown>)[key];
	}

	setControlValue(key: string, value: unknown): void | Promise<void> {
		return this.applyControlChange(key, value);
	}

	/**
	 * Coerces and persists a single settings change, then runs its side effect.
	 * Shared by the declarative setControlValue() (1.13+) and the imperative
	 * onChange handlers in display() (< 1.13), so neither path can drift.
	 */
	private async applyControlChange(key: string, value: unknown): Promise<void> {
		const settings = this.plugin.settings as unknown as Record<string, unknown>;
		if (key === 'maxBackups') {
			settings.maxBackups = Number(value) || 0;
		} else if (key === 'maxSearchResults') {
			settings.maxSearchResults = Number(value);
		} else {
			settings[key] = value;
		}
		await this.plugin.saveSettings();
		this.runSideEffect(key);
	}

	/**
	 * Applies the same refresh a setting triggered on the imperative path.
	 */
	private runSideEffect(key: string): void {
		switch (key) {
			case 'biggerIcons':
			case 'showMarkdownTabIcons':
			case 'biggerSearchResults':
			case 'uncolorHover':
			case 'uncolorDrag':
			case 'uncolorSelect':
				this.plugin.refreshBody();
				break;
			case 'clickableIcons':
				this.plugin.refreshManagers();
				this.plugin.refreshBody();
				break;
			case 'showAllFileIcons':
			case 'showTitleIcons':
				this.plugin.refreshManagers('file');
				break;
			case 'showAllFolderIcons':
			case 'minimalFolderIcons':
				this.plugin.refreshManagers('folder');
				break;
			case 'showTagPillIcons':
				this.plugin.refreshManagers('tag');
				break;
			case 'showMenuActions':
				this.plugin.refreshManagers();
				break;
			case 'uncolorQuick':
				this.plugin.refreshManagers('ribbon');
				break;
			default:
				break;
		}
	}

	/**
	 * @override
	 */
	display(): void {
		this.containerEl.empty();

		// GROUP: Top
		const groupTop = new SettingGroup(this.containerEl);

		// SETTING: Rules
		groupTop.addSetting(setting => void setting
			.setName(STRINGS.settings.rulebook.name)
			.setDesc(STRINGS.settings.rulebook.desc)
			.addButton(button => { button
				.setButtonText(STRINGS.settings.manage)
				.onClick(() => this.openRulePicker());
			})
		);

		// SETTING: Bigger icons
		groupTop.addSetting(setting => void setting
			.setName(STRINGS.settings.biggerIcons.name)
			.setDesc(STRINGS.settings.biggerIcons.desc)
			.addExtraButton(indicator => {
				indicator.extraSettingsEl.addClass('icon-palette-indicator');
				this.indicators.biggerIcons = indicator;
			})
			.addDropdown(dropdown => { dropdown
				.addOption('on', STRINGS.settings.values.on)
				.addOption('desktop', STRINGS.settings.values.desktop)
				.addOption('mobile', STRINGS.settings.values.mobile)
				.addOption('off', STRINGS.settings.values.off)
				.setValue(this.plugin.settings.biggerIcons)
				.onChange(value => {
					this.refreshIndicator(this.indicators.biggerIcons, value);
					void this.applyControlChange('biggerIcons', value);
				});
				this.refreshIndicator(this.indicators.biggerIcons, dropdown.getValue());
			})
		);

		// SETTING: Clickable icons
		groupTop.addSetting(setting => void setting
			.setName(Platform.isDesktop
				? STRINGS.settings.clickableIcons.nameDesktop
				: STRINGS.settings.clickableIcons.nameMobile
			)
			.setDesc(Platform.isDesktop
				? STRINGS.settings.clickableIcons.descDesktop
				: STRINGS.settings.clickableIcons.descMobile
			)
			.addExtraButton(indicator => {
				indicator.extraSettingsEl.addClass('icon-palette-indicator');
				this.indicators.clickableIcons = indicator;
			})
			.addDropdown(dropdown => { dropdown
				.addOption('on', STRINGS.settings.values.on)
				.addOption('desktop', STRINGS.settings.values.desktop)
				.addOption('mobile', STRINGS.settings.values.mobile)
				.addOption('off', STRINGS.settings.values.off)
				.setValue(this.plugin.settings.clickableIcons)
				.onChange(value => {
					this.refreshIndicator(this.indicators.clickableIcons, value);
					void this.applyControlChange('clickableIcons', value);
				});
				this.refreshIndicator(this.indicators.clickableIcons, dropdown.getValue());
			})
		);

		// GROUP: Sidebars & tabs
		const groupSidebarsAndTabs = new SettingGroup(this.containerEl)
			.setHeading(STRINGS.settings.headingSidebarsAndTabs);

		// SETTING: Show all file icons
		groupSidebarsAndTabs.addSetting(setting => void setting
			.setName(STRINGS.settings.showAllFileIcons.name)
			.setDesc(STRINGS.settings.showAllFileIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showAllFileIcons)
				.onChange(value => void this.applyControlChange('showAllFileIcons', value))
			)
		);

		// SETTING: Show all folder icons
		groupSidebarsAndTabs.addSetting(setting => void setting
			.setName(STRINGS.settings.showAllFolderIcons.name)
			.setDesc(STRINGS.settings.showAllFolderIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showAllFolderIcons)
				.onChange(value => void this.applyControlChange('showAllFolderIcons', value))
			)
		);

		// SETTING: Minimal folder icons
		groupSidebarsAndTabs.addSetting(setting => void setting
			.setName(STRINGS.settings.minimalFolderIcons.name)
			.setDesc(STRINGS.settings.minimalFolderIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.minimalFolderIcons)
				.onChange(value => void this.applyControlChange('minimalFolderIcons', value))
			)
		);

		// SETTING: Show Markdown tab icons
		groupSidebarsAndTabs.addSetting(setting => void setting
			.setName(STRINGS.settings.showMarkdownTabIcons.name)
			.setDesc(STRINGS.settings.showMarkdownTabIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showMarkdownTabIcons)
				.onChange(value => void this.applyControlChange('showMarkdownTabIcons', value))
			)
		);

		// GROUP: Editor
		const groupEditor = new SettingGroup(this.containerEl)
			.setHeading(STRINGS.settings.headingEditor);

		// SETTING: Show title icons
		groupEditor.addSetting(setting => void setting
			.setName(STRINGS.settings.showTitleIcons.name)
			.setDesc(STRINGS.settings.showTitleIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTitleIcons)
				.onChange(value => void this.applyControlChange('showTitleIcons', value))
			)
		);

		// SETTING: Show tag pill icons
		groupEditor.addSetting(setting => void setting
			.setName(STRINGS.settings.showTagPillIcons.name)
			.setDesc(STRINGS.settings.showTagPillIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTagPillIcons)
				.onChange(value => void this.applyControlChange('showTagPillIcons', value))
			)
		);

		// GROUP: Menus & dialogs
		const groupMenusAndDialogs = new SettingGroup(this.containerEl)
			.setHeading(STRINGS.settings.headingMenusAndDialogs);

		// SETTING: Show menu actions
		groupMenusAndDialogs.addSetting(setting => void setting
			.setName(STRINGS.settings.showMenuActions.name)
			.setDesc(STRINGS.settings.showMenuActions.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showMenuActions)
				.onChange(value => void this.applyControlChange('showMenuActions', value))
			)
		);

		// SETTING: Show suggestion icons
		groupMenusAndDialogs.addSetting(setting => void setting
			.setName(STRINGS.settings.showSuggestionIcons.name)
			.setDesc(STRINGS.settings.showSuggestionIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showSuggestionIcons)
				.onChange(value => void this.applyControlChange('showSuggestionIcons', value))
			)
		);

		// SETTING: Show quick switcher icons
		groupMenusAndDialogs.addSetting(setting => void setting
			.setName(STRINGS.settings.showQuickSwitcherIcons.name)
			.setDesc(STRINGS.settings.showQuickSwitcherIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showQuickSwitcherIcons)
				.onChange(value => void this.applyControlChange('showQuickSwitcherIcons', value))
			)
		);

		// SETTING: Show "Move file" dialog icons
		groupMenusAndDialogs.addSetting(setting => void setting
			.setName(STRINGS.settings.showMoveFileIcons.name)
			.setDesc(STRINGS.settings.showMoveFileIcons.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showMoveFileIcons)
				.onChange(value => void this.applyControlChange('showMoveFileIcons', value))
			)
		);

		// GROUP: Icon picker
		const groupIconPicker = new SettingGroup(this.containerEl)
			.setHeading(STRINGS.settings.headingIconPicker);

		// SETTING: Show item name
		groupIconPicker.addSetting(setting => void setting
			.setName(STRINGS.settings.showItemName.name)
			.setDesc(STRINGS.settings.showItemName.desc)
			.addExtraButton(indicator => {
				indicator.extraSettingsEl.addClass('icon-palette-indicator');
				this.indicators.showItemName = indicator;
			})
			.addDropdown(dropdown => { dropdown
				.addOption('on', STRINGS.settings.values.on)
				.addOption('desktop', STRINGS.settings.values.desktop)
				.addOption('mobile', STRINGS.settings.values.mobile)
				.addOption('off', STRINGS.settings.values.off)
				.setValue(this.plugin.settings.showItemName)
				.onChange(value => {
					this.refreshIndicator(this.indicators.showItemName, value);
					void this.applyControlChange('showItemName', value);
				});
				this.refreshIndicator(this.indicators.showItemName, dropdown.getValue());
			})
		);

		// SETTING: Bigger search results
		groupIconPicker.addSetting(setting => void setting
			.setName(STRINGS.settings.biggerSearchResults.name)
			.setDesc(STRINGS.settings.biggerSearchResults.desc)
			.addExtraButton(indicator => {
				indicator.extraSettingsEl.addClass('icon-palette-indicator');
				this.indicators.biggerSearchResults = indicator;
			})
			.addDropdown(dropdown => { dropdown
				.addOption('on', STRINGS.settings.values.on)
				.addOption('desktop', STRINGS.settings.values.desktop)
				.addOption('mobile', STRINGS.settings.values.mobile)
				.addOption('off', STRINGS.settings.values.off)
				.setValue(this.plugin.settings.biggerSearchResults)
				.onChange(value => {
					this.refreshIndicator(this.indicators.biggerSearchResults, value);
					void this.applyControlChange('biggerSearchResults', value);
				});
				this.refreshIndicator(this.indicators.biggerSearchResults, dropdown.getValue());
			})
		);

		// SETTING: Maximum search results. Obsidian shows a slider's value inline on
		// 1.13+, but on the imperative (< 1.13) path the value was only visible via
		// setDynamicTooltip(), which is deprecated in 1.13 and cannot be used (the
		// marketplace scan rejects eslint-disable). Render our own readout so the
		// value stays visible on every version.
		groupIconPicker.addSetting(setting => {
			setting
				.setName(STRINGS.settings.maxSearchResults.name)
				.setDesc(STRINGS.settings.maxSearchResults.desc);
			let valueEl: HTMLElement | undefined;
			setting.addSlider(slider => slider
				.setLimits(10, 300, 10)
				.setValue(this.plugin.settings.maxSearchResults)
				.onChange(value => {
					valueEl?.setText(String(value));
					void this.applyControlChange('maxSearchResults', value);
				})
			);
			valueEl = setting.controlEl.createSpan({
				cls: 'icon-palette-slider-value',
				text: String(this.plugin.settings.maxSearchResults),
			});
		});

		// SETTING: Main color picker
		groupIconPicker.addSetting(setting => void setting
			.setName(STRINGS.settings.colorPicker1.name)
			.setDesc(Platform.isDesktop
				? STRINGS.settings.colorPicker1.descDesktop
				: STRINGS.settings.colorPicker1.descMobile
			)
			.addExtraButton(indicator => {
				indicator.extraSettingsEl.addClass('icon-palette-indicator');
				this.indicators.colorPicker1 = indicator;
			})
			.addDropdown(dropdown => { dropdown
				.addOption('list', STRINGS.settings.values.list)
				.addOption('rgb', STRINGS.settings.values.rgb)
				.setValue(this.plugin.settings.colorPicker1)
				.onChange(value => {
					this.refreshIndicator(this.indicators.colorPicker1, value);
					void this.applyControlChange('colorPicker1', value);
				});
				this.refreshIndicator(this.indicators.colorPicker1, dropdown.getValue());
			})
		);

		// SETTING: Second color picker
		groupIconPicker.addSetting(setting => void setting
			.setName(STRINGS.settings.colorPicker2.name)
			.setDesc(Platform.isDesktop
				? STRINGS.settings.colorPicker2.descDesktop
				: STRINGS.settings.colorPicker2.descMobile
			)
			.addExtraButton(indicator => {
				indicator.extraSettingsEl.addClass('icon-palette-indicator');
				this.indicators.colorPicker2 = indicator;
			})
			.addDropdown(dropdown => { dropdown
				.addOption('list', STRINGS.settings.values.list)
				.addOption('rgb', STRINGS.settings.values.rgb)
				.setValue(this.plugin.settings.colorPicker2)
				.onChange(value => {
					this.refreshIndicator(this.indicators.colorPicker2, value);
					void this.applyControlChange('colorPicker2', value);
				});
				this.refreshIndicator(this.indicators.colorPicker2, dropdown.getValue());
			})
		);

		// GROUP: Saved colors
		const groupSavedColors = new SettingGroup(this.containerEl)
			.setHeading(STRINGS.settings.headingSavedColors);
		const customColors = this.plugin.settings.customColors;

		// SETTING: Saved colors grid
		groupSavedColors.addSetting(setting => {
			setting.setDesc(customColors.length === 0
				? STRINGS.settings.savedColors.empty
				: STRINGS.settings.savedColors.desc
			);
			if (customColors.length === 0) return;

			// Full-width swatch grid below the description (stacked-row layout: this
			// plugin has no createStackedRow helper, so the setting row is switched
			// to block flow in styles.css and the grid appended under the info).
			setting.settingEl.addClass('icon-palette-saved-colors-row');
			const gridEl = setting.settingEl.createDiv({ cls: 'icon-palette-saved-colors' });
			this.appendSavedColorSwatches(gridEl, () => this.display());
		});

		// GROUP: Advanced
		const groupAdvanced = new SettingGroup(this.containerEl)
			.setHeading(STRINGS.settings.headingAdvanced);

		// SETTING: Colorless hover
		groupAdvanced.addSetting(setting => void setting
			.setName(STRINGS.settings.uncolorHover.name)
			.setDesc(STRINGS.settings.uncolorHover.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.uncolorHover)
				.onChange(value => void this.applyControlChange('uncolorHover', value))
			)
		);

		// SETTING: Colorless drag
		groupAdvanced.addSetting(setting => void setting
			.setName(STRINGS.settings.uncolorDrag.name)
			.setDesc(STRINGS.settings.uncolorDrag.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.uncolorDrag)
				.onChange(value => void this.applyControlChange('uncolorDrag', value))
			)
		);

		// SETTING: Colorless selection
		groupAdvanced.addSetting(setting => void setting
			.setName(STRINGS.settings.uncolorSelect.name)
			.setDesc(STRINGS.settings.uncolorSelect.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.uncolorSelect)
				.onChange(value => void this.applyControlChange('uncolorSelect', value))
			)
		);

		// SETTING: Colorless ribbon button
		groupAdvanced.addSetting(setting => void setting
			.setName(STRINGS.settings.uncolorQuick.name)
			.setDesc(STRINGS.settings.uncolorQuick.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.uncolorQuick)
				.onChange(value => void this.applyControlChange('uncolorQuick', value))
			)
		);

		// SETTING: View unused icons
		groupAdvanced.addSetting(setting => void setting
			.setName(STRINGS.settings.viewUnusedIcons.name)
			.setDesc(STRINGS.settings.viewUnusedIcons.desc)
			.addButton(button => button
				.setButtonText(STRINGS.settings.manage)
				.onClick(() => {
					void this.openUnusedIcons();
				})
			)
		);

		// SETTING: Maximum automatic backups
		groupAdvanced.addSetting(setting => void setting
			.setName(STRINGS.settings.maxBackups.name)
			.setDesc(STRINGS.settings.maxBackups.desc)
			.then(setting => {
				if (Platform.isDesktop) setting.addExtraButton(button => button
					.setIcon('lucide-folder-open')
					.setTooltip(STRINGS.settings.maxBackups.openPluginFolder)
					.onClick(() => {
						void (this.app as unknown as AppWithSettingsUI).openWithDefaultApp?.(this.plugin.manifest.dir ?? '');
					})
				)
			})
			.addDropdown(dropdown => dropdown
				.addOption('0', STRINGS.settings.values.none)
				.addOption('1', '1')
				.addOption('2', '2')
				.addOption('3', '3')
				.addOption('4', '4')
				.addOption('5', '5')
				.addOption('6', '6')
				.addOption('7', '7')
				.addOption('8', '8')
				.addOption('9', '9')
				.setValue(this.plugin.settings.maxBackups.toString())
				.onChange(value => void this.applyControlChange('maxBackups', value))
			)
		);

		// Footer: version + links, the same trailing row the workspace's other
		// plugins render (shell-path-copy settings-tab renderFooter, annoteca
		// settings renderFooter). Rendered into a Setting row's element like the
		// reference plugins, so it picks up the standard settings-item spacing.
		this.renderFooter(new Setting(this.containerEl).settingEl);
	}

	/**
	 * Opens the rulebook editor. Shared by both settings paths.
	 */
	private openRulePicker(): void {
		// Silently no-op if rulebook hasn't finished loading
		if (!this.plugin.ruleManager) return;
		(this.app as unknown as AppWithSettingsUI).setting?.close();
		RulePicker.open(this.plugin);
	}

	/**
	 * Declarative render for the rulebook button (1.13+ has no button control).
	 */
	private renderRulesButton(setting: Setting): void {
		setting.addButton(button => button
			.setButtonText(STRINGS.settings.manage)
			.onClick(() => this.openRulePicker())
		);
	}

	/**
	 * Declarative render for the "view unused icons" button.
	 */
	private renderViewUnusedIcons(setting: Setting): void {
		setting.addButton(button => button
			.setButtonText(STRINGS.settings.manage)
			.onClick(() => void this.openUnusedIcons())
		);
	}

	/**
	 * Declarative (1.13+) saved-colors row. A self-managing block that rebuilds its
	 * own DOM after a removal instead of calling this.display() (not the render path
	 * on 1.13) or this.update() (a 1.13-only API barred below the 1.11 floor).
	 */
	private renderSavedColors(setting: Setting): void {
		const host = setting.settingEl;
		host.empty();
		host.addClass('icon-palette-saved-colors-row');
		const customColors = this.plugin.settings.customColors;
		host.createDiv({
			cls: 'setting-item-description',
			text: customColors.length === 0
				? STRINGS.settings.savedColors.empty
				: STRINGS.settings.savedColors.desc,
		});
		if (customColors.length === 0) return;
		const gridEl = host.createDiv({ cls: 'icon-palette-saved-colors' });
		this.appendSavedColorSwatches(gridEl, () => this.renderSavedColors(setting));
	}

	/**
	 * Fills a grid element with removable saved-color swatches. Shared by both
	 * settings paths; onAfterRemove refreshes the surrounding UI (the imperative
	 * path re-renders the whole tab, the declarative row rebuilds in place).
	 */
	private appendSavedColorSwatches(gridEl: HTMLElement, onAfterRemove: () => void): void {
		const customColors = this.plugin.settings.customColors;
		for (const color of customColors) {
			const swatch = new ExtraButtonComponent(gridEl)
				.setIcon('lucide-paint-bucket')
				.setTooltip(STRINGS.settings.savedColors.removeTooltip.replace('{color}', color))
				.onClick(() => {
					if (CustomColorsStore.remove(customColors, color)) {
						void this.plugin.saveSettings();
						onAfterRemove();
					}
				});
			swatch.extraSettingsEl.addClass('icon-palette-saved-color');
			const svgEl = swatch.extraSettingsEl.find('svg');
			if (svgEl) svgEl.style.setProperty('color', ColorUtils.toRgb(color));
		}
	}

	/**
	 * Render the version + links footer as a trailing settings row, matching the
	 * other plugins in the workspace.
	 */
	private renderFooter(host: HTMLElement): void {
		host.empty();
		host.addClass('icon-palette-settings-footer');
		host.createSpan({ text: `${STRINGS.settings.footer.version.replace('{#}', this.plugin.manifest.version)} | ` });
		const link = (text: string, url: string): void => {
			host.createEl('a', { text, href: url, attr: { target: '_blank', rel: 'noopener' } });
		};
		link(STRINGS.settings.footer.github, 'https://github.com/ckelsoe/obsidian-icon-palette');
		host.createSpan({ text: ' | ' });
		link(STRINGS.settings.footer.reportIssues, 'https://github.com/ckelsoe/obsidian-icon-palette/issues');
	}

	private async openUnusedIcons(): Promise<void> {
		const unusedIcons: FileItem[] = [];
		for (const fileId of Object.keys(this.plugin.settings.fileIcons)) {
			if (!await this.app.vault.adapter.exists(fileId)) {
				const file = this.plugin.getFileItem(fileId);
				unusedIcons.push(file);
			}
		}
		UsageChecker.open(this.plugin, unusedIcons);
	}

	/**
	 * Change a dropdown indicator icon.
	 */
	private refreshIndicator(indicator: ExtraButtonComponent | undefined, value: string): void {
		if (!indicator) return;
		switch (value) {
			case 'desktop': indicator.setIcon('lucide-monitor'); break;
			case 'mobile': indicator.setIcon('lucide-tablet-smartphone'); break;
			case 'list': indicator.setIcon('lucide-paint-bucket'); break;
			case 'rgb': indicator.setIcon('lucide-pipette'); break;
			default: indicator.extraSettingsEl.hide(); return;
		}
		indicator.extraSettingsEl.show();
	}
}
