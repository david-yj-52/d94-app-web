"use client";

import IssueTable from "@/components/issue/IssueTable";
import CqlEditor from "@/components/search/CqlEditor";
import CqlSyntaxGuide from "@/components/search/CqlSyntaxGuide";
import {useCqlSearch} from "@/hooks/useCqlSearch";
import {ArrowLeft, ChevronLeft, ChevronRight, Search,} from "lucide-react";
import Link from "next/link";
import {useState} from "react";

export default function AdvancedSearchPage() {
    const [cql, setCql] = useState("");
    const [searchCql, setSearchCql] = useState("");
    const [page, setPage] = useState(0);
    const [triggered, setTriggered] = useState(false);

    const {data: result, isLoading, isError, error} = useCqlSearch(
        searchCql,
        page,
        20,
        triggered,
    );

    const issues = result?.content ?? [];
    const totalPages = result?.totalPages ?? 0;
    const totalElements = result?.totalElements ?? 0;

    function handleSearch() {
        if (!cql.trim()) return;
        setSearchCql(cql);
        setPage(0);
        setTriggered(true);
    }

    function handleInsertQuery(query: string) {
        setCql(query);
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <Link
                    href="/cira/search"
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4"/>
                    일반 검색으로 돌아가기
                </Link>
                <span className="text-gray-300">/</span>
                <h1 className="text-lg font-semibold text-gray-900">
                    고급 검색 (CQL)
                </h1>
            </div>

            {/* CQL Editor */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    CQL 쿼리
                </p>
                <CqlEditor
                    value={cql}
                    onChange={setCql}
                    onSearch={handleSearch}
                />
            </div>

            {/* Syntax Guide */}
            <div className="mb-6">
                <CqlSyntaxGuide onInsert={handleInsertQuery}/>
            </div>

            {/* Results */}
            <div>
                {/* Result count header */}
                {triggered && (
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {isLoading ? (
                                "검색 중..."
                            ) : isError ? null : (
                                <>
                  <span className="font-semibold text-gray-800">
                    {totalElements}
                  </span>
                                    개 결과
                                    {searchCql && (
                                        <span className="ml-2 font-mono text-xs text-gray-400">
                      ({searchCql.length > 60 ? searchCql.slice(0, 60) + "…" : searchCql})
                    </span>
                                    )}
                                </>
                            )}
                        </p>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-2">
                        {Array.from({length: 5}).map((_, i) => (
                            <div
                                key={i}
                                className="h-12 animate-pulse rounded-xl bg-gray-100"
                            />
                        ))}
                    </div>
                )}

                {/* Error */}
                {isError && triggered && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                        <p className="font-semibold">검색 오류</p>
                        <p className="mt-0.5 text-xs opacity-80">
                            {(error as Error)?.message ?? "CQL 문법을 확인해주세요."}
                        </p>
                    </div>
                )}

                {/* Empty state — not yet searched */}
                {!triggered && (
                    <div className="py-20 text-center text-gray-400">
                        <Search className="mx-auto mb-3 h-10 w-10 opacity-20"/>
                        <p className="font-medium">CQL을 입력하고 검색하세요</p>
                        <p className="mt-1 text-sm">
                            위 가이드의 예시 쿼리를 클릭해 바로 시작해보세요.
                        </p>
                    </div>
                )}

                {/* Empty result */}
                {triggered && !isLoading && !isError && issues.length === 0 && (
                    <div className="py-20 text-center text-gray-400">
                        <Search className="mx-auto mb-3 h-10 w-10 opacity-20"/>
                        <p className="font-medium">검색 결과가 없습니다</p>
                        <p className="mt-1 text-sm">
                            다른 조건으로 검색해보세요.
                        </p>
                    </div>
                )}

                {/* Result table */}
                {!isLoading && !isError && issues.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <IssueTable issues={issues}/>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage((p) => p - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4"/>
                        </button>
                        <span className="text-sm text-gray-500">
              {page + 1} / {totalPages}
            </span>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage((p) => p + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4"/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
