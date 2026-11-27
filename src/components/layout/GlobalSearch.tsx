"use client";

import {searchIssues} from "@/lib/api/search";
import type {IssueResponse} from "@/types/issue";
import {Search, X} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import Button from "@/components/ui/Button";

export default function GlobalSearch() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IssueResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cmd+K / Ctrl+K shortcut
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
            }
            if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
                setResults([]);
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    // Close on outside click
    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await searchIssues({q: query, size: 5});
                setResults(res.content);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function openSearch() {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    }

    function close() {
        setOpen(false);
        setQuery("");
        setResults([]);
    }

    function goToIssue(issue: IssueResponse) {
        router.push(`/cira/projects/${issue.projectId}/issues/${issue.id}`);
        close();
    }

    function goToFullResults() {
        router.push(`/cira/search?q=${encodeURIComponent(query)}`);
        close();
    }

    const showDropdown = open && (query.trim().length > 0 || loading);

    return (
        <div ref={containerRef} className="relative min-w-0 max-w-[16rem] flex-1 sm:w-64 sm:flex-none">
            {/* Search trigger / input */}
            <div
                className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                    open
                        ? "border-d94-brand bg-white shadow-sm"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                }`}
                onClick={openSearch}
            >
                <Search className="h-3.5 w-3.5 shrink-0 text-gray-400"/>
                {open ? (
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="검색..."
                        className="min-w-0 flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    />
                ) : (
                    <span className="flex-1 truncate text-gray-400">검색...</span>
                )}
                <kbd
                    className="hidden sm:inline-flex h-5 items-center rounded border border-gray-200 bg-white px-1.5 text-[10px] font-mono text-gray-500">
                    ⌘K
                </kbd>
                {open && query && (
                    <Button variant="unstyled"
                        onClick={(e) => {
                            e.stopPropagation();
                            setQuery("");
                            setResults([]);
                            inputRef.current?.focus();
                        }}
                    >
                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600"/>
                    </Button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="fixed inset-x-3 top-14 z-50 rounded-xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-10 sm:w-80 border border-gray-200 bg-white shadow-lg">
                    {loading ? (
                        <div className="px-4 py-3 text-sm text-gray-400">검색 중...</div>
                    ) : results.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">결과 없음</div>
                    ) : (
                        <>
                            <ul className="divide-y divide-gray-100">
                                {results.map((issue) => (
                                    <li key={issue.id}>
                                        <Button variant="unstyled"
                                            className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-gray-50"
                                            onClick={() => goToIssue(issue)}
                                        >
                                            <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-blue-500">
                          {issue.issueKey}
                        </span>
                                                {issue.statusNm && (
                                                    <span
                                                        className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {issue.statusNm}
                          </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-800 line-clamp-1">
                        {issue.title}
                      </span>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-gray-100">
                                <Button variant="unstyled"
                                    className="flex w-full items-center justify-center px-4 py-2.5 text-sm text-d94-brand hover:bg-d94-brand-soft"
                                    onClick={goToFullResults}
                                >
                                    <Search className="mr-1.5 h-3.5 w-3.5"/>
                                    &quot;{query}&quot; 전체 결과 보기
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
