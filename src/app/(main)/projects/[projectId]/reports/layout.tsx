"use client";

import ProjectNav from "@/components/project/ProjectNav";
import {useProject} from "@/hooks/useProjects";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {use} from "react";

const REPORT_TABS = [
    {key: "burndown", label: "번다운 차트"},
    {key: "velocity", label: "Velocity"},
    {key: "cfd", label: "CFD 차트"},
];

export default function ReportsLayout({
                                          children,
                                          params,
                                      }: {
    children: React.ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: project} = useProject(projectId);
    const pathname = usePathname();

    return (
        <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Link href="/projects" className="hover:text-slate-600">
                    프로젝트
                </Link>
                <span>/</span>
                <span className="text-slate-700 font-medium">{project?.name ?? "..."}</span>
            </div>

            <ProjectNav projectId={projectId}/>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">리포트</h1>
                    <p className="text-sm text-slate-500 mt-0.5">스프린트 및 프로젝트 현황을 분석합니다.</p>
                </div>
            </div>

            <div className="flex gap-0 border-b border-slate-200 mb-6">
                {REPORT_TABS.map(({key, label}) => {
                    const href = `/projects/${projectId}/reports/${key}`;
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={key}
                            href={href}
                            className={[
                                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors no-underline",
                                active
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
                            ].join(" ")}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>

            {children}
        </div>
    );
}
