export interface SelectionAnchor {
    startBlockKey: string;
    startOffset: number;
    endBlockKey: string;
    endOffset: number;
    text: string;
}

/** 표 컨테이너(data-block-type="TABLE")가 아닌 가장 가까운 블록 요소 */
function blockOf(node: Node, root: HTMLElement): HTMLElement | null {
    let el: Element | null = node instanceof Element ? node : node.parentElement;
    while (el && el !== root) {
        if (el instanceof HTMLElement && el.dataset.blockKey && el.dataset.blockType !== "TABLE") return el;
        el = el.parentElement;
    }
    return null;
}

/** 블록 시작부터 (container, offset)까지의 글자 수 — 단어·마킹 span 이 중첩돼도 블록 텍스트 기준 */
function offsetIn(block: HTMLElement, container: Node, offset: number): number {
    const r = document.createRange();
    r.setStart(block, 0);
    r.setEnd(container, offset);
    return r.toString().length;
}

/** 브라우저 선택 → 블록 키·오프셋. 접힌 선택, root 밖, 블록이 아닌 곳에 걸친 선택은 null */
export function rangeToAnchor(range: Range, root: HTMLElement): SelectionAnchor | null {
    if (range.collapsed || !root.contains(range.commonAncestorContainer)) return null;
    const startBlock = blockOf(range.startContainer, root);
    const endBlock = blockOf(range.endContainer, root);
    if (!startBlock || !endBlock) return null;
    const text = range.toString();
    if (!text.trim()) return null;
    return {
        startBlockKey: startBlock.dataset.blockKey as string,
        startOffset: offsetIn(startBlock, range.startContainer, range.startOffset),
        endBlockKey: endBlock.dataset.blockKey as string,
        endOffset: offsetIn(endBlock, range.endContainer, range.endOffset),
        text,
    };
}
