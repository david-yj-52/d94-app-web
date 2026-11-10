"use client";

import PageHeader from "@/components/cira/ui/PageHeader";
import {useProject} from "@/hooks/useProjects";
import {use} from "react";

export default function VersionsLayout({
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
            <PageHeader breadcrumbs={[{label: "프로젝트", href: "/cira/projects"}, {label: project?.name ?? "..."}]} title="릴리스"/>
            <div>{children}</div>
        </div>
    );
}
