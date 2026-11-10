"use client";

import type {TocNode} from "@/types/study";

interface Props {
    nodes: TocNode[];
    activePageSectionId: string | null;
    onSelect: (node: TocNode) => void;
}

/** MS Docs 식 목차. 활성 페이지의 섹션은 강조, 하위 목록은 native <details>로 접고 편다. */
export default function TocTree({nodes, activePageSectionId, onSelect}: Props) {
    return (
        <ul className="space-y-0.5 text-sm">
            {nodes.map((n) => <Item key={n.id} node={n} active={activePageSectionId} onSelect={onSelect}/>)}
        </ul>
    );
}

function Item({node, active, onSelect}: { node: TocNode; active: string | null; onSelect: (n: TocNode) => void }) {
    const isActive = node.pageSectionId === active;
    const label = (
        <button type="button" onClick={() => onSelect(node)}
                className={`w-full truncate rounded px-2 py-1 text-left ${
                    isActive ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`} title={node.title}>
            {node.title}
        </button>
    );
    if (!node.children.length) return <li>{label}</li>;
    const containsActive = (n: TocNode): boolean => n.pageSectionId === active || n.children.some(containsActive);
    return (
        <li>
            <details open={containsActive(node) || node.level === 1}>
                <summary className="flex cursor-pointer list-none items-center">{label}</summary>
                <ul className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                    {node.children.map((c) => <Item key={c.id} node={c} active={active} onSelect={onSelect}/>)}
                </ul>
            </details>
        </li>
    );
}
