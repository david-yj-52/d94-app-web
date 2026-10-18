"use client";

import {useDeleteFilter, useSavedFilters, useSaveFilter, useSearchIssues} from "@/hooks/useSearch";
import {useProjects} from "@/hooks/useProjects";
import type {SavedFilter, SearchIssuesParams} from "@/lib/api/search";
import type {Priority} from "@/types/issue";
import {ChevronLeft, ChevronRight, Filter, Save, Search, X,} from "lucide-react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {Suspense, useCallback, useMemo, useState} from "react";

const PRIORITIES: { value: Priority; label: string }[] = [
    {value: "HIGHEST", label: "최상"},
    {value: "HIGH", label: "높음"},
    {value: "MEDIUM", label: "보통"},
    {value: "LOW", label: "낮음"},
    {value: "LOWEST", label: "최하"},
];

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

const SORT_OPTIONS: { value: SearchIssuesParams["sort"]; label: string }[] = [
    {value: "relevance", label: "관련도"},
    {value: "newest", label: "최신"},
    {value: "updated", label: "업데이트"},
];

function parseSearchParams(sp: URLSearchParams): SearchIssuesParams {
    return {
        q: sp.get("q") ?? "",
        projectIds: sp.getAll("projectIds"),
        status: sp.getAll("status"),
        priority: sp.getAll("priority"),
        assigneeId: sp.getAll("assigneeId"),
        dateFrom: sp.get("dateFrom") ?? undefined,
        dateTo: sp.get("dateTo") ?? undefined,
        sort: (sp.get("sort") as SearchIssuesParams["sort"]) ?? "relevance",
        page: Number(sp.get("page") ?? 0),
        size: 20,
    };
}

function buildQueryString(params: SearchIssuesParams): string {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    params.projectIds?.forEach((id) => sp.append("projectIds", id));
    params.status?.forEach((s) => sp.append("status", s));
    params.priority?.forEach((p) => sp.append("priority", p));
    params.assigneeId?.forEach((id) => sp.append("assigneeId", id));
    if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
    if (params.dateTo) sp.set("dateTo", params.dateTo);
    if (params.sort && params.sort !== "relevance") sp.set("sort", params.sort);
    if (params.page) sp.set("page", String(params.page));
    return sp.toString();
}

function ActiveFilterTag({
                             label,
                             onRemove,
                         }: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
      {label}
            <button onClick={onRemove} className="hover:text-blue-900">
        <X className="h-3 w-3"/>
      </button>
    </span>
    );
}

function SaveFilterModal({
                             onSave,
                             onClose,
                         }: {
    onSave: (name: string) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="mb-4 text-base font-semibold text-gray-900">필터 저장</h3>
                <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
                    placeholder="필터 이름 입력"
                    className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="h-9 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        취소
                    </button>
                    <button
                        disabled={!name.trim()}
                        onClick={() => onSave(name.trim())}
                        className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}

function SearchPageContent() {
    const router = useRouter();
    const rawSearchParams = useSearchParams();
    const params = useMemo(
        () => parseSearchParams(rawSearchParams),
        [rawSearchParams],
    );

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [qInput, setQInput] = useState(params.q);

    const {data: projects} = useProjects();
    const {data: savedFilters} = useSavedFilters();
    const saveFilterMut = useSaveFilter();
    const deleteFilterMut = useDeleteFilter();

    const {data: searchResult, isLoading} = useSearchIssues(params, !!params.q);

    const issues = searchResult?.content ?? [];
    const totalPages = searchResult?.totalPages ?? 0;
    const totalElements = searchResult?.totalElements ?? 0;

    const push = useCallback(
        (next: Partial<SearchIssuesParams>) => {
            const merged = {...params, ...next};
            router.push(`/search?${buildQueryString(merged)}`);
        },
        [params, router],
    );

    function toggleArray<T extends string>(
        arr: T[] | undefined,
        value: T,
    ): T[] {
        const current = arr ?? [];
        return current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
    }

    function handleSaveFilter(name: string) {
        saveFilterMut.mutate(
            {name, params},
            {onSuccess: () => setShowSaveModal(false)},
        );
    }

    function applySavedFilter(filter: SavedFilter) {
        router.push(`/search?${buildQueryString(filter.params)}`);
        setQInput(filter.params.q);
    }

    // Active filter tags
    const filterTags: { label: string; remove: () => void }[] = [];
    (params.projectIds ?? []).forEach((id) => {
        const proj = projects?.find((p) => p.id === id);
        filterTags.push({
            label: `프로젝트: ${proj?.name ?? id}`,
            remove: () => push({projectIds: (params.projectIds ?? []).filter((v) => v !== id), page: 0}),
        });
    });
    (params.status ?? []).forEach((s) =>
        filterTags.push({
            label: `상태: ${s}`,
            remove: () => push({status: (params.status ?? []).filter((v) => v !== s), page: 0}),
        }),
    );
    (params.priority ?? []).forEach((p) =>
        filterTags.push({
            label: `우선순위: ${p}`,
            remove: () => push({priority: (params.priority ?? []).filter((v) => v !== p), page: 0}),
        }),
    );
    if (params.dateFrom)
        filterTags.push({
            label: `시작: ${params.dateFrom}`,
            remove: () => push({dateFrom: undefined, page: 0}),
        });
    if (params.dateTo)
        filterTags.push({
            label: `종료: ${params.dateTo}`,
            remove: () => push({dateTo: undefined, page: 0}),
        });

    const hasFilters =
        filterTags.length > 0 ||
        (params.assigneeId ?? []).length > 0;

    return (
        <div className="mx-auto max-w-6xl px-4">
            {/* Search bar */}
            <div className="mb-6 flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                    <input
                        type="text"
                        value={qInput}
                        onChange={(e) => setQInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") push({q: qInput, page: 0});
                        }}
                        placeholder="이슈 검색..."
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => push({q: qInput, page: 0})}
                    className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    검색
                </button>
                <Link
                    href="/search/advanced"
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="CQL 고급 검색"
                >
                    고급 검색 (CQL)
                </Link>
            </div>

            {/* Active filters + controls */}
            {(filterTags.length > 0 || params.q) && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {filterTags.map((t) => (
                        <ActiveFilterTag key={t.label} label={t.label} onRemove={t.remove}/>
                    ))}
                    {hasFilters && (
                        <button
                            onClick={() => {
                                router.push(`/search?q=${encodeURIComponent(params.q)}`);
                                setQInput(params.q);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                            필터 초기화
                        </button>
                    )}
                    {params.q && (
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            <Save className="h-3.5 w-3.5"/>
                            필터 저장
                        </button>
                    )}
                </div>
            )}

            <div className="flex gap-6">
                {/* Filter panel */}
                <aside className="w-56 shrink-0 space-y-5">
                    {/* Saved filters */}
                    {savedFilters && savedFilters.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                저장된 필터
                            </p>
                            <ul className="space-y-1">
                                {savedFilters.map((f) => (
                                    <li key={f.id} className="flex items-center gap-1">
                                        <button
                                            onClick={() => applySavedFilter(f)}
                                            className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Filter className="mr-1.5 inline h-3.5 w-3.5 text-gray-400"/>
                                            {f.name}
                                        </button>
                                        <button
                                            onClick={() => deleteFilterMut.mutate(f.id)}
                                            disabled={deleteFilterMut.isPending}
                                            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
                                            title="필터 삭제"
                                        >
                                            <X className="h-3.5 w-3.5"/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <hr className="mt-3 border-gray-100"/>
                        </div>
                    )}

                    {/* Projects */}
                    {projects && projects.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                프로젝트
                            </p>
                            <ul className="space-y-1.5">
                                {projects.map((p) => {
                                    const checked = (params.projectIds ?? []).includes(p.id);
                                    return (
                                        <li key={p.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`proj-${p.id}`}
                                                checked={checked}
                                                onChange={() =>
                                                    push({
                                                        projectIds: toggleArray(params.projectIds, p.id),
                                                        page: 0,
                                                    })
                                                }
                                                className="h-3.5 w-3.5 rounded accent-blue-600"
                                            />
                                            <label
                                                htmlFor={`proj-${p.id}`}
                                                className="cursor-pointer truncate text-sm text-gray-700"
                                            >
                                                {p.name}
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            상태
                        </p>
                        <ul className="space-y-1.5">
                            {STATUS_OPTIONS.map((s) => {
                                const checked = (params.status ?? []).includes(s);
                                return (
                                    <li key={s} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`status-${s}`}
                                            checked={checked}
                                            onChange={() =>
                                                push({status: toggleArray(params.status, s), page: 0})
                                            }
                                            className="h-3.5 w-3.5 rounded accent-blue-600"
                                        />
                                        <label
                                            htmlFor={`status-${s}`}
                                            className="cursor-pointer text-sm text-gray-700"
                                        >
                                            {s}
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Priority */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            우선순위
                        </p>
                        <ul className="space-y-1.5">
                            {PRIORITIES.map(({value, label}) => {
                                const checked = (params.priority ?? []).includes(value);
                                return (
                                    <li key={value} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`pri-${value}`}
                                            checked={checked}
                                            onChange={() =>
                                                push({
                                                    priority: toggleArray(params.priority, value),
                                                    page: 0,
                                                })
                                            }
                                            className="h-3.5 w-3.5 rounded accent-blue-600"
                                        />
                                        <label
                                            htmlFor={`pri-${value}`}
                                            className="cursor-pointer text-sm text-gray-700"
                                        >
                                            {label}
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Date range */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            생성일
                        </p>
                        <div className="space-y-2">
                            <input
                                type="date"
                                value={params.dateFrom ?? ""}
                                onChange={(e) =>
                                    push({dateFrom: e.target.value || undefined, page: 0})
                                }
                                className="h-8 w-full rounded-lg border border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                value={params.dateTo ?? ""}
                                onChange={(e) =>
                                    push({dateTo: e.target.value || undefined, page: 0})
                                }
                                className="h-8 w-full rounded-lg border border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </aside>

                {/* Results */}
                <div className="min-w-0 flex-1">
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {!params.q ? (
                                "검색어를 입력하세요."
                            ) : isLoading ? (
                                "검색 중..."
                            ) : (
                                <>
                                    <span className="font-semibold text-gray-800">{totalElements}</span>개 결과
                                </>
                            )}
                        </p>
                        <select
                            value={params.sort ?? "relevance"}
                            onChange={(e) =>
                                push({
                                    sort: e.target.value as SearchIssuesParams["sort"],
                                    page: 0,
                                })
                            }
                            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}순
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoading && (
                        <div className="space-y-2">
                            {Array.from({length: 6}).map((_, i) => (
                                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100"/>
                            ))}
                        </div>
                    )}

                    {!isLoading && params.q && issues.length === 0 && (
                        <div className="py-20 text-center text-gray-400">
                            <Search className="mx-auto mb-3 h-10 w-10 opacity-30"/>
                            <p className="font-medium">검색 결과가 없습니다.</p>
                            <p className="mt-1 text-sm">다른 검색어나 필터를 시도해보세요.</p>
                        </div>
                    )}

                    {!isLoading && issues.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-gray-200 text-left">
                                    <th className="pb-3 pl-5 pt-3 font-medium text-gray-500 w-28">키</th>
                                    <th className="pb-3 pt-3 font-medium text-gray-500">제목</th>
                                    <th className="pb-3 pt-3 font-medium text-gray-500 w-28 text-center">상태</th>
                                    <th className="pb-3 pt-3 font-medium text-gray-500 w-24 text-center">우선순위</th>
                                    <th className="pb-3 pr-5 pt-3 font-medium text-gray-500 w-28">담당자</th>
                                </tr>
                                </thead>
                                <tbody>
                                {issues.map((issue) => (
                                    <tr
                                        key={issue.id}
                                        onClick={() =>
                                            router.push(`/projects/${issue.projectId}/issues/${issue.id}`)
                                        }
                                        className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 last:border-0"
                                    >
                                        <td className="py-3 pl-5 font-mono text-xs text-gray-500">
                                            {issue.issueKey}
                                        </td>
                                        <td className="py-3 font-medium text-gray-900">{issue.title}</td>
                                        <td className="py-3 text-center">
                                            {issue.statusNm && (
                                                <span
                                                    className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {issue.statusNm}
                          </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-center text-xs font-medium text-gray-500">
                                            {issue.priority ?? "-"}
                                        </td>
                                        <td className="py-3 pr-5 text-xs text-gray-500">
                                            {issue.assignee?.name ?? "-"}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <button
                                disabled={(params.page ?? 0) === 0}
                                onClick={() => push({page: (params.page ?? 0) - 1})}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4"/>
                            </button>
                            <span className="text-sm text-gray-600">
                {(params.page ?? 0) + 1} / {totalPages}
              </span>
                            <button
                                disabled={(params.page ?? 0) >= totalPages - 1}
                                onClick={() => push({page: (params.page ?? 0) + 1})}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showSaveModal && (
                <SaveFilterModal
                    onSave={handleSaveFilter}
                    onClose={() => setShowSaveModal(false)}
                />
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-6xl px-4 py-10 text-center text-slate-400">
                    로딩 중...
                </div>
            }
        >
            <SearchPageContent/>
        </Suspense>
    );
}
