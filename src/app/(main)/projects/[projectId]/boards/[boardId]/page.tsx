"use client";

import CreateBoardModal from "@/components/board/CreateBoardModal";
import KanbanBoard from "@/components/board/KanbanBoard";
import ProjectNav from "@/components/project/ProjectNav";
import {useToast} from "@/components/ui/Toast";
import {useBoards} from "@/hooks/useBoards";
import {useProject} from "@/hooks/useProjects";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {use, useState} from "react";

export default function BoardDetailPage({
                                            params,
                                        }: {
    params: Promise<{ projectId: string; boardId: string }>;
}) {
    const {projectId, boardId} = use(params);
    const router = useRouter();
    const {show, ToastComponent} = useToast();

    const {data: project} = useProject(projectId);
    const {data: boards} = useBoards(projectId);

    const [showCreate, setShowCreate] = useState(false);

    return (
        <div className="max-w-full px-4">
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

            <div className="flex items-center justify-between mb-0">
                <ProjectNav projectId={projectId}/>

                <div className="flex items-center gap-2 pb-1.5">
                    {/* Board selector */}
                    {boards && boards.length > 1 && (
                        <select
                            value={boardId}
                            onChange={(e) =>
                                router.push(
                                    `/projects/${projectId}/boards/${e.target.value}`,
                                )
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {boards.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.boardNm}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => setShowCreate(true)}
                        className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        + 보드 생성
                    </button>
                </div>
            </div>

            <KanbanBoard boardId={boardId} projectId={projectId}/>

            {showCreate && (
                <CreateBoardModal
                    projectId={projectId}
                    onClose={() => setShowCreate(false)}
                    onSuccess={(newBoardId) => {
                        show("보드가 생성되었습니다.");
                        router.push(`/projects/${projectId}/boards/${newBoardId}`);
                    }}
                />
            )}

            {ToastComponent}
        </div>
    );
}
