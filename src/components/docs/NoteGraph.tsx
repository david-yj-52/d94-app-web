"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import dynamic from "next/dynamic";
import type {GraphData, GraphNode, NoteKind} from "@/types/docs";

// canvas·window 를 쓰므로 브라우저에서만, 처음 그릴 때 불러온다
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {ssr: false});

/** 종류별 점 색 (Tailwind slate·brand 계열 hex — canvas 라 클래스 불가) */
export const KIND_COLOR: Record<NoteKind, string> = {idea: "#f59e0b", doc: "#3b82f6", task: "#10b981", knowledge: "#8b5cf6"};

interface NoteGraphProps {
    data: GraphData;
    /** 강조할 노트 (로컬 그래프 중심) */
    focusId: string | null;
    onOpen: (id: string) => void;
}

/** Obsidian 형 그래프: 점 = 노트(종류 색), 선 = [[링크]](회색)·파생 origin(점선). 클릭하면 노트로 */
export default function NoteGraph({data, focusId, onOpen}: NoteGraphProps) {
    const box = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({width: 0, height: 0});
    useEffect(() => {
        const el = box.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setSize({width: e.contentRect.width, height: e.contentRect.height}));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    // 라이브러리가 links 의 source·target 을 노드 객체로 바꿔 넣으므로 복사본을 넘긴다
    const graph = useMemo(() => ({nodes: data.nodes.map((n) => ({...n})), links: data.links.map((l) => ({...l}))}), [data]);

    return (
        <div ref={box} className="h-full w-full">
            {size.width > 0 && (
                <ForceGraph2D
                    graphData={graph}
                    width={size.width}
                    height={size.height}
                    nodeId="id"
                    nodeLabel="title"
                    nodeRelSize={4}
                    nodeVal={(n) => (n.id === focusId ? 3 : 1)}
                    nodeColor={(n) => KIND_COLOR[(n as GraphNode).kind]}
                    linkColor={() => "#cbd5e1"}
                    linkLineDash={(l) => (l.rel === "origin" ? [3, 2] : null)}
                    linkDirectionalArrowLength={3}
                    linkDirectionalArrowRelPos={1}
                    onNodeClick={(n) => onOpen(String(n.id))}
                    nodeCanvasObjectMode={() => "after"}
                    nodeCanvasObject={(n, ctx, scale) => {
                        if (scale < 1.2 && n.id !== focusId) return; // 멀리서는 제목 생략
                        ctx.font = `${n.id === focusId ? "bold " : ""}${11 / scale}px sans-serif`;
                        ctx.fillStyle = "#334155";
                        ctx.textAlign = "center";
                        ctx.fillText(n.title, n.x ?? 0, (n.y ?? 0) + 10 / scale);
                    }}
                />
            )}
        </div>
    );
}
