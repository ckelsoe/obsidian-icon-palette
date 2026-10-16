/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import {
	editorHashtagEls,
	hashtagPillEl,
	kanbanFooterTagEls,
	kanbanFooterTagsIn,
} from '../src/HashtagDom.js';

// One element from HTML, attached to the document. Parsed rather than built
// with createElement, which Obsidian code avoids (its createDiv/createSpan are
// not in jsdom).
function el(html: string): HTMLElement {
	const parsed = new DOMParser().parseFromString(html, 'text/html').body
		.firstElementChild;
	if (!(parsed instanceof HTMLElement)) throw new Error(`not HTML: ${html}`);
	return document.body.appendChild(parsed);
}

// A real editor whose #hashtags are marked the way Obsidian's live preview
// marks them: a `.cm-hashtag-begin` span for `#` and a `.cm-hashtag-end` span
// for the name.
function editorWithTags(doc: string): EditorView {
	const builder = new RangeSetBuilder<Decoration>();
	for (const m of doc.matchAll(/#(\w+)/g)) {
		const at = m.index;
		builder.add(
			at,
			at + 1,
			Decoration.mark({ class: 'cm-hashtag cm-hashtag-begin' }),
		);
		builder.add(
			at + 1,
			at + m[0].length,
			Decoration.mark({ class: 'cm-hashtag cm-hashtag-end' }),
		);
	}
	const decorations = builder.finish();
	const parent = el('<div></div>');
	return new EditorView({
		state: EditorState.create({
			doc,
			extensions: EditorView.decorations.of(decorations),
		}),
		parent,
	});
}

describe('editorHashtagEls', () => {
	it('finds the # and name spans from where the tag starts', () => {
		const view = editorWithTags('Plain line with #iptest and #other here.');
		const els = editorHashtagEls(view, 16);
		expect(els?.beginEl.textContent).toBe('#');
		expect(els?.endEl.textContent).toBe('iptest');
		expect(editorHashtagEls(view, 28)?.endEl.textContent).toBe('other');
		view.destroy();
	});

	it('finds a tag at the very start of a line', () => {
		const view = editorWithTags('#first then text');
		expect(editorHashtagEls(view, 0)?.endEl.textContent).toBe('first');
		view.destroy();
	});

	it('finds the outer spans when another plugin wraps the text', () => {
		// Pretty Properties puts each part's text in a `.cm-hashtag-inner` span.
		const view = editorWithTags('Text #iptest end');
		for (const outer of Array.from(
			view.contentDOM.querySelectorAll('.cm-hashtag'),
		)) {
			const inner = el(
				`<span class="cm-hashtag-inner ${outer.className}"></span>`,
			);
			inner.append(...Array.from(outer.childNodes));
			outer.append(inner);
		}
		const els = editorHashtagEls(view, 5);
		expect(els?.beginEl.classList.contains('cm-hashtag-inner')).toBe(false);
		expect(els?.endEl.textContent).toBe('iptest');
		view.destroy();
	});

	it('is null where no tag starts', () => {
		const view = editorWithTags('No tags on this line');
		expect(editorHashtagEls(view, 3)).toBeNull();
		view.destroy();
	});
});

describe('hashtagPillEl', () => {
	it('is the inner span when there is one, else the element itself', () => {
		const outer = el('<span></span>');
		expect(hashtagPillEl(outer)).toBe(outer);
		const inner = el('<span class="cm-hashtag-inner"></span>');
		outer.append(inner);
		expect(hashtagPillEl(outer)).toBe(inner);
	});
});

// A Kanban card as the Kanban plugin draws it with "Move tags to card footer"
// on: the tags it draws itself sit in `.kanban-plugin__item-tags`; tags left in
// the card text are ordinary rendered `a.tag` links.
function kanbanCard(): HTMLElement {
	return el(
		'<div class="kanban-plugin__item">' +
			'<div class="markdown-rendered">Card <a href="#inline" class="tag">#inline</a></div>' +
			'<div class="kanban-plugin__item-tags">' +
			'<a href="#one" class="tag kanban-plugin__item-tag"><span>#</span>one</a>' +
			'<a href="#two" class="tag kanban-plugin__item-tag"><span>#</span>two</a>' +
			'</div>' +
			'</div>',
	);
}

describe('kanbanFooterTagEls', () => {
	it('finds footer tags only, not tags in the card text', () => {
		const tags = kanbanFooterTagEls(kanbanCard());
		expect(tags.map((t) => t.getAttribute('href'))).toEqual([
			'#one',
			'#two',
		]);
	});
});

describe('kanbanFooterTagsIn', () => {
	// Collect what a real MutationObserver reports for `change`.
	async function changedTags(
		board: HTMLElement,
		change: () => void,
	): Promise<string[]> {
		const records: MutationRecord[] = [];
		const observer = new MutationObserver((m) => records.push(...m));
		observer.observe(board, { childList: true, subtree: true });
		change();
		await Promise.resolve();
		records.push(...observer.takeRecords());
		observer.disconnect();
		return kanbanFooterTagsIn(records).map(
			(t) => t.getAttribute('href') ?? '',
		);
	}

	function board(): HTMLElement {
		return el('<div></div>');
	}

	it('reports the footer tags in an added card', async () => {
		const b = board();
		expect(await changedTags(b, () => b.append(kanbanCard()))).toEqual([
			'#one',
			'#two',
		]);
	});

	it('reports a footer tag whose icon was dropped by a redraw', async () => {
		const b = board();
		const card = kanbanCard();
		b.append(card);
		const tag = kanbanFooterTagEls(card)[1];
		const icon = el('<span></span>');
		tag?.prepend(icon);
		expect(await changedTags(b, () => icon.remove())).toEqual(['#two']);
	});

	it('ignores changes that touch no footer tag', async () => {
		const b = board();
		b.append(kanbanCard());
		expect(await changedTags(b, () => b.append(el('<div></div>')))).toEqual(
			[],
		);
	});

	it('skips tags already gone again by the time the batch is read', async () => {
		const b = board();
		expect(
			await changedTags(b, () => {
				const card = kanbanCard();
				b.append(card);
				card.remove();
			}),
		).toEqual([]);
	});
});
