"use client";

import {SkeletonRow} from "@/components/ui/Skeleton";
import type {InterfaceTestItemResponse} from "@/types/interfaceTest";
import {RefreshCw} from "lucide-react";

interface Props {
    items: InterfaceTestItemResponse[];
    isLoading: boolean;
    /** 목록 조회 실패 메시지 (상태코드 포함) */
    errorMessage?: string;
    selectedId: string;
    onSelect: (item: InterfaceTestItemResponse) => void;
    onRefresh: () => void;
}

const formatTime = (iso: string) => new Date(iso).toLocaleString("ko-KR", {hour12: false});

export default function InterfaceItemTable({items, isLoading, errorMessage, selectedId, onSelect, onRefresh}: Props) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h2 className="text-base font-bold text-slate-900">
                    DB 데이터 <span className="text-sm font-normal text-slate-500">({items.length}건, 최근 100건)</span>
                </h2>
                <button type="button" onClick={onRefresh}
                        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50">
                    <RefreshCw className="h-3.5 w-3.5"/> 새로고침
                </button>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <SkeletonRow key={i}/>)}</div>
            ) : errorMessage ? (
                <p className="bg-red-50 px-5 py-4 text-sm text-red-500">{errorMessage}</p>
            ) : items.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">데이터가 없습니다. POST 로 생성해 보세요.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs text-slate-500">
                        <tr>
                            <th className="px-4 py-2 font-medium">name</th>
                            <th className="px-4 py-2 font-medium">status</th>
                            <th className="px-4 py-2 font-medium">content</th>
                            <th className="px-4 py-2 font-medium">마지막 이벤트</th>
                            <th className="px-4 py-2 font-medium">수정 시각</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((item) => (
                            <tr key={item.id} onClick={() => onSelect(item)}
                                className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${item.id === selectedId ? "bg-blue-50" : ""}`}>
                                <td className="px-4 py-2 font-medium text-slate-900">{item.name}</td>
                                <td className="px-4 py-2">
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{item.status}</span>
                                </td>
                                <td className="max-w-xs truncate px-4 py-2 text-slate-700">{item.content ?? "—"}</td>
                                <td className="px-4 py-2 font-mono text-xs text-slate-500">{item.lastEvent}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-500">{formatTime(item.modifiedAt)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
