"use client";

import Link from "next/link";
import {FileText, Loader2, RotateCw, Trash2} from "lucide-react";
import type {StudyDocument} from "@/types/study";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
    documents: StudyDocument[];
    onDelete: (doc: StudyDocument) => void;
    onReparse: (doc: StudyDocument) => void;
}

const STATUS: Record<StudyDocument["status"], { label: string; cls: string }> = {
    PARSING: {label: "분석 중", cls: "bg-amber-50 text-amber-700"},
    READY: {label: "준비됨", cls: "bg-emerald-50 text-emerald-700"},
    FAILED: {label: "실패", cls: "bg-red-50 text-red-700"},
};

export default function DocumentList({documents, onDelete, onReparse}: Props) {
    if (!documents.length) {
        return <EmptyState>아직 올린 문서가 없습니다.</EmptyState>;
    }
    return (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {documents.map((d) => {
                const s = STATUS[d.status];
                const body = (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-slate-400"/>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{d.title}</p>
                            <p className="truncate text-xs text-slate-500">
                                {d.fileName}{d.pageCount ? ` · ${d.pageCount}쪽` : ""}
                                {d.failReason ? ` · ${d.status === "READY" ? "최근 재분석 실패: " : ""}${d.failReason}` : ""}
                            </p>
                        </div>
                    </div>
                );
                return (
                    <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                        {d.status === "READY"
                            ? <Link href={`/study/${d.id}`} className="flex min-w-0 flex-1 hover:text-indigo-600">{body}</Link>
                            : body}
                        <Badge className={s.cls}>
                            {d.status === "PARSING" && <Loader2 className="h-3 w-3 animate-spin"/>}
                            {s.label}
                        </Badge>
                        <button type="button" aria-label={`${d.title} 다시 분석`} title="원본 PDF로 다시 분석"
                                disabled={d.status === "PARSING"} onClick={() => onReparse(d)}
                                className="rounded p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40">
                            <RotateCw className="h-4 w-4"/>
                        </button>
                        <button type="button" aria-label={`${d.title} 삭제`} onClick={() => onDelete(d)}
                                className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4"/>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
