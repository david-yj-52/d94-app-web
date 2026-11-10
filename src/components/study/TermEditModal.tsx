"use client";

import {useState} from "react";
import {useCreateStudyTerm} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";

interface Props {
    initialTerm: string;
    documentId: string;
    onClose: () => void;
    onError: (message: string) => void;
    onSaved: () => void;
}

/** 선택한 글자를 단어장에 등록. 범위: 전체 문서 공유 또는 이 문서에서만(덮어쓰기). */
export default function TermEditModal({initialTerm, documentId, onClose, onError, onSaved}: Props) {
    const create = useCreateStudyTerm();
    const [term, setTerm] = useState(initialTerm.trim());
    const [definition, setDefinition] = useState("");
    const [scope, setScope] = useState<"GLOBAL" | "DOCUMENT">("GLOBAL");

    const save = () => create.mutate({term, definition, documentId: scope === "DOCUMENT" ? documentId : null}, {
        onSuccess: () => {
            onSaved();
            onClose();
        },
        onError: (e) => onError(errorMessage(e, "단어를 저장하지 못했습니다.")),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <form className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => {
                      e.preventDefault();
                      save();
                  }}>
                <h2 className="text-lg font-semibold text-slate-900">단어장에 추가</h2>
                <label className="block text-sm">
                    <span className="text-slate-600">단어</span>
                    <input value={term} onChange={(e) => setTerm(e.target.value)} maxLength={300} required
                           className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"/>
                </label>
                <label className="block text-sm">
                    <span className="text-slate-600">뜻 · 정의</span>
                    <textarea autoFocus value={definition} onChange={(e) => setDefinition(e.target.value)} rows={4} required
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"/>
                </label>
                <fieldset className="flex gap-4 text-sm text-slate-700">
                    <legend className="sr-only">적용 범위</legend>
                    <label className="flex items-center gap-1">
                        <input type="radio" checked={scope === "GLOBAL"} onChange={() => setScope("GLOBAL")}/>모든 문서
                    </label>
                    <label className="flex items-center gap-1">
                        <input type="radio" checked={scope === "DOCUMENT"} onChange={() => setScope("DOCUMENT")}/>이 문서에서만
                    </label>
                </fieldset>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">취소</button>
                    <button type="submit" disabled={create.isPending || !term.trim() || !definition.trim()}
                            className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">저장</button>
                </div>
            </form>
        </div>
    );
}
