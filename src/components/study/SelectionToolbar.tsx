"use client";

import {useState} from "react";
import {BookPlus, StickyNote, X} from "lucide-react";
import {ANNOTATION_COLORS, DOT_CLASS} from "@/lib/study/colors";
import type {AnnotationColor} from "@/types/study";

interface Props {
    /** 선택 영역의 화면 좌표 (getBoundingClientRect) */
    rect: { top: number; left: number; bottom: number };
    onMark: (color: AnnotationColor, note?: string) => void;
    onAddTerm: () => void;
    onClose: () => void;
}

/** 텍스트를 선택하면 뜨는 작은 툴바: 색으로 마킹 / 노트 쓰고 마킹 / 단어장에 추가 */
export default function SelectionToolbar({rect, onMark, onAddTerm, onClose}: Props) {
    const [noteMode, setNoteMode] = useState(false);
    const [note, setNote] = useState("");
    const [color, setColor] = useState<AnnotationColor>("yellow");
    const top = rect.top > 140 ? rect.top - 8 : rect.bottom + 8;

    return (
        <div onMouseUp={(e) => e.stopPropagation()}
             className={`fixed z-40 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 shadow-xl ${
                 rect.top > 140 ? "-translate-y-full" : ""}`}
            /* 선택 영역 위치는 동적 좌표라 Tailwind 로 표현할 수 없다 */
             style={{top, left: Math.max(160, Math.min(rect.left, window.innerWidth - 160))}}>
            {noteMode ? (
                <div className="w-72 space-y-2">
                    <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                              placeholder="이 문장에 대한 노트" aria-label="노트"
                              className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"/>
                    <div className="flex items-center justify-between">
                        <ColorPicker value={color} onChange={setColor}/>
                        <div className="flex gap-1">
                            <button type="button" onClick={onClose} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">취소</button>
                            <button type="button" disabled={!note.trim()} onClick={() => onMark(color, note.trim())}
                                    className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-40">저장</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-1">
                    {ANNOTATION_COLORS.map((c) => (
                        <button key={c} type="button" aria-label={`${c} 마킹`} onClick={() => onMark(c)}
                                className={`h-6 w-6 rounded-full ${DOT_CLASS[c]} ring-offset-1 hover:ring-2 hover:ring-slate-400`}/>
                    ))}
                    <span className="mx-1 h-5 w-px bg-slate-200"/>
                    <button type="button" onClick={() => setNoteMode(true)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        <StickyNote className="h-4 w-4"/>노트
                    </button>
                    <button type="button" onClick={onAddTerm}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        <BookPlus className="h-4 w-4"/>단어장
                    </button>
                    <button type="button" aria-label="닫기" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            )}
        </div>
    );
}

export function ColorPicker({value, onChange}: { value: AnnotationColor; onChange: (c: AnnotationColor) => void }) {
    return (
        <div className="flex gap-1" role="radiogroup" aria-label="마킹 색">
            {ANNOTATION_COLORS.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c} onClick={() => onChange(c)}
                        className={`h-5 w-5 rounded-full ${DOT_CLASS[c]} ${value === c ? "ring-2 ring-slate-700 ring-offset-1" : ""}`}/>
            ))}
        </div>
    );
}
