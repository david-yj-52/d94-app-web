"use client";

import {useEffect, useState} from "react";
import {useNoteTitles} from "@/hooks/useDocs";

interface QuickSwitcherProps {
    onOpenTitle: (title: string) => void;
    onClose: () => void;
}

/** Cmd/Ctrl+K: 제목 검색 → Enter 로 이동. 일치하는 노트가 없으면 그 제목으로 만든다 (useOpenNote) */
export default function QuickSwitcher({onOpenTitle, onClose}: QuickSwitcherProps) {
    const [q, setQ] = useState("");
    const [cursor, setCursor] = useState(0);
    const titles = useNoteTitles(q.trim());
    const items = titles.data ?? [];
    const exact = items.includes(q.trim());
    const options = q.trim() && !exact ? [...items, `+ "${q.trim()}" 만들기`] : items;
    useEffect(() => setCursor(0), [q]);
    const pick = (i: number) => {
        const t = i < items.length ? items[i] : q.trim();
        if (!t) return;
        onClose();
        onOpenTitle(t);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="노트 제목으로 이동 또는 새로 만들기"
                       aria-label="노트 빠른 전환"
                       onKeyDown={(e) => {
                           if (e.key === "Escape") onClose();
                           if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, options.length - 1));
                           if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
                           if (e.key === "Enter") pick(cursor);
                       }}
                       className="h-10 w-full rounded-lg border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                <ul className="mt-2 max-h-80 overflow-y-auto">
                    {options.map((t, i) => (
                        <li key={t}>
                            <button type="button" onMouseEnter={() => setCursor(i)} onClick={() => pick(i)}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${i === cursor ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}>
                                {t}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
