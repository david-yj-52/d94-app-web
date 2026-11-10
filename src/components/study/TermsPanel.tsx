"use client";

import {useState} from "react";
import {Pencil, Trash2} from "lucide-react";
import {useDeleteStudyTerm, useStudyTerms, useUpdateStudyTerm} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";
import type {StudyTerm} from "@/types/study";

/** 전역 + 이 문서 단어 목록. 수정·삭제하면 본문 툴팁에 바로 반영된다(페이지 쿼리 무효화). */
export default function TermsPanel({documentId, onError}: { documentId: string; onError: (m: string) => void }) {
    const {data, isLoading} = useStudyTerms(documentId);
    if (isLoading) return <p className="text-sm text-slate-400">불러오는 중…</p>;
    if (!data?.length) {
        return <p className="text-sm text-slate-400">등록한 단어가 없습니다. 본문에서 글자를 선택하고 “단어장”을 누르세요.</p>;
    }
    return (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {data.map((t) => <Row key={t.id} term={t} onError={onError}/>)}
        </ul>
    );
}

function Row({term, onError}: { term: StudyTerm; onError: (m: string) => void }) {
    const update = useUpdateStudyTerm();
    const remove = useDeleteStudyTerm();
    const [editing, setEditing] = useState(false);
    const [word, setWord] = useState(term.term);
    const [definition, setDefinition] = useState(term.definition);

    if (editing) {
        return (
            <li className="space-y-2 p-3">
                <input value={word} onChange={(e) => setWord(e.target.value)} aria-label="단어"
                       className="w-full rounded border border-slate-300 px-2 py-1 text-sm"/>
                <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} rows={3} aria-label="뜻"
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"/>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditing(false)} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">취소</button>
                    <button type="button" onClick={() => update.mutate({id: term.id, req: {term: word, definition}}, {
                        onSuccess: () => setEditing(false),
                        onError: (e) => onError(errorMessage(e, "단어를 저장하지 못했습니다.")),
                    })} className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white">저장</button>
                </div>
            </li>
        );
    }
    return (
        <li className="flex items-start gap-3 p-3">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                    {term.term}
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-normal text-slate-500">
                        {term.scope === "DOCUMENT" ? "이 문서" : "전체"}
                    </span>
                </p>
                <p className="whitespace-pre-line text-sm text-slate-600">{term.definition}</p>
            </div>
            <button type="button" aria-label={`${term.term} 수정`} onClick={() => setEditing(true)}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4"/></button>
            <button type="button" aria-label={`${term.term} 삭제`} onClick={() => remove.mutate(term.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
        </li>
    );
}
