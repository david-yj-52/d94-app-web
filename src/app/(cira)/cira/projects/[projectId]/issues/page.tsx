"use client";

import PageHeader from "@/components/cira/ui/PageHeader";
import CreateIssueModal from "@/components/issue/CreateIssueModal";
import IssueFilter from "@/components/issue/IssueFilter";
import IssueTable from "@/components/issue/IssueTable";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useIssues} from "@/hooks/useIssues";
import {useProject} from "@/hooks/useProjects";
import type {IssueFilterParams} from "@/types/issue";
import {use, useState} from "react";

const PAGE_SIZE = 20;

export default function IssueListPage({
                                          params,
                                      }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const [showCreate, setShowCreate] = useState(false);
    const [filters, setFilters] = useState<IssueFilterParams>({
        page: 0,
        size: PAGE_SIZE,
    });
    const {show, ToastComponent} = useToast();

    const {data: project} = useProject(projectId);
    const {
        data: page,
        isLoading,
        isError,
    } = useIssues(projectId, filters);

    const issues = page?.content ?? [];
    const totalPages = page?.totalPages ?? 0;
    const currentPage = filters.page ?? 0;

    return (
        <div className="max-w-6xl mx-auto px-4">
            <PageHeader breadcrumbs={[{label: "프로젝트", href: "/cira/projects"}, {label: project?.name ?? "..."}]} title="이슈" actions={<button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded bg-cira-brand text-white text-sm font-semibold hover:opacity-90 shrink-0">+ 이슈 생성</button>}/>
            <div className="mb-4">
                <IssueFilter filters={filters} onChange={setFilters}/>
            </div>

            <div className="bg-white rounded-xl border border-slate-200">
                {isLoading && (
                    <div>
                        {Array.from({length: 8}).map((_, i) => (
                            <SkeletonRow key={i}/>
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="text-center py-16 text-slate-400">
                        이슈를 불러오는 데 실패했습니다.
                    </div>
                )}

                {!isLoading && !isError && (
                    <IssueTable issues={issues} projectId={projectId}/>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        disabled={currentPage === 0}
                        onClick={() =>
                            setFilters((f) => ({...f, page: (f.page ?? 0) - 1}))
                        }
                        className="h-8 px-3 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50"
                    >
                        이전
                    </button>
                    <span className="text-sm text-slate-600">
            {currentPage + 1} / {totalPages}
          </span>
                    <button
                        disabled={currentPage >= totalPages - 1}
                        onClick={() =>
                            setFilters((f) => ({...f, page: (f.page ?? 0) + 1}))
                        }
                        className="h-8 px-3 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50"
                    >
                        다음
                    </button>
                </div>
            )}

            {showCreate && (
                <CreateIssueModal
                    projectId={projectId}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => show("이슈가 생성되었습니다.")}
                />
            )}

            {ToastComponent}
        </div>
    );
}
