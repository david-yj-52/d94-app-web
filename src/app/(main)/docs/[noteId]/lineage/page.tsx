"use client";

import Link from "next/link";
import {useParams} from "next/navigation";
import {ArrowLeft, GitBranch} from "lucide-react";
import {useLineage} from "@/hooks/useDocs";
import {Skeleton} from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import {groupByStream, KIND_LABEL} from "@/lib/docs/markdown";

/** 계보 화면: 루트 아이디어부터 파생된 노트를 stream(트랙)별 열로. 열 안은 세대(루트=0) → 제목 순 */
export default function LineagePage() {
    const {noteId} = useParams<{ noteId: string }>();
    const lineage = useLineage(noteId);

    if (lineage.isLoading) return <Skeleton className="h-96"/>;
    const nodes = lineage.data ?? [];
    if (nodes.length === 0) return <EmptyState className="text-slate-500">노트를 찾을 수 없습니다.</EmptyState>;

    const columns = groupByStream(nodes);
    const root = nodes.find((n) => n.origin === null) ?? nodes[0];
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Link href={`/docs/${noteId}`} aria-label="노트로 돌아가기" title="노트로 돌아가기"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                    <ArrowLeft className="h-4 w-4"/>
                </Link>
                <GitBranch className="h-4 w-4 text-slate-400"/>
                <h1 className="truncate text-lg font-semibold text-slate-900">{root.title} 계보</h1>
                <span className="ml-auto text-xs text-slate-400">{nodes.length}개 노트 · {columns.length}개 트랙</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {columns.map(({stream, items}) => (
                    <div key={stream ?? ""} className="w-64 shrink-0 rounded-lg bg-slate-50 p-2">
                        <h2 className="mb-2 px-1 text-xs font-medium text-slate-600">
                            {stream ?? "트랙 없음"} <span className="text-slate-400">({items.length})</span>
                        </h2>
                        <ul className="space-y-2">
                            {items.map(({n, depth}) => (
                                <li key={n.id}>
                                    <Link href={`/docs/${n.id}`}
                                          className={`block rounded-lg border bg-white p-2 text-sm hover:border-d94-brand ${n.id === noteId ? "border-d94-brand ring-1 ring-d94-brand" : "border-slate-200"}`}>
                                        <span className="block truncate font-medium text-slate-800">{n.title}</span>
                                        <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-400">
                                            <span>{KIND_LABEL[n.kind]}</span>
                                            <span>{depth === 0 ? "루트" : `${depth}세대`}</span>
                                            {n.origin && <span className="truncate">← {n.origin}</span>}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}
