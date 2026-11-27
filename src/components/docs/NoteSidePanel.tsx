"use client";

import Link from "next/link";
import {ArrowUpRight, History} from "lucide-react";
import type {Note, NoteSummary, TaskStatus} from "@/types/docs";
import {extractTasks, KIND_LABEL} from "@/lib/docs/markdown";
import Button from "@/components/ui/Button";

interface NoteSidePanelProps {
    note: Note;
    backlinks: NoteSummary[];
    /** 이 노트를 origin 으로 둔 파생 노트 */
    derived: NoteSummary[];
    onOpenTitle: (title: string) => void;
    onShowVersions: () => void;
    /** 체크박스 줄 상태 변경 (본문의 그 줄만 고침) */
    onTaskStatus: (lineNo: number, status: TaskStatus) => void;
    /** 체크박스 줄을 [[제목]] 노트로 승격 */
    onPromoteTask: (lineNo: number) => void;
}

/** 속성(kind·stream·origin)·태그·백링크·파생 노트·버전 이력 버튼 */
export default function NoteSidePanel({note, backlinks, derived, onOpenTitle, onShowVersions, onTaskStatus, onPromoteTask}: NoteSidePanelProps) {
    const tasks = extractTasks(note.content);
    return (
        <aside className="space-y-5 text-sm" aria-label="노트 정보">
            <Section title="속성">
                <dl className="grid grid-cols-[4rem_1fr] gap-y-1 text-slate-700">
                    <dt className="text-slate-500">종류</dt><dd>{KIND_LABEL[note.kind]}</dd>
                    <dt className="text-slate-500">트랙</dt><dd>{note.stream ?? "—"}</dd>
                    <dt className="text-slate-500">원본</dt>
                    <dd>{note.origin
                        ? <Button type="button" onClick={() => onOpenTitle(note.origin!)} variant="link">{note.origin}</Button>
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
            <Section title={`Task (${tasks.filter((t) => t.status === "done").length}/${tasks.length})`}>
                {tasks.length === 0 ? <Empty/> : (
                    <ul className="space-y-1">
                        {tasks.map((t) => (
                            <li key={t.lineNo} className="group flex items-start gap-2">
                                <input type="checkbox" checked={t.status === "done"} aria-label={`${t.text} 완료`}
                                       onChange={(e) => onTaskStatus(t.lineNo, e.target.checked ? "done" : "todo")}
                                       className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"/>
                                <span className={`min-w-0 flex-1 break-words ${t.status === "done" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                    {t.status === "doing" && <span className="mr-1 text-xs text-amber-600">진행</span>}{t.text}
                                </span>
                                {!/^\[\[.*]]$/.test(t.text) && (
                                    <Button variant="unstyled" type="button" onClick={() => onPromoteTask(t.lineNo)} aria-label={`${t.text} 노트로 만들기`} title="노트로 만들기"
                                            className="rounded p-0.5 text-slate-400 opacity-0 hover:bg-slate-100 focus:opacity-100 group-hover:opacity-100">
                                        <ArrowUpRight className="h-4 w-4"/>
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
            <NoteList title={`백링크 (${backlinks.length})`} notes={backlinks}/>
            <NoteList title={`파생 노트 (${derived.length})`} notes={derived}/>
            <Button variant="unstyled" type="button" onClick={onShowVersions}
                    className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-slate-600 hover:bg-slate-100">
                <History className="h-4 w-4"/> 버전 이력
            </Button>
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
                        <li key={n.id}><Link href={`/docs/${n.id}`} className="text-d94-brand hover:underline">{n.title}</Link></li>
                    ))}
                </ul>
            )}
        </Section>
    );
}
