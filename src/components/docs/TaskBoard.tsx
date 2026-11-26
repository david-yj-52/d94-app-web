"use client";

import Link from "next/link";
import type {DocsTask, TaskStatus} from "@/types/docs";

const COLUMNS: { status: TaskStatus; label: string }[] = [
    {status: "todo", label: "할 일"},
    {status: "doing", label: "진행 중"},
    {status: "done", label: "완료"},
];

interface TaskBoardProps {
    tasks: DocsTask[];
    onStatus: (task: DocsTask, status: TaskStatus) => void;
}

/** 상태별 3열. 카드의 상태 선택이 원 노트의 그 줄을 고친다. ponytail: DnD 없이 선택 — 필요해지면 CIRA 칸반 DnD 이식 */
export default function TaskBoard({tasks, onStatus}: TaskBoardProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((c) => {
                const items = tasks.filter((t) => t.status === c.status);
                return (
                    <section key={c.status} className="rounded-xl bg-slate-50 p-3" aria-label={c.label}>
                        <h2 className="mb-2 text-xs font-medium text-slate-600">{c.label} ({items.length})</h2>
                        <ul className="space-y-2">
                            {items.map((t) => (
                                <li key={`${t.noteId}:${t.lineNo}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                                    <p className={c.status === "done" ? "text-slate-400 line-through" : "text-slate-800"}>{t.text}</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        <Link href={`/docs/${t.noteId}`} className="min-w-0 flex-1 truncate text-d94-brand hover:underline">{t.noteTitle}</Link>
                                        {t.dueDt && <span className="shrink-0 text-slate-500">📅 {t.dueDt}</span>}
                                        <select value={t.status} aria-label={`${t.text} 상태`} onChange={(e) => onStatus(t, e.target.value as TaskStatus)}
                                                className="h-7 shrink-0 rounded border border-slate-200 px-1 text-xs focus:outline-none focus:ring-2 focus:ring-d94-brand">
                                            {COLUMNS.map((o) => <option key={o.status} value={o.status}>{o.label}</option>)}
                                        </select>
                                    </div>
                                </li>
                            ))}
                            {items.length === 0 && <li className="py-4 text-center text-xs text-slate-400">없음</li>}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
