"use client";

import Link from "next/link";
import {History} from "lucide-react";
import type {Note, NoteSummary} from "@/types/docs";
import {KIND_LABEL} from "@/lib/docs/markdown";

interface NoteSidePanelProps {
    note: Note;
    backlinks: NoteSummary[];
    /** 이 노트를 origin 으로 둔 파생 노트 */
    derived: NoteSummary[];
    onOpenTitle: (title: string) => void;
    onShowVersions: () => void;
}

/** 속성(kind·stream·origin)·태그·백링크·파생 노트·버전 이력 버튼 */
export default function NoteSidePanel({note, backlinks, derived, onOpenTitle, onShowVersions}: NoteSidePanelProps) {
    return (
        <aside className="space-y-5 text-sm" aria-label="노트 정보">
            <Section title="속성">
                <dl className="grid grid-cols-[4rem_1fr] gap-y-1 text-slate-700">
                    <dt className="text-slate-500">종류</dt><dd>{KIND_LABEL[note.kind]}</dd>
                    <dt className="text-slate-500">트랙</dt><dd>{note.stream ?? "—"}</dd>
                    <dt className="text-slate-500">원본</dt>
                    <dd>{note.origin
                        ? <button type="button" onClick={() => onOpenTitle(note.origin!)} className="text-blue-600 hover:underline">{note.origin}</button>
                        : "—"}</dd>
                    <dt className="text-slate-500">버전</dt><dd>v{note.version}</dd>
                </dl>
            </Section>
            <Section title="태그">
                {note.tags.length === 0 ? <Empty/> : (
                    <div className="flex flex-wrap gap-1">
                        {note.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">#{t}</span>)}
                    </div>
                )}
            </Section>
            <NoteList title={`백링크 (${backlinks.length})`} notes={backlinks}/>
            <NoteList title={`파생 노트 (${derived.length})`} notes={derived}/>
            <button type="button" onClick={onShowVersions}
                    className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-slate-600 hover:bg-slate-100">
                <History className="h-4 w-4"/> 버전 이력
            </button>
        </aside>
    );
}

function Section({title, children}: { title: string; children: React.ReactNode }) {
    return <section><h3 className="mb-1.5 text-xs font-medium text-slate-600">{title}</h3>{children}</section>;
}

function Empty() {
    return <p className="text-xs text-slate-400">없음</p>;
}

function NoteList({title, notes}: { title: string; notes: NoteSummary[] }) {
    return (
        <Section title={title}>
            {notes.length === 0 ? <Empty/> : (
                <ul className="space-y-1">
                    {notes.map((n) => (
                        <li key={n.id}><Link href={`/docs/${n.id}`} className="text-blue-600 hover:underline">{n.title}</Link></li>
                    ))}
                </ul>
            )}
        </Section>
    );
}
