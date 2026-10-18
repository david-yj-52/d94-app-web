"use client";

import type {WikiVersionResponse} from "@/lib/api/wiki";
import {X} from "lucide-react";

interface WikiVersionHistoryProps {
    versions: WikiVersionResponse[];
    isLoading: boolean;
    onClose: () => void;
    onPreview: (version: WikiVersionResponse) => void;
}

export default function WikiVersionHistory({
                                               versions,
                                               isLoading,
                                               onClose,
                                               onPreview,
                                           }: WikiVersionHistoryProps) {
    return (
        <div className="w-72 shrink-0 border-l border-slate-200 flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">버전 이력</span>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                    <X size={15}/>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <div className="space-y-3 p-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse"/>
                        ))}
                    </div>
                )}

                {!isLoading && versions.length === 0 && (
                    <div className="text-xs text-slate-400 px-4 py-6 text-center">버전 이력이 없습니다.</div>
                )}

                {!isLoading &&
                    versions.map((v) => {
                        const date = new Date(v.createdAt).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        });
                        return (
                            <div
                                key={v.version}
                                className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-700">v{v.version}</span>
                                    <span className="text-xs text-slate-400">{date}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{v.createdBy}</p>
                                <button
                                    onClick={() => onPreview(v)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    이 버전 보기
                                </button>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
