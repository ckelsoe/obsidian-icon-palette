import {
	AbstractInputSuggest,
	SearchMatches,
	TextComponent,
	prepareFuzzySearch,
} from 'obsidian';
import IconPalettePlugin from 'src/IconPalettePlugin.js';
import type RuleManager from 'src/managers/RuleManager.js';
import type { Category } from 'src/types.js';

interface RuleNameSuggestion {
	type: 'rule';
	matches: SearchMatches;
	score: number;
	text: string;
}

/**
 * Popover that suggests names for a rule.
 */
export default class RuleNameSuggest extends AbstractInputSuggest<RuleNameSuggestion> {
	private readonly ruleManager: RuleManager;
	private readonly page: Category;
	private readonly inputComponent: TextComponent;

	constructor(
		plugin: IconPalettePlugin,
		ruleManager: RuleManager,
		page: Category,
		inputComponent: TextComponent,
	) {
		super(plugin.app, inputComponent.inputEl);
		this.ruleManager = ruleManager;
		this.page = page;
		this.inputComponent = inputComponent;
	}

	/**
	 * @override
	 */
	protected getSuggestions(
		query: string,
	): RuleNameSuggestion[] | Promise<RuleNameSuggestion[]> {
		const currentName = this.inputComponent.getValue();
		const suggestions: RuleNameSuggestion[] = [];
		const fuzzySearch = prepareFuzzySearch(query);
		const rules = this.ruleManager.getRules(this.page);
		const names = new Set(rules.map((rule) => rule.name));

		for (const name of names) {
			// Skip suggestions that already match the current name
			if (name === currentName) continue;
			const result = fuzzySearch(name);
			if (result)
				suggestions.push({
					type: 'rule',
					matches: result.matches,
					score: result.score,
					text: name,
				});
		}

		// Sort by relevance, or else alphabetically
		suggestions.sort((a, b) => {
			if (a.score !== b.score) {
				return b.score - a.score; // Descending
			} else {
				return a.text.localeCompare(b.text); // Ascending
			}
		});

		return suggestions;
	}

	/**
	 * @override
	 */
	renderSuggestion(suggestion: RuleNameSuggestion, el: HTMLElement): void {
		el.setText(suggestion.text);
	}

	/**
	 * @override
	 */
	selectSuggestion(suggestion: RuleNameSuggestion): void {
		this.inputComponent.setValue(suggestion.text);
		this.inputComponent.onChanged();
		this.close();
	}
}
