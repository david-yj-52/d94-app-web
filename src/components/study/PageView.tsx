"use client";

import {Fragment, type ReactNode, type Ref} from "react";
import {ChevronLeft, ChevronRight, StickyNote} from "lucide-react";
import {buildSegments} from "@/lib/study/segments";
import {MARK_CLASS} from "@/lib/study/colors";
import type {PageBlock, SectionRef, StudyPage} from "@/types/study";

interface Props {
    page: StudyPage;
    documentId: string;
    containerRef: Ref<HTMLDivElement>;
    onNavigate: (section: SectionRef) => void;
    onAnnotationClick: (annotationId: string) => void;
    onSelectionEnd: () => void;
}

/**
 * 백엔드가 준 블록을 그대로 그린다. 모든 블록 요소는 id·data-block-key 를 가진다(선택 → 오프셋 변환, 이동 대상).
 * 블록 안에는 본문 글자 외의 텍스트 노드를 넣지 않는다 — 단어 툴팁은 CSS ::after(data-tip)로 그린다.
 */
export default function PageView({page, documentId, containerRef, onNavigate, onAnnotationClick, onSelectionEnd}: Props) {
    const order = new Map<string, number>();
    page.blocks.forEach((b, i) => {
        order.set(b.key, i * 1000);
        b.cells?.forEach((c, j) => order.set(c.key, i * 1000 + j + 1));
    });

    const rich = (text: string, blockKey: string): ReactNode => {
        const notes = page.annotations.filter((a) => a.hasNote && a.endBlockKey === blockKey);
        return (
            <>
                {buildSegments(text, blockKey, page.termHits, page.annotations, order).map((s) => {
                    let node: ReactNode = s.text;
                    const def = s.termId ? page.terms[s.termId] : undefined;
                    if (def) {
                        node = (
                            <span tabIndex={0}
                                  data-tip={`${def.term} (${def.scope === "DOCUMENT" ? "이 문서" : "전체"})\n${def.definition}`}
                                  className="relative cursor-help border-b border-dotted border-indigo-500 after:pointer-events-none after:absolute after:left-0 after:top-full after:z-30 after:mt-1 after:hidden after:w-72 after:whitespace-pre-line after:rounded-md after:bg-slate-900 after:p-2 after:text-xs after:font-normal after:leading-relaxed after:text-white after:shadow-lg after:content-[attr(data-tip)] hover:after:block focus:after:block">
                                {node}
                            </span>
                        );
                    }
                    if (s.color) {
                        node = (
                            <mark data-annotation-ids={s.annotationIds.join(",")}
                                  onClick={() => onAnnotationClick(s.annotationIds[s.annotationIds.length - 1])}
                                  className={`${MARK_CLASS[s.color]} cursor-pointer rounded-sm text-inherit`}>
                                {node}
                            </mark>
                        );
                    }
                    return <Fragment key={s.start}>{node}</Fragment>;
                })}
                {notes.map((a) => (
                    <button key={a.id} type="button" aria-label="노트 보기" onClick={() => onAnnotationClick(a.id)}
                            className="mx-0.5 inline-flex align-middle text-amber-500 hover:text-amber-600">
                        <StickyNote className="h-4 w-4"/>
                    </button>
                ))}
            </>
        );
    };

    // 연속된 LIST_ITEM 은 하나의 <ul>로 묶는다
    const groups: PageBlock[][] = [];
    page.blocks.forEach((b) => {
        const last = groups[groups.length - 1];
        if (b.type === "LIST_ITEM" && last?.[0].type === "LIST_ITEM") last.push(b);
        else groups.push([b]);
    });

    return (
        <article>
            <div ref={containerRef} onMouseUp={onSelectionEnd} onKeyUp={onSelectionEnd}
                 className="space-y-4 text-[15px] leading-7 text-slate-800">
                {groups.map((g) => g[0].type === "LIST_ITEM" ? (
                    <ul key={g[0].key} className="list-disc space-y-1 pl-6">
                        {g.map((b) => <li key={b.key} id={b.key} data-block-key={b.key}>{rich(b.text, b.key)}</li>)}
                    </ul>
                ) : <BlockView key={g[0].key} block={g[0]} documentId={documentId} rich={rich}/>)}
            </div>
            <nav className="mt-10 flex justify-between gap-4 border-t border-slate-200 pt-4 text-sm">
                {page.prev ? (
                    <button type="button" onClick={() => onNavigate(page.prev as SectionRef)}
                            className="inline-flex max-w-[45%] items-center gap-1 text-slate-600 hover:text-indigo-600">
                        <ChevronLeft className="h-4 w-4 shrink-0"/><span className="truncate">{page.prev.title}</span>
                    </button>
                ) : <span/>}
                {page.next && (
                    <button type="button" onClick={() => onNavigate(page.next as SectionRef)}
                            className="inline-flex max-w-[45%] items-center gap-1 text-slate-600 hover:text-indigo-600">
                        <span className="truncate">{page.next.title}</span><ChevronRight className="h-4 w-4 shrink-0"/>
                    </button>
                )}
            </nav>
        </article>
    );
}

const HEADING_CLASS: Record<number, string> = {
    1: "text-3xl font-bold text-slate-900",
    2: "text-2xl font-bold text-slate-900",
    3: "text-xl font-semibold text-slate-900",
};

function BlockView({block: b, documentId, rich}: {
    block: PageBlock;
    documentId: string;
    rich: (text: string, key: string) => ReactNode;
}) {
    switch (b.type) {
        case "HEADING": {
            const level = Math.min(b.level ?? 3, 4);
            const Tag = (`h${level}`) as "h1" | "h2" | "h3" | "h4";
            return (
                <Tag id={b.key} data-block-key={b.key}
                     className={`scroll-mt-20 pt-2 ${HEADING_CLASS[level] ?? "text-lg font-semibold text-slate-900"}`}>
                    {rich(b.text, b.key)}
                </Tag>
            );
        }
        case "TABLE": {
            const cells = b.cells ?? [];
            const rows = [...new Set(cells.map((c) => c.row))].sort((x, y) => x - y);
            return (
                <figure id={b.key} className="scroll-mt-20 overflow-x-auto">
                    <table data-block-key={b.key} data-block-type="TABLE"
                           className="w-full border-collapse text-sm">
                        <tbody>
                        {rows.map((r) => (
                            <tr key={r}>
                                {cells.filter((c) => c.row === r).sort((x, y) => x.col - y.col).map((c) => {
                                    const Cell = r === 0 ? "th" : "td";
                                    return (
                                        <Cell key={c.key} id={c.key} data-block-key={c.key}
                                              className={`scroll-mt-20 border border-slate-300 px-3 py-2 align-top ${
                                                  r === 0 ? "bg-slate-50 text-left font-semibold" : ""}`}>
                                            {rich(c.text, c.key)}
                                        </Cell>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {b.text && <figcaption className="mt-1 text-xs text-slate-500">{b.text}</figcaption>}
                </figure>
            );
        }
        case "FIGURE":
            return (
                <figure id={b.key} className="scroll-mt-20 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 프록시가 인증해 주는 동적 이미지 */}
                    <img src={`/api/proxy/v1/study/documents/${documentId}/figures/${b.key}`} alt={b.text}
                         loading="lazy" className="mx-auto max-h-[520px] max-w-full rounded border border-slate-200"/>
                    <figcaption data-block-key={b.key} className="mt-1 text-xs text-slate-500">{rich(b.text, b.key)}</figcaption>
                </figure>
            );
        default:
            return <p id={b.key} data-block-key={b.key} className="scroll-mt-20">{rich(b.text, b.key)}</p>;
    }
}

export function PageOutline({items, onSelect}: {
    items: StudyPage["outline"];
    onSelect: (blockKey: string) => void;
}) {
    if (!items.length) return null;
    return (
        <nav aria-label="이 페이지 내용" className="text-sm">
            <p className="mb-2 font-semibold text-slate-900">이 페이지 내용</p>
            <ul className="space-y-1 border-l border-slate-200">
                {items.map((o) => (
                    <li key={o.blockKey}>
                        <button type="button" onClick={() => onSelect(o.blockKey)}
                                className={`-ml-px border-l border-transparent py-0.5 text-left text-slate-600 hover:border-indigo-500 hover:text-indigo-600 ${
                                    o.level > 3 ? "pl-6" : "pl-3"}`}>
                            {o.title}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
