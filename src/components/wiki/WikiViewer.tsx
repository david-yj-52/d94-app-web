"use client";

import type {WikiPageResponse} from "@/lib/api/wiki";
import {Clock, Edit3} from "lucide-react";

interface WikiViewerProps {
    page: WikiPageResponse;
    onEdit: () => void;
    onShowVersions: () => void;
}

export default function WikiViewer({page, onEdit, onShowVersions}: WikiViewerProps) {
    const updatedDate = new Date(page.updatedAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{page.title}</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        {page.createdBy} · v{page.version} · {updatedDate}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                        onClick={onShowVersions}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 text-slate-500 text-sm hover:bg-slate-50"
                    >
                        <Clock size={13}/>
                        버전 이력
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                        <Edit3 size={13}/>
                        편집
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
                {page.contentHtml ? (
                    <div
                        className="wiki-prose"
                        dangerouslySetInnerHTML={{__html: page.contentHtml}}
                    />
                ) : (
                    <p className="text-slate-400 text-sm italic">내용이 없습니다. 편집을 눌러 작성하세요.</p>
                )}
            </div>
        </div>
    );
}
