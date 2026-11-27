"use client";

import {useState} from "react";
import type {SettingGroup} from "@/types/settings";
import Button from "@/components/ui/Button";

/** 기준정보 왼쪽 그룹 목록 (검색 입력으로 이름 필터) */
export default function SettingsNav({groups, activeId, onSelect}: {
    groups: SettingGroup[]; activeId: string; onSelect: (id: string) => void;
}) {
    const [q, setQ] = useState("");
    const shown = groups.filter((g) => g.label.toLowerCase().includes(q.trim().toLowerCase()));
    return (
        <nav aria-label="기준정보 그룹" className="w-full shrink-0 md:w-56">
            <input type="search" placeholder="검색" aria-label="그룹 검색" value={q} onChange={(e) => setQ(e.target.value)}
                   className="mb-3 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
            <ul className="space-y-0.5">
                {shown.map(({id, label, icon: Icon}) => (
                    <li key={id}>
                        <Button variant="unstyled" type="button" onClick={() => onSelect(id)} aria-current={id === activeId ? "page" : undefined}
                                className={[
                                    "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors",
                                    id === activeId ? "bg-d94-brand font-medium text-white" : "text-slate-700 hover:bg-slate-100",
                                ].join(" ")}>
                            <Icon className="h-4 w-4 shrink-0" aria-hidden/>
                            {label}
                        </Button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
