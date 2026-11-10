"use client";

import PageHeader from "@/components/cira/ui/PageHeader";
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
            <PageHeader breadcrumbs={[{label: "프로젝트", href: "/cira/projects"}, {label: project?.name ?? "..."}]} title="리포트"/>
            <div className="flex gap-0 border-b border-slate-200 mb-6">
                {REPORT_TABS.map(({key, label}) => {
                    const href = `/cira/projects/${projectId}/reports/${key}`;
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
