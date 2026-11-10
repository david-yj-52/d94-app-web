"use client";

import {useRef, useState} from "react";
import {Upload} from "lucide-react";
import {useUploadStudyDocument} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";
import type {StudyDocument} from "@/types/study";

interface Props {
    onUploaded: (doc: StudyDocument) => void;
    onError: (message: string) => void;
}

/** 클릭·끌어놓기로 PDF 하나를 올린다. 768KB 조각으로 나눠 보내며 진행률을 보여 준다. */
export default function UploadDropzone({onUploaded, onError}: Props) {
    const {upload, progress, uploading} = useUploadStudyDocument();
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const send = async (file: File | undefined) => {
        if (!file || uploading) return;
        try {
            onUploaded(await upload(file));
        } catch (e) {
            onError(errorMessage(e, "업로드에 실패했습니다."));
        } finally {
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                send(e.dataTransfer.files[0]);
            }}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-white"
            }`}
        >
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden"
                   onChange={(e) => send(e.target.files?.[0])}/>
            {uploading ? (
                <div className="mx-auto max-w-sm">
                    <p className="mb-2 text-sm text-slate-600">업로드 중… {Math.round(progress * 100)}%</p>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        {/* 진행률은 Tailwind 클래스로 표현할 수 없는 동적 수치 */}
                        <div className="h-full bg-indigo-500 transition-all" style={{width: `${progress * 100}%`}}/>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current?.click()}
                        className="inline-flex flex-col items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
                    <Upload className="h-6 w-6"/>
                    <span><b>PDF를 끌어놓거나 클릭</b>해서 올리세요 (최대 50MB, 목차가 있는 텍스트 PDF)</span>
                </button>
            )}
        </div>
    );
}
