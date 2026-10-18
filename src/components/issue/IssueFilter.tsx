"use client";

import type {IssueFilterParams, Priority} from "@/types/issue";
import {useEffect, useState} from "react";

const PRIORITIES: Priority[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];

interface Props {
    filters: IssueFilterParams;
    onChange: (filters: IssueFilterParams) => void;
}

export default function IssueFilter({filters, onChange}: Props) {
    const [keyword, setKeyword] = useState(filters.keyword ?? "");

    useEffect(() => {
        const t = setTimeout(() => {
            if (keyword !== filters.keyword) {
                onChange({...filters, keyword: keyword || undefined, page: 0});
            }
        }, 400);
        return () => clearTimeout(t);
    }, [keyword]);

    return (
        <div className="flex flex-wrap gap-3 items-center">
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="이슈 검색..."
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />

            <select
                value={filters.priority ?? ""}
                onChange={(e) =>
                    onChange({
                        ...filters,
                        priority: (e.target.value as Priority) || undefined,
                        page: 0,
                    })
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">우선순위 전체</option>
                {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                        {p}
                    </option>
                ))}
            </select>

            {(filters.keyword || filters.priority) && (
                <button
                    onClick={() =>
                        onChange({page: 0, size: filters.size})
                    }
                    className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50"
                >
                    초기화
                </button>
            )}
        </div>
    );
}
