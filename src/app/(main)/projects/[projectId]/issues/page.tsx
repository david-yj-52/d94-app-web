"use client";

import CreateIssueModal from "@/components/issue/CreateIssueModal";
import IssueFilter from "@/components/issue/IssueFilter";
import IssueTable from "@/components/issue/IssueTable";
import ProjectNav from "@/components/project/ProjectNav";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useIssues} from "@/hooks/useIssues";
import {useProject} from "@/hooks/useProjects";
import type {IssueFilterParams} from "@/types/issue";
import Link from "next/link";
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
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Link href="/projects" className="hover:text-slate-600">
                    프로젝트
                </Link>
                <span>/</span>
                <span className="text-slate-700 font-medium">
          {project?.name ?? "..."}
        </span>
            </div>

            <ProjectNav projectId={projectId}/>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">이슈 목록</h1>
                    {page && (
                        <p className="text-sm text-slate-500 mt-0.5">
                            총 {page.totalElements}개
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shrink-0"
                >
                    + 이슈 생성
                </button>
            </div>

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
