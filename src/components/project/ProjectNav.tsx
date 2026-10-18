"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useSession} from "next-auth/react";
import {useProjectMembers} from "@/hooks/useProjectSettings";

interface Props {
    projectId: string;
}

export default function ProjectNav({projectId}: Props) {
    const pathname = usePathname();
    const {data: session} = useSession();
    const {data: members} = useProjectMembers(projectId);

    const currentUserEmail = session?.user?.email;
    const isAdmin =
        currentUserEmail != null &&
        members?.some(
            (m) => m.email === currentUserEmail && m.role === "ADMIN",
        ) === true;

    const tabs = [
        {href: `/projects/${projectId}/issues`, label: "이슈"},
        {href: `/projects/${projectId}/boards`, label: "보드"},
        {href: `/projects/${projectId}/sprints`, label: "스프린트"},
        {href: `/projects/${projectId}/versions`, label: "버전"},
        {href: `/projects/${projectId}/reports`, label: "리포트"},
        {href: `/projects/${projectId}/wiki`, label: "Wiki"},
        ...(isAdmin
            ? [{href: `/projects/${projectId}/settings`, label: "설정"}]
            : []),
    ];

    return (
        <div className="flex gap-0 border-b border-slate-200 mb-6">
            {tabs.map(({href, label}) => {
                const active =
                    pathname === href || pathname.startsWith(href + "/");
                return (
                    <Link
                        key={href}
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
    );
}
