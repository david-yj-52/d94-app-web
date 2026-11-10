"use client";

import CreateProjectModal from "@/components/project/CreateProjectModal";
import ProjectCard from "@/components/project/ProjectCard";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useProjects} from "@/hooks/useProjects";
import {useState} from "react";

export default function ProjectsPage() {
    const {data: projects, isLoading, isError} = useProjects();
    const [showCreate, setShowCreate] = useState(false);
    const {show, ToastComponent} = useToast();

    return (
        <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">프로젝트</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        팀 프로젝트를 관리하세요.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                    + 프로젝트 생성
                </button>
            </div>

            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({length: 6}).map((_, i) => (
                        <SkeletonCard key={i}/>
                    ))}
                </div>
            )}

            {isError && (
                <div className="text-center py-20 text-slate-400">
                    프로젝트를 불러오는 데 실패했습니다.
                </div>
            )}

            {!isLoading && !isError && (
                <>
                    {projects && projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((p) => (
                                <ProjectCard key={p.id} project={p}/>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <p className="text-lg font-medium mb-2">프로젝트가 없습니다.</p>
                            <p className="text-sm">새 프로젝트를 생성해보세요.</p>
                        </div>
                    )}
                </>
            )}

            {showCreate && (
                <CreateProjectModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => show("프로젝트가 생성되었습니다.")}
                />
            )}

            {ToastComponent}
        </div>
    );
}
