"use client";

import {useState} from "react";
import type {DeriveRequest, NoteKind} from "@/types/docs";
import {KIND_LABEL, KINDS} from "@/lib/docs/markdown";

interface DeriveModalProps {
    originTitle: string;
    saving?: boolean;
    onSubmit: (req: DeriveRequest) => void;
    onClose: () => void;
}

/** 브로드캐스트·결과 문서: 원본에서 갈라질 새 노트의 제목·트랙(stream)·종류 */
export default function DeriveModal({originTitle, saving, onSubmit, onClose}: DeriveModalProps) {
    const [title, setTitle] = useState("");
    const [stream, setStream] = useState("");
    const [kind, setKind] = useState<NoteKind>("doc");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <form className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => {
                      e.preventDefault();
                      if (title.trim()) onSubmit({title: title.trim(), stream: stream.trim() || null, kind});
                  }}>
                <h2 className="text-base font-semibold text-slate-900">파생 노트 만들기</h2>
                <p className="text-xs text-slate-500">원본: {originTitle}</p>
                <label className="block text-xs font-medium text-slate-600">제목
                    <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                           className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                </label>
                <label className="block text-xs font-medium text-slate-600">트랙 (관점)
                    <input value={stream} onChange={(e) => setStream(e.target.value)} list="docs-streams" placeholder="dev · design · knowledge …"
                           className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                    <datalist id="docs-streams"><option value="dev"/><option value="design"/><option value="knowledge"/></datalist>
                </label>
                <label className="block text-xs font-medium text-slate-600">종류
                    <select value={kind} onChange={(e) => setKind(e.target.value as NoteKind)}
                            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand">
                        {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                    </select>
                </label>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-sm text-slate-600 hover:bg-slate-50">취소</button>
                    <button type="submit" disabled={saving}
                            className="h-10 rounded-lg bg-d94-brand px-4 text-sm font-medium text-white hover:bg-d94-brand-hover disabled:opacity-50">만들기</button>
                </div>
            </form>
        </div>
    );
}
