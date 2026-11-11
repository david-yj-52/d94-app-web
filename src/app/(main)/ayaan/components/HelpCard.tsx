"use client";

import {useId, useState} from "react";
import {CONFIG_HELP} from "../constant/help";

const SECTIONS = [
    ["what", "무엇인가"],
    ["defaultRange", "기본값·범위"],
    ["whenToChange", "언제 바꾸나"],
    ["example", "예시"],
    ["caution", "주의"],
] as const;

/** 설정 입력란 옆 `?` 툴팁(포커스/호버로 표시) + 펼침 설명 카드. 문구는 constant/help.ts */
export default function HelpCard({helpKey, defaultOpen = false}: { helpKey: string; defaultOpen?: boolean }) {
    const help = CONFIG_HELP[helpKey];
    const [open, setOpen] = useState(defaultOpen);
    const tipId = useId();
    const cardId = useId();
    if (!help) return null;
    return (
        <div className="mt-1">
            <div className="flex items-center gap-2">
                <span className="group relative inline-flex">
                    <button type="button" aria-label={`${help.label} 도움말`} aria-describedby={tipId}
                            className="h-5 w-5 rounded-full border border-slate-300 text-xs text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">?
                    </button>
                    <span id={tipId} role="tooltip"
                          className="pointer-events-none absolute left-6 top-0 z-20 hidden w-64 rounded-lg bg-slate-800 px-2 py-1 text-xs text-white shadow-lg group-focus-within:block group-hover:block">
                        {help.tooltip}
                    </span>
                </span>
                <button type="button" aria-expanded={open} aria-controls={cardId} onClick={() => setOpen(!open)}
                        className="text-xs text-blue-600 hover:underline">
                    {open ? "설명 접기" : "설명 펼치기"}
                </button>
            </div>
            {open && (
                <dl id={cardId} className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    {SECTIONS.map(([field, title]) => (
                        <div key={field}>
                            <dt className="font-semibold text-slate-900">{title}</dt>
                            <dd className="whitespace-pre-wrap">{help[field]}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}
