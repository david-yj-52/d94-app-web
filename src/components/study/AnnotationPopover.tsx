"use client";

import {useState} from "react";
import {Trash2} from "lucide-react";
import {useDeleteStudyAnnotation, useStudyAnnotations, useUpdateStudyAnnotation} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";
import {ColorPicker} from "./SelectionToolbar";
import type {AnnotationListItem} from "@/types/study";

interface Props {
    annotationId: string;
    documentId: string;
    onClose: () => void;
    onError: (message: string) => void;
}

/** 마킹 클릭 → 노트 보기·편집, 색 변경, 삭제. 바깥을 누르면 닫힌다. */
export default function AnnotationPopover({annotationId, documentId, onClose, onError}: Props) {
    const {data} = useStudyAnnotations(documentId);
    const item = data?.find((a) => a.id === annotationId);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {item ? <Editor key={item.id} item={item} onClose={onClose} onError={onError}/>
                    : <p className="text-sm text-slate-500">불러오는 중…</p>}
            </div>
        </div>
    );
}

function Editor({item, onClose, onError}: { item: AnnotationListItem; onClose: () => void; onError: (m: string) => void }) {
    const update = useUpdateStudyAnnotation();
    const remove = useDeleteStudyAnnotation();
    const [note, setNote] = useState(item.note ?? "");
    const [color, setColor] = useState(item.color);

    const save = () => update.mutate({id: item.id, req: {color, note}}, {
        onSuccess: onClose,
        onError: (e) => onError(errorMessage(e, "저장하지 못했습니다.")),
    });

    return (
        <div className="space-y-3">
            <blockquote className="border-l-4 border-slate-300 pl-3 text-sm italic text-slate-600 line-clamp-4">{item.quote}</blockquote>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} aria-label="노트"
                      placeholder="노트를 쓰세요 (비우면 마킹만 남습니다)"
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"/>
            <div className="flex items-center justify-between">
                <ColorPicker value={color} onChange={setColor}/>
                <div className="flex gap-2">
                    <button type="button" onClick={() => remove.mutate(item.id, {onSuccess: onClose})}
                            className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4"/>삭제
                    </button>
                    <button type="button" onClick={save} disabled={update.isPending}
                            className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">저장</button>
                </div>
            </div>
        </div>
    );
}
