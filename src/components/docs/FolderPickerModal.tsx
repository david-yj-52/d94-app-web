"use client";

import {useState} from "react";
import type {DocsFolder} from "@/types/docs";
import Button from "@/components/ui/Button";

interface FolderPickerModalProps {
    title: string;
    folders: DocsFolder[];
    /** 고를 수 없는 폴더 (자기 자신과 하위 — 서버도 400 으로 막는다) */
    disabledIds?: Set<string>;
    initial: string | null;
    onPick: (folderId: string | null) => void;
    onClose: () => void;
}

/** 노트·폴더 이동 대상 선택. 들여쓴 폴더 경로 목록 + 최상위. */
export default function FolderPickerModal({title, folders, disabledIds, initial, onPick, onClose}: FolderPickerModalProps) {
    const [value, setValue] = useState(initial ?? "");
    const rows: { f: DocsFolder; depth: number }[] = [];
    const walk = (parentId: string | null, depth: number) =>
        folders.filter((f) => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name)).forEach((f) => {
            rows.push({f, depth});
            walk(f.id, depth + 1);
        });
    walk(null, 0);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="mb-3 text-base font-semibold text-slate-900">{title}</h2>
                <select value={value} onChange={(e) => setValue(e.target.value)} aria-label="대상 폴더" size={8}
                        className="w-full rounded-lg border border-slate-200 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand">
                    <option value="">/ (최상위)</option>
                    {rows.map(({f, depth}) => (
                        <option key={f.id} value={f.id} disabled={disabledIds?.has(f.id)}>{"  ".repeat(depth + 1)}{f.name}</option>
                    ))}
                </select>
                <div className="mt-4 flex justify-end gap-2">
                    <Button type="button" onClick={onClose} variant="ghost">취소</Button>
                    <Button type="button" onClick={() => onPick(value || null)}
                            className="font-medium">이동</Button>
                </div>
            </div>
        </div>
    );
}
