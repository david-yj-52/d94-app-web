"use client";

import {useState} from "react";
import Link from "next/link";
import {useOpenNote} from "@/components/docs/useOpenNote";
import {useNotes} from "@/hooks/useDocs";
import {useToast} from "@/components/ui/Toast";
import {KIND_LABEL} from "@/lib/docs/markdown";
import {docsError} from "@/lib/docs/error";
import Button from "@/components/ui/Button";

/** Docs 첫 화면: 아이디어 빠른 기록(제목 한 줄 → 아이디어 노트) + 최근 노트 */
export default function DocsHomePage() {
    const [title, setTitle] = useState("");
    const openNote = useOpenNote();
    const recent = useNotes();
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
            <h2 className="mb-2 mt-8 text-xs font-medium text-slate-600">최근 노트</h2>
            <ul className="divide-y divide-slate-100">
                {(recent.data ?? []).slice(0, 15).map((n) => (
                    <li key={n.id}>
                        <Link href={`/docs/${n.id}`} className="flex items-center gap-2 py-2 text-sm hover:text-d94-brand">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{KIND_LABEL[n.kind]}</span>
                            <span className="truncate">{n.title}</span>
                            {n.modifiedAt && <span className="ml-auto shrink-0 text-xs text-slate-400">{new Date(n.modifiedAt).toLocaleDateString("ko-KR")}</span>}
                        </Link>
                    </li>
                ))}
                {recent.data?.length === 0 && <li className="py-6 text-center text-sm text-slate-400">아직 노트가 없습니다.</li>}
            </ul>
            {ToastComponent}
        </div>
    );
}
