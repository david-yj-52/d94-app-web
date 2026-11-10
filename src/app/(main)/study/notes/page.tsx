"use client";

import {Suspense} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import NoteList from "@/components/study/NoteList";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useStudyAnnotations, useStudyDocuments} from "@/hooks/useStudy";

export default function StudyNotesPage() {
    return <Suspense><Notes/></Suspense>;
}

/** ponytail: 검색·페이지네이션 없음(혼자 쓰는 앱). 노트가 많아지면 추가 */
function Notes() {
    const router = useRouter();
    const documentId = useSearchParams().get("documentId") ?? undefined;
    const docs = useStudyDocuments();
    const notes = useStudyAnnotations(documentId);
    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Link href="/study" className="text-sm text-slate-500 hover:text-indigo-600">← PDF 학습</Link>
                    <h1 className="text-2xl font-bold text-slate-900">노트 모아보기</h1>
                </div>
                <select aria-label="문서 필터" value={documentId ?? ""}
                        onChange={(e) => router.replace(e.target.value ? `/study/notes?documentId=${e.target.value}` : "/study/notes")}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
                    <option value="">모든 문서</option>
                    {docs.data?.content.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
            </div>
            {notes.isLoading ? <SkeletonRow/> : (
                <NoteList items={notes.data ?? []} onOpen={(loc) =>
                    router.push(`/study/${loc.documentId}?section=${loc.pageSectionId ?? ""}#${loc.blockKey}`)}/>
            )}
        </div>
    );
}
