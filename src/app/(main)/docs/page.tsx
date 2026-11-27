"use client";

import {useState} from "react";
import Link from "next/link";
import {useOpenNote} from "@/components/docs/useOpenNote";
import {useDocsVaults, useNotes, useSearchDocsKnowledge} from "@/hooks/useDocs";
import {useToast} from "@/components/ui/Toast";
import {KIND_LABEL} from "@/lib/docs/markdown";
import {docsError} from "@/lib/docs/error";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

/** Docs 첫 화면: 아이디어 빠른 기록(제목 한 줄 → 아이디어 노트) + 최근 노트 */
export default function DocsHomePage() {
    const [title, setTitle] = useState("");
    const openNote = useOpenNote();
    const recent = useNotes();
    const vaults = useDocsVaults();
    const searchKnowledge = useSearchDocsKnowledge();
    const [query, setQuery] = useState("");
    const [vaultId, setVaultId] = useState("");
    const {show, ToastComponent} = useToast();
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
            <h1 className="text-xl font-semibold text-slate-900">Docs</h1>
            <p className="mt-1 text-sm text-slate-500">모든 일은 아이디어에서 시작합니다. 제목 한 줄로 기록하고, 문서·Task·지식으로 키워 가세요.</p>
            <form className="mt-4 flex gap-2" onSubmit={(e) => {
                e.preventDefault();
                if (title.trim()) openNote(title.trim()).catch((err) => show(docsError(err, "노트를 만들지 못했습니다."), "error"));
            }}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="떠오른 아이디어를 한 줄로" aria-label="새 아이디어 제목"
                       className="h-10 flex-1 rounded-lg border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                <Button type="submit" className="font-medium">기록</Button>
            </form>
            <section className="mt-8 border-t border-slate-100 pt-5">
                <h2 className="text-sm font-semibold text-slate-800">RAG 지식 검색</h2>
                <p className="mt-1 text-xs text-slate-500">지식화한 문서에서 의미가 가까운 내용을 찾습니다.</p>
                <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => {
                    e.preventDefault();
                    if (query.trim()) searchKnowledge.mutate({query: query.trim(), vaultId: vaultId || undefined});
                }}>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="찾고 싶은 지식을 입력하세요" aria-label="RAG 지식 검색어"
                           className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                    <select value={vaultId} onChange={(e) => setVaultId(e.target.value)} aria-label="검색할 문서 공간"
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
                        <option value="">내가 접근할 수 있는 전체 공간</option>
                        {(vaults.data ?? []).map((vault) => <option key={vault.id} value={vault.id}>{vault.name}</option>)}
                    </select>
                    <Button type="submit" disabled={searchKnowledge.isPending || !query.trim()}>{searchKnowledge.isPending ? "검색 중…" : "검색"}</Button>
                </form>
                {searchKnowledge.isError && <p role="alert" className="mt-3 text-sm text-red-600">{docsError(searchKnowledge.error, "지식 검색에 실패했습니다.")}</p>}
                {searchKnowledge.isSuccess && (
                    <ul className="mt-3 divide-y divide-slate-100">
                        {searchKnowledge.data.map((hit, index) => <li key={`${hit.noteId}-${hit.chunkIndex}`} className="py-3">
                            <Link href={`/docs/${hit.noteId}`} className="font-medium text-sm text-d94-brand hover:underline">{hit.title}</Link>
                            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{hit.content}</p>
                            <p className="mt-1 text-xs text-slate-400">검색 점수 {hit.score.toFixed(2)} · 청크 {hit.chunkIndex + 1}</p>
                        </li>)}
                        {searchKnowledge.data.length === 0 && <li><EmptyState className="py-4">지식화된 관련 문서를 찾지 못했습니다.</EmptyState></li>}
                    </ul>
                )}
            </section>
            <h2 className="mb-2 mt-8 text-xs font-medium text-slate-600">최근 노트</h2>
            <ul className="divide-y divide-slate-100">
                {(recent.data ?? []).slice(0, 15).map((n) => (
                    <li key={n.id}>
                        <Link href={`/docs/${n.id}`} className="flex items-center gap-2 py-2 text-sm hover:text-d94-brand">
                            <Badge className="text-slate-500">{KIND_LABEL[n.kind]}</Badge>
                            <span className="truncate">{n.title}</span>
                            {n.modifiedAt && <span className="ml-auto shrink-0 text-xs text-slate-400">{new Date(n.modifiedAt).toLocaleDateString("ko-KR")}</span>}
                        </Link>
                    </li>
                ))}
                {recent.data?.length === 0 && <li><EmptyState className="py-6">아직 노트가 없습니다.</EmptyState></li>}
            </ul>
            {ToastComponent}
        </div>
    );
}
