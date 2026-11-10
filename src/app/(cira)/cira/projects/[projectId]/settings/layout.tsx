"use client";

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
                <Link href="/cira/projects" className="hover:text-slate-600">
                    프로젝트
                </Link>
                <span>/</span>
                <span className="text-slate-700 font-medium">
          {project?.name ?? "..."}
        </span>
            </div>


            <div className="min-w-0">{children}</div>
        </div>
    );
}
