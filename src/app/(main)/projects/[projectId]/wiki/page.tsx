"use client";

import WikiEditor from "@/components/wiki/WikiEditor";
import WikiTree from "@/components/wiki/WikiTree";
import WikiVersionHistory from "@/components/wiki/WikiVersionHistory";
import WikiViewer from "@/components/wiki/WikiViewer";
import {
    useCreateWikiPage,
    useDeleteWikiPage,
    useUpdateWikiPage,
    useWikiPage,
    useWikiTree,
    useWikiVersions,
} from "@/hooks/useWiki";
import type {WikiVersionResponse} from "@/lib/api/wiki";
import {FileText} from "lucide-react";
import {Suspense, use, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";

type Mode = "view" | "edit" | "create" | "version-preview";

function WikiPageContent({projectId}: { projectId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pageId = searchParams.get("pageId");

    const [mode, setMode] = useState<Mode>("view");
    const [createParentId, setCreateParentId] = useState<string | undefined>();
    const [showVersions, setShowVersions] = useState(false);
    const [previewVersion, setPreviewVersion] = useState<WikiVersionResponse | null>(null);

    const {data: tree = [], isLoading: treeLoading} = useWikiTree(projectId);
    const {data: page, isLoading: pageLoading} = useWikiPage(pageId);
    const {data: versions = [], isLoading: versionsLoading} = useWikiVersions(
        showVersions ? pageId : null,
    );

    const createMutation = useCreateWikiPage(projectId);
    const updateMutation = useUpdateWikiPage(projectId);
    const deleteMutation = useDeleteWikiPage(projectId);

    function selectPage(id: string) {
        setMode("view");
        setShowVersions(false);
        setPreviewVersion(null);
        router.push(`/projects/${projectId}/wiki?pageId=${id}`);
    }

    function handleAddPage(parentId?: string) {
        setCreateParentId(parentId);
        setMode("create");
        setShowVersions(false);
    }

    function handleDeletePage(id: string, title: string) {
        if (!confirm(`"${title}" 페이지와 하위 페이지를 모두 삭제하시겠습니까?`)) return;
        deleteMutation.mutate(id, {
            onSuccess: () => {
                if (pageId === id) {
                    router.push(`/projects/${projectId}/wiki`);
                    setMode("view");
                }
            },
        });
    }

    function handleSaveNew(title: string, content: string) {
        createMutation.mutate(
            {title, content, parentId: createParentId},
            {
                onSuccess: (created) => {
                    setMode("view");
                    router.push(`/projects/${projectId}/wiki?pageId=${created.id}`);
                },
            },
        );
    }

    function handleSaveEdit(title: string, content: string) {
        if (!pageId) return;
        updateMutation.mutate(
            {pageId, data: {title, content}},
            {onSuccess: () => setMode("view")},
        );
    }

    function handlePreviewVersion(v: WikiVersionResponse) {
        setPreviewVersion(v);
        setMode("version-preview");
    }

    // ── main content area ──────────────────────────────────────────────
    function renderContent() {
        // create mode: no existing page needed
        if (mode === "create") {
            return (
                <WikiEditor
                    initialTitle=""
                    initialContent=""
                    onSave={handleSaveNew}
                    onCancel={() => setMode("view")}
                    isSaving={createMutation.isPending}
                />
            );
        }

        if (!pageId) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <FileText size={48} strokeWidth={1}/>
                    <p className="text-base font-medium text-slate-500">
                        페이지를 선택하거나 새 페이지를 만드세요
                    </p>
                </div>
            );
        }

        if (pageLoading) {
            return (
                <div className="flex-1 p-6 space-y-4">
                    <div className="h-8 w-1/2 bg-slate-100 rounded animate-pulse"/>
                    <div className="h-4 w-1/4 bg-slate-100 rounded animate-pulse"/>
                    <div className="h-40 bg-slate-100 rounded animate-pulse"/>
                </div>
            );
        }

        if (!page) {
            return (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    페이지를 불러오지 못했습니다.
                </div>
            );
        }

        if (mode === "edit") {
            return (
                <WikiEditor
                    initialTitle={page.title}
                    initialContent={page.content}
                    onSave={handleSaveEdit}
                    onCancel={() => setMode("view")}
                    isSaving={updateMutation.isPending}
                />
            );
        }

        if (mode === "version-preview" && previewVersion) {
            return (
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 bg-amber-50">
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              v{previewVersion.version} 미리보기
            </span>
                        <span className="text-xs text-amber-600">{previewVersion.createdBy}</span>
                        <button
                            className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline"
                            onClick={() => setMode("view")}
                        >
                            현재 버전으로 돌아가기
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <div
                            className="wiki-prose"
                            dangerouslySetInnerHTML={{__html: previewVersion.content}}
                        />
                    </div>
                </div>
            );
        }

        return (
            <WikiViewer
                page={page}
                onEdit={() => setMode("edit")}
                onShowVersions={() => setShowVersions((v) => !v)}
            />
        );
    }

    return (
        <div
            className="flex border border-slate-200 rounded-xl overflow-hidden bg-white"
            style={{height: "calc(100vh - 140px)"}}
        >
            {/* Sidebar tree */}
            <WikiTree
                pages={tree}
                selectedId={pageId}
                onSelect={selectPage}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
            />

            {/* Main area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">{renderContent()}</div>

                {/* Version history panel */}
                {showVersions && pageId && (
                    <WikiVersionHistory
                        versions={versions}
                        isLoading={versionsLoading}
                        onClose={() => {
                            setShowVersions(false);
                            setPreviewVersion(null);
                            setMode("view");
                        }}
                        onPreview={handlePreviewVersion}
                    />
                )}
            </div>
        </div>
    );
}

export default function WikiPage({
                                     params,
                                 }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    return (
        <Suspense
            fallback={
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    로딩 중...
                </div>
            }
        >
            <WikiPageContent projectId={projectId}/>
        </Suspense>
    );
}
