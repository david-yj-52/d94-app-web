export function expandWord(text: string, offset: number): [number, number] | null {
    const isWord = (c: string) => /[A-Za-z'-]/.test(c);
    if (!text || offset < 0 || offset > text.length) return null;
    let start = Math.min(offset, text.length - 1), end = start + 1;
    if (!isWord(text[start]) && start > 0 && isWord(text[start - 1])) start--;
    if (!isWord(text[start])) return null;
    while (start > 0 && isWord(text[start - 1])) start--;
    while (end < text.length && isWord(text[end])) end++;
    while (start < end && !/[A-Za-z]/.test(text[start])) start++;
    while (end > start && !/[A-Za-z]/.test(text[end - 1])) end--;
    return start < end ? [start, end] : null;
}

export function wordAtPoint(x: number, y: number, root: HTMLElement): {word: string; rect: DOMRect} | null {
    const doc = root.ownerDocument;
    const pos = doc.caretPositionFromPoint?.(x, y);
    let node: Node | null = pos?.offsetNode ?? null;
    let offset = pos?.offset ?? 0;
    if (!node) {
        const range = doc.caretRangeFromPoint?.(x, y);
        node = range?.startContainer ?? null; offset = range?.startOffset ?? 0;
    }
    if (!node || !root.contains(node) || node.nodeType !== Node.TEXT_NODE) return null;
    const parent = node.parentElement;
    if (parent?.closest("[data-tip]")) return null;
    const text = node.textContent ?? "";
    const range = expandWord(text, offset);
    if (!range) return null;
    const wordRange = doc.createRange(); wordRange.setStart(node, range[0]); wordRange.setEnd(node, range[1]);
    const rect = wordRange.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    return {word: text.slice(...range).replace(/^[-']+|[-']+$/g, ""), rect};
}
