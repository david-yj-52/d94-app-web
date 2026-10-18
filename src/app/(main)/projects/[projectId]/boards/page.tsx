"use client";

import CreateBoardModal from "@/components/board/CreateBoardModal";
import ProjectNav from "@/components/project/ProjectNav";
import {useToast} from "@/components/ui/Toast";
import {useBoards} from "@/hooks/useBoards";
import {useProject} from "@/hooks/useProjects";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {use, useEffect, useState} from "react";

export default function BoardsPage({
                                       params,
                                   }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const router = useRouter();
    const {show, ToastComponent} = useToast();

    const {data: project} = useProject(projectId);
    const {data: boards, isLoading, isError} = useBoards(projectId);

    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        if (boards && boards.length > 0) {
            router.replace(`/projects/${projectId}/boards/${boards[0].id}`);
        }
    }, [boards, projectId, router]);

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

            {isLoading && (
                <div className="flex gap-4">
                    {Array.from({length: 2}).map((_, i) => (
                        <div
                            key={i}
                            className="w-56 h-28 bg-slate-100 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            )}

            {isError && (
                <div className="text-center py-20 text-slate-400">
                    보드를 불러오는 데 실패했습니다.
                </div>
            )}

            {!isLoading && !isError && (!boards || boards.length === 0) && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">
                        보드가 없습니다.
                    </p>
                    <p className="text-sm mb-6">새 보드를 생성해서 이슈를 관리하세요.</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        + 보드 생성
                    </button>
                </div>
            )}

            {showCreate && (
                <CreateBoardModal
                    projectId={projectId}
                    onClose={() => setShowCreate(false)}
                    onSuccess={(boardId) => {
                        show("보드가 생성되었습니다.");
                        router.push(`/projects/${projectId}/boards/${boardId}`);
                    }}
                />
            )}

            {ToastComponent}
        </div>
    );
}
