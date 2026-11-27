"use client";

import {X} from "lucide-react";
import type {NoteVersion} from "@/types/docs";
import {Skeleton} from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

interface NoteVersionHistoryProps {
    versions: NoteVersion[];
    isLoading: boolean;
    selected: number | null;
    onPreview: (v: NoteVersion) => void;
    onClose: () => void;
}

/** 버전 목록 (최신 먼저). 고르면 부모가 그 버전 본문을 미리 보여 준다 */
export default function NoteVersionHistory({versions, isLoading, selected, onPreview, onClose}: NoteVersionHistoryProps) {
    return (
        <aside className="text-sm" aria-label="버전 이력">
            <div className="mb-2 flex items-center">
                <h3 className="flex-1 text-xs font-medium text-slate-600">버전 이력</h3>
                <Button variant="unstyled" type="button" onClick={onClose} aria-label="버전 이력 닫기" className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4"/></Button>
            </div>
            {isLoading ? <Skeleton className="h-24"/> : (
                <ul className="space-y-1">
                    {versions.map((v) => (
                        <li key={v.version}>
                            <Button variant="unstyled" type="button" onClick={() => onPreview(v)}
                                    className={`w-full rounded-lg px-2 py-1.5 text-left ${selected === v.version ? "bg-d94-brand-soft text-d94-brand" : "hover:bg-slate-50"}`}>
                                <span className="font-medium">v{v.version}</span> <span className="text-slate-500">{v.title}</span>
                                <span className="block text-xs text-slate-400">{new Date(v.editedAt).toLocaleString("ko-KR")}</span>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
}
