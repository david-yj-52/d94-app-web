import type {AnnotationColor, PageAnnotation, TermHit} from "@/types/study";

export interface Segment {
    start: number;
    end: number;
    text: string;
    termId: string | null;
    annotationIds: string[];
    color: AnnotationColor | null;
}

/** 마킹이 이 블록에서 차지하는 구간. 여러 블록에 걸치면 시작 블록 [start, len), 중간 전체, 끝 블록 [0, end) */
function rangeInBlock(a: PageAnnotation, blockKey: string, len: number, order: Map<string, number>): [number, number] | null {
    const me = order.get(blockKey);
    const s = order.get(a.startBlockKey);
    const e = order.get(a.endBlockKey);
    if (me === undefined || s === undefined || e === undefined || me < s || me > e) return null;
    return [me === s ? a.startOffset : 0, me === e ? a.endOffset : len];
}

/** 블록 텍스트를 단어 hit · 마킹 경계로 빈틈없이 자른다. 마킹이 겹치면 나중 마킹 색. */
export function buildSegments(
    text: string,
    blockKey: string,
    hits: TermHit[],
    annotations: PageAnnotation[],
    blockOrder: Map<string, number>,
): Segment[] {
    const myHits = hits.filter((h) => h.blockKey === blockKey);
    const ranges = annotations
        .map((a) => ({a, r: rangeInBlock(a, blockKey, text.length, blockOrder)}))
        .filter((x): x is { a: PageAnnotation; r: [number, number] } => x.r !== null && x.r[0] < x.r[1]);

    const cuts = new Set<number>([0, text.length]);
    myHits.forEach((h) => cuts.add(h.start).add(h.end));
    ranges.forEach(({r}) => cuts.add(r[0]).add(r[1]));
    const points = [...cuts].filter((p) => p >= 0 && p <= text.length).sort((x, y) => x - y);

    const out: Segment[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const [start, end] = [points[i], points[i + 1]];
        const covering = ranges.filter(({r}) => r[0] <= start && end <= r[1]);
        out.push({
            start,
            end,
            text: text.slice(start, end),
            termId: myHits.find((h) => h.start <= start && end <= h.end)?.termId ?? null,
            annotationIds: covering.map(({a}) => a.id),
            color: covering.length ? covering[covering.length - 1].a.color : null,
        });
    }
    return out.length ? out : [{start: 0, end: 0, text: "", termId: null, annotationIds: [], color: null}];
}
