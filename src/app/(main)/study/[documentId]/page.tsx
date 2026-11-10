"use client";

import {Suspense, useCallback, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import AnnotationPopover from "@/components/study/AnnotationPopover";
import PageView, {PageOutline} from "@/components/study/PageView";
import SelectionToolbar from "@/components/study/SelectionToolbar";
import TermEditModal from "@/components/study/TermEditModal";
import TermsPanel from "@/components/study/TermsPanel";
import TocTree from "@/components/study/TocTree";
import {Skeleton} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useCreateStudyAnnotation, useStudyDocument, useStudyPage, useStudyToc} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";
import {rangeToAnchor, type SelectionAnchor} from "@/lib/study/selection";
import type {AnnotationColor} from "@/types/study";

export default function StudyViewerPage() {
    return <Suspense><Viewer/></Suspense>;
}

function scrollToBlock(key: string) {
    const el = document.getElementById(key);
    if (!el) return;
    el.scrollIntoView({block: "start", behavior: "smooth"});
    el.classList.add("ring-2", "ring-indigo-400", "rounded");
    setTimeout(() => el.classList.remove("ring-2", "ring-indigo-400", "rounded"), 1500);
}

function Viewer() {
    const {documentId} = useParams<{ documentId: string }>();
    const router = useRouter();
    const section = useSearchParams().get("section");
    const doc = useStudyDocument(documentId);
    const ready = doc.data?.status === "READY";
    const toc = useStudyToc(documentId, ready);
    const page = useStudyPage(documentId, section);
    const createAnnotation = useCreateStudyAnnotation();
    const {show, ToastComponent} = useToast();
    const containerRef = useRef<HTMLDivElement>(null);
    const [tab, setTab] = useState<"read" | "terms">("read");
    const [selection, setSelection] = useState<{ anchor: SelectionAnchor; rect: DOMRect } | null>(null);
    const [termDraft, setTermDraft] = useState<string | null>(null);
    const [openAnnotation, setOpenAnnotation] = useState<string | null>(null);

    // section 이 없으면 목차 첫 페이지로
    useEffect(() => {
        if (!section && toc.data?.length) router.replace(`/study/${documentId}?section=${toc.data[0].pageSectionId}`);
    }, [section, toc.data, documentId, router]);

    // 페이지가 바뀌어 데이터가 도착한 뒤에만 해시 블록으로 스크롤
    const pageId = page.data?.section.id;
    useEffect(() => {
        if (!pageId) return;
        const key = decodeURIComponent(window.location.hash.slice(1));
        if (key) setTimeout(() => scrollToBlock(key), 50);
        else window.scrollTo({top: 0});
    }, [pageId]);

    const goTo = useCallback((pageSectionId: string, blockKey?: string) => {
        setSelection(null);
        setTab("read");
        if (pageSectionId === section && blockKey) {
            window.history.replaceState(null, "", `?section=${pageSectionId}#${blockKey}`);
            scrollToBlock(blockKey);
            return;
        }
        router.push(`/study/${documentId}?section=${pageSectionId}${blockKey ? `#${blockKey}` : ""}`);
    }, [section, documentId, router]);

    const onSelectionEnd = () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !containerRef.current) return setSelection(null);
        const range = sel.getRangeAt(0);
        const anchor = rangeToAnchor(range, containerRef.current);
        setSelection(anchor ? {anchor, rect: range.getBoundingClientRect()} : null);
    };

    const mark = (color: AnnotationColor, note?: string) => {
        if (!selection) return;
        const {anchor} = selection;
        createAnnotation.mutate({
            documentId, color, note,
            startBlockKey: anchor.startBlockKey, startOffset: anchor.startOffset,
            endBlockKey: anchor.endBlockKey, endOffset: anchor.endOffset,
        }, {onError: (e) => show(errorMessage(e, "마킹하지 못했습니다."), "error")});
        window.getSelection()?.removeAllRanges();
        setSelection(null);
    };

    if (doc.isLoading) return <div className="mx-auto max-w-3xl px-4"><Skeleton className="h-64"/></div>;
    if (!doc.data) return <p className="p-8 text-center text-slate-500">문서를 찾을 수 없습니다.</p>;
    if (!ready) {
        return (
            <div className="mx-auto max-w-xl p-8 text-center text-slate-600">
                <p className="text-lg font-semibold">{doc.data.title}</p>
                <p className="mt-2">{doc.data.status === "PARSING" ? "문서를 분석하고 있습니다. 목록에서 준비되면 다시 열어 주세요."
                    : `분석에 실패했습니다: ${doc.data.failReason ?? ""}`}</p>
                <Link href="/study" className="mt-4 inline-block text-indigo-600 hover:underline">← 문서 목록</Link>
            </div>
        );
    }

    const tocTree = toc.data &&
        <TocTree nodes={toc.data} activePageSectionId={section} onSelect={(n) => goTo(n.pageSectionId, n.anchorBlockKey)}/>;

    return (
        <div className="mx-auto max-w-[1280px] px-4">
            <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
                <Link href="/study" className="text-sm text-slate-500 hover:text-indigo-600">← 목록</Link>
                <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900">{doc.data.title}</h1>
                <div className="flex gap-1 text-sm" role="tablist">
                    {(["read", "terms"] as const).map((t) => (
                        <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)}
                                className={`rounded px-3 py-1 ${tab === t ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                            {t === "read" ? "본문" : "단어장"}
                        </button>
                    ))}
                    <Link href={`/study/notes?documentId=${documentId}`} className="rounded px-3 py-1 text-slate-600 hover:bg-slate-100">노트</Link>
                </div>
            </div>
            <details className="mb-4 rounded-lg border border-slate-200 bg-white p-2 lg:hidden">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">목차</summary>
                <div className="mt-2 max-h-[60vh] overflow-y-auto">{tocTree}</div>
            </details>
            <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)_220px]">
                <aside className="hidden lg:block">
                    <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2">{tocTree}</div>
                </aside>
                <main className="min-w-0 max-w-[760px]">
                    {tab === "terms" ? <TermsPanel documentId={documentId} onError={(m) => show(m, "error")}/>
                        : page.data ? (
                            <PageView page={page.data} documentId={documentId} containerRef={containerRef}
                                      onNavigate={(s) => goTo(s.id)} onAnnotationClick={setOpenAnnotation}
                                      onSelectionEnd={onSelectionEnd}/>
                        ) : <Skeleton className="h-96"/>}
                </main>
                <aside className="hidden lg:block">
                    <div className="sticky top-4">
                        {page.data && tab === "read" &&
                            <PageOutline items={page.data.outline} onSelect={(k) => goTo(page.data!.section.id, k)}/>}
                    </div>
                </aside>
            </div>
            {selection && (
                <SelectionToolbar rect={selection.rect} onMark={mark} onClose={() => setSelection(null)}
                                  onAddTerm={() => {
                                      setTermDraft(selection.anchor.text);
                                      setSelection(null);
                                  }}/>
            )}
            {termDraft !== null && (
                <TermEditModal initialTerm={termDraft} documentId={documentId} onClose={() => setTermDraft(null)}
                               onError={(m) => show(m, "error")} onSaved={() => show("단어장에 추가했습니다")}/>
            )}
            {openAnnotation && (
                <AnnotationPopover annotationId={openAnnotation} documentId={documentId}
                                   onClose={() => setOpenAnnotation(null)} onError={(m) => show(m, "error")}/>
            )}
            {ToastComponent}
        </div>
    );
}
