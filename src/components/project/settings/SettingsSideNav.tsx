"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

interface Props {
    projectId: string;
}

const TABS = [
    {key: "general", label: "기본 정보", suffix: ""},
    {key: "members", label: "멤버", suffix: "/members"},
    {key: "workflow", label: "워크플로우", suffix: "/workflow"},
    {key: "git", label: "Git 연동", suffix: "/git"},
    {key: "automation", label: "자동화", suffix: "/automation"},
];

export default function SettingsSideNav({projectId}: Props) {
    const pathname = usePathname();
    const base = `/projects/${projectId}/settings`;

    return (
        <nav className="w-44 shrink-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                설정
            </p>
            <ul className="space-y-0.5">
                {TABS.map(({key, label, suffix}) => {
                    const href = `${base}${suffix}`;
                    const active = suffix === "" ? pathname === base : pathname.startsWith(href);
                    return (
                        <li key={key}>
                            <Link
                                href={href}
                                className={[
                                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline",
                                    active
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
                                ].join(" ")}
                            >
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
