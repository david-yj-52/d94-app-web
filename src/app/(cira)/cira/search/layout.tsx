"use client";

import PageHeader from "@/components/cira/ui/PageHeader";
import Link from "next/link";
import {usePathname} from "next/navigation";

const MODES = [
    {href: "/cira/search", label: "기본"},
    {href: "/cira/search/advanced", label: "CQL"},
];

// 기본 검색 ↔ CQL 고급 검색 토글 (Jira 의 Basic/JQL 전환)
export default function SearchLayout({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    return (
        <>
            <div className="mx-auto max-w-6xl px-4">
                <PageHeader
                    title="검색"
                    actions={
                        <div className="inline-flex rounded border border-cira-border bg-cira-surface p-0.5 text-sm">
                            {MODES.map((m) => (
                                <Link
                                    key={m.href}
                                    href={m.href}
                                    aria-current={pathname === m.href ? "page" : undefined}
                                    className={`rounded px-3 py-1 font-medium ${pathname === m.href ? "bg-cira-brand text-white" : "text-cira-muted hover:text-cira-text"}`}
                                >
                                    {m.label}
                                </Link>
                            ))}
                        </div>
                    }
                />
            </div>
            {children}
        </>
    );
}
