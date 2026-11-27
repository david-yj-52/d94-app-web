"use client";

import {Suspense} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {ArrowLeft, Waypoints} from "lucide-react";
import NoteGraph, {KIND_COLOR} from "@/components/docs/NoteGraph";
import {useDocsGraph} from "@/hooks/useDocs";
import {Skeleton} from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import {KIND_LABEL, KINDS} from "@/lib/docs/markdown";

/** 그래프 뷰: ?noteId= 면 그 노트 주변(로컬, ?depth=1~5), 없으면 접근 가능한 vault 전체 */
export default function GraphPage() {
    return <Suspense><GraphContent/></Suspense>;
}

function GraphContent() {
    const router = useRouter();
    const search = useSearchParams();
    const noteId = search.get("noteId");
    const depth = Number(search.get("depth") ?? 1);
    const graph = useDocsGraph(noteId, depth);
    const focus = noteId ? graph.data?.nodes.find((n) => n.id === noteId) : undefined;

    return (
        <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 h-[70vh] lg:h-[calc(100vh-7.5rem)]">
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                {noteId && (
                    <Link href={`/docs/${noteId}`} aria-label="노트로 돌아가기" title="노트로 돌아가기"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                        <ArrowLeft className="h-4 w-4"/>
                    </Link>
                )}
                <Waypoints className="h-4 w-4 text-slate-400"/>
                <h1 className="truncate text-lg font-semibold text-slate-900">{focus ? `${focus.title} 주변` : "전체 그래프"}</h1>
                {noteId && (
                    <>
                        <select value={depth} aria-label="단계" onChange={(e) => router.replace(`/docs/graph?noteId=${noteId}&depth=${e.target.value}`)}
                                className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-d94-brand">
                            {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}단계</option>)}
                        </select>
                        <Link href="/docs/graph" className="h-8 rounded-lg px-2 text-xs leading-8 text-d94-brand hover:bg-d94-brand-soft">전체 그래프</Link>
                    </>
                )}
                <span className="ml-auto flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {KINDS.map((k) => (
                        <span key={k} className="flex items-center gap-1">
                            {/* 범례 색은 canvas 색과 같은 동적 값이라 인라인 style */}
                            <span className="h-2.5 w-2.5 rounded-full" style={{background: KIND_COLOR[k]}}/>{KIND_LABEL[k]}
                        </span>
                    ))}
                    <span>점선 = 파생</span>
                </span>
            </div>
            <div className="min-h-0 flex-1">
                {graph.isLoading ? <Skeleton className="h-full"/>
                    : !graph.data || graph.data.nodes.length === 0 ? <EmptyState className="text-slate-500">노트가 없습니다.</EmptyState>
                        : <NoteGraph data={graph.data} focusId={noteId} onOpen={(id) => router.push(`/docs/${id}`)}/>}
            </div>
        </section>
    );
}
