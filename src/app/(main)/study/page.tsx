"use client";

import Link from "next/link";
import DocumentList from "@/components/study/DocumentList";
import UploadDropzone from "@/components/study/UploadDropzone";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useDeleteStudyDocument, useStudyDocuments} from "@/hooks/useStudy";

export default function StudyPage() {
    const {data, isLoading} = useStudyDocuments();
    const remove = useDeleteStudyDocument();
    const {show, ToastComponent} = useToast();
    return (
        <div className="mx-auto max-w-4xl space-y-6 px-4">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">PDF 학습</h1>
                    <p className="text-sm text-slate-500">PDF를 올리면 목차·본문 뷰어, 단어장, 마킹·노트를 쓸 수 있습니다.</p>
                </div>
                <Link href="/study/notes" className="text-sm font-medium text-indigo-600 hover:underline">모든 노트 →</Link>
            </div>
            <UploadDropzone onUploaded={(d) => show(`"${d.title}" 업로드 완료`)} onError={(m) => show(m, "error")}/>
            {isLoading ? <SkeletonRow/> : (
                <DocumentList documents={data?.content ?? []} onDelete={(d) => {
                    if (window.confirm(`"${d.title}"과 마킹·노트를 모두 삭제할까요?`)) remove.mutate(d.id);
                }}/>
            )}
            {ToastComponent}
        </div>
    );
}
