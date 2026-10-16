import type { EditorView } from '@codemirror/view';

/**
 * Finds the elements of a #hashtag in a live preview editor, given the position
 * where its `#` starts.
 *
 * The position right after the `#` maps to the start of the tag name, not the
 * end of the `#`, so the lookup starts from the `#` itself. Another plugin can
 * wrap each part's text in an inner span (Pretty Properties adds
 * `.cm-hashtag-inner`), so the lookup walks up to the outer span.
 */
export function editorHashtagEls(
	view: EditorView,
	from: number,
): { beginEl: Element; endEl: Element } | null {
	const { node, offset } = view.domAtPos(from);
	// A text node, or an element and the index of the child at `from`.
	const at =
		node.nodeType === Node.TEXT_NODE
			? node
			: (node.childNodes[offset] ?? node);
	const startEl = isElement(at) ? at : at.parentElement;
	const beginEl = startEl?.closest(
		'.cm-hashtag-begin:not(.cm-hashtag-inner)',
	);
	const endEl = beginEl?.nextElementSibling;
	if (!beginEl || !endEl?.classList.contains('cm-hashtag-end')) return null;
	return { beginEl, endEl };
}

// By node type rather than `instanceof`, which fails for nodes in a popout
// window (each window has its own Element class).
function isElement(node: Node): node is Element {
	return node.nodeType === Node.ELEMENT_NODE;
}

/**
 * The element a hashtag part's icon and pill styling belong in: its inner span
 * when another plugin added one, so the icon sits inside the pill.
 */
export function hashtagPillEl(el: Element): Element {
	return el.querySelector(':scope > .cm-hashtag-inner') ?? el;
}

const KANBAN_FOOTER_TAG = 'a.tag.kanban-plugin__item-tag';

/**
 * Tags the Kanban plugin draws itself, in a card's footer, when its "Move tags
 * to card footer" setting is on. Tags left in the card text are rendered by
 * Obsidian and styled by the reading mode post processor instead.
 */
export function kanbanFooterTagEls(root: Element): Element[] {
	return Array.from(root.querySelectorAll(KANBAN_FOOTER_TAG));
}

/**
 * The Kanban footer tags a batch of DOM changes added or changed: tags added
 * themselves or inside an added card, and tags whose own children changed (a
 * redraw that dropped an icon). Everything else on the board is left alone, so
 * dragging cards does not restyle every tag on every move.
 */
export function kanbanFooterTagsIn(
	mutations: readonly MutationRecord[],
): Element[] {
	const found = new Set<Element>();
	for (const mutation of mutations) {
		if (
			isElement(mutation.target) &&
			mutation.target.matches(KANBAN_FOOTER_TAG)
		)
			found.add(mutation.target);
		for (const node of Array.from(mutation.addedNodes)) {
			if (!isElement(node)) continue;
			if (node.matches(KANBAN_FOOTER_TAG)) found.add(node);
			for (const el of kanbanFooterTagEls(node)) found.add(el);
		}
	}
	return Array.from(found).filter((el) => el.isConnected);
}
