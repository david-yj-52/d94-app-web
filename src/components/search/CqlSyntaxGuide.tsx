"use client";

import {ChevronDown, ChevronUp, Clipboard} from "lucide-react";
import {useState} from "react";

interface CqlSyntaxGuideProps {
    onInsert: (query: string) => void;
}

const EXAMPLE_QUERIES = [
    {
        label: "특정 프로젝트의 진행 중 이슈",
        query: 'project = "PROJ-A" AND status = "In Progress"',
    },
    {
        label: "내 담당 높은 우선순위 이슈",
        query: "assignee = currentUser() AND priority in (HIGH, HIGHEST)",
    },
    {
        label: "열린 스프린트의 이슈 (우선순위 내림차순)",
        query: "sprint in openSprints() ORDER BY priority DESC",
    },
    {
        label: "최근 7일 내 생성된 스토리",
        query: 'created >= -7d AND type = "Story"',
    },
    {
        label: "미완료 고우선순위 이슈",
        query: 'status != "Done" AND priority in (HIGH, HIGHEST) ORDER BY created DESC',
    },
];

const FIELDS = [
    {name: "project", desc: "프로젝트 키"},
    {name: "status", desc: "이슈 상태"},
    {name: "assignee", desc: "담당자"},
    {name: "reporter", desc: "보고자"},
    {name: "priority", desc: "우선순위"},
    {name: "sprint", desc: "스프린트"},
    {name: "type", desc: "이슈 유형"},
    {name: "created", desc: "생성일"},
    {name: "updated", desc: "수정일"},
];

const OPERATORS = [
    {op: "=", desc: "같음"},
    {op: "!=", desc: "다름"},
    {op: ">  <  >=  <=", desc: "날짜/숫자 비교"},
    {op: "in (A, B)", desc: "목록 중 하나"},
    {op: "not in (A, B)", desc: "목록에 없음"},
    {op: "AND", desc: "두 조건 모두"},
    {op: "OR", desc: "둘 중 하나"},
    {op: "NOT", desc: "조건 부정"},
    {op: "ORDER BY", desc: "정렬 (ASC/DESC)"},
];

const FUNCTIONS = [
    {fn: "currentUser()", desc: "현재 로그인 사용자"},
    {fn: "openSprints()", desc: "진행 중인 스프린트"},
    {fn: "closedSprints()", desc: "완료된 스프린트"},
];

export default function CqlSyntaxGuide({onInsert}: CqlSyntaxGuideProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    function handleInsert(query: string) {
        onInsert(query);
        setCopied(query);
        setTimeout(() => setCopied(null), 1500);
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
            >
        <span className="text-sm font-semibold text-gray-700">
          CQL 문법 가이드
        </span>
                {open ? (
                    <ChevronUp className="h-4 w-4 text-gray-400"/>
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400"/>
                )}
            </button>

            {open && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Fields */}
                        <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                필드
                            </p>
                            <div className="space-y-1.5">
                                {FIELDS.map(({name, desc}) => (
                                    <div key={name} className="flex items-center gap-2">
                                        <code
                                            className="w-20 shrink-0 rounded bg-purple-50 px-1.5 py-0.5 font-mono text-xs text-purple-700">
                                            {name}
                                        </code>
                                        <span className="text-xs text-gray-500">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operators */}
                        <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                연산자
                            </p>
                            <div className="space-y-1.5">
                                {OPERATORS.map(({op, desc}) => (
                                    <div key={op} className="flex items-center gap-2">
                                        <code
                                            className="w-28 shrink-0 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs text-blue-700">
                                            {op}
                                        </code>
                                        <span className="text-xs text-gray-500">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Functions */}
                        <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                함수
                            </p>
                            <div className="space-y-1.5 mb-4">
                                {FUNCTIONS.map(({fn, desc}) => (
                                    <div key={fn} className="flex items-center gap-2">
                                        <code
                                            className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 font-mono text-xs text-green-700">
                                            {fn}
                                        </code>
                                        <span className="text-xs text-gray-500">{desc}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                날짜 상대값
                            </p>
                            <div className="space-y-1">
                                {["-7d (7일 전)", "-1w (1주 전)", "-1M (1달 전)"].map((v) => (
                                    <code key={v}
                                          className="block rounded bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                                        {v}
                                    </code>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Example queries */}
                    <div className="mt-5">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            예시 쿼리 (클릭하면 에디터에 삽입)
                        </p>
                        <div className="space-y-2">
                            {EXAMPLE_QUERIES.map(({label, query}) => (
                                <button
                                    key={query}
                                    type="button"
                                    onClick={() => handleInsert(query)}
                                    className="flex w-full items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-left hover:border-blue-200 hover:bg-blue-50 transition-colors group"
                                >
                                    <Clipboard
                                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-blue-400"/>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-600 group-hover:text-blue-700">
                                            {label}
                                        </p>
                                        <code
                                            className="mt-0.5 block truncate font-mono text-xs text-gray-400 group-hover:text-blue-500">
                                            {query}
                                        </code>
                                    </div>
                                    {copied === query && (
                                        <span className="ml-auto shrink-0 text-xs text-blue-500">
                      삽입됨 ✓
                    </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
