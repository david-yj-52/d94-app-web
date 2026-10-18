"use client";

import ProjectNav from "@/components/project/ProjectNav";
import SettingsSideNav from "@/components/project/settings/SettingsSideNav";
import {useProject} from "@/hooks/useProjects";
import Link from "next/link";
import {use} from "react";

export default function SettingsLayout({
                                           children,
                                           params,
                                       }: {
    children: React.ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: project} = useProject(projectId);

    return (
        <div className="max-w-6xl mx-auto px-4">
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

            <div className="flex gap-8">
                <SettingsSideNav projectId={projectId}/>
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
}
