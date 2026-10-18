"use client";

import {useReleaseNotes} from "@/hooks/useVersions";
import {useState} from "react";

interface Props {
    versionId: string;
    versionName: string;
    onClose: () => void;
}

function buildMarkdown(
    versionName: string,
    groups: Array<{ category: string; issues: Array<{ issueKey: string; title: string }> }>,
): string {
    const lines: string[] = [`# ${versionName} 릴리즈 노트`, ""];
    for (const group of groups) {
        lines.push(`## ${group.category}`, "");
        for (const issue of group.issues) {
            lines.push(`- [${issue.issueKey}] ${issue.title}`);
        }
        lines.push("");
    }
    return lines.join("\n");
}

export default function ReleaseNotesModal({versionId, versionName, onClose}: Props) {
    const {data, isLoading, isError} = useReleaseNotes(versionId);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!data) return;
        const md = buildMarkdown(data.versionName, data.groups);
        navigator.clipboard.writeText(md).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-slate-900">릴리즈 노트 — {versionName}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            disabled={!data}
                            className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                            {copied ? "복사됨 ✓" : "마크다운 복사"}
                        </button>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    {isLoading && (
                        <p className="text-sm text-slate-400 text-center py-8">불러오는 중...</p>
                    )}
                    {isError && (
                        <p className="text-sm text-red-500 text-center py-8">
                            릴리즈 노트를 불러오는 데 실패했습니다.
                        </p>
                    )}
                    {data && data.groups.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">
                            연결된 이슈가 없습니다.
                        </p>
                    )}
                    {data &&
                        data.groups.map((group) => (
                            <div key={group.category} className="mb-5">
                                <h3 className="text-sm font-semibold text-slate-700 mb-2 pb-1 border-b border-slate-100">
                                    {group.category}
                                </h3>
                                <ul className="space-y-1.5">
                                    {group.issues.map((issue) => (
                                        <li key={issue.id} className="flex items-start gap-2 text-sm">
                      <span className="font-mono text-xs text-slate-400 mt-0.5 shrink-0">
                        {issue.issueKey}
                      </span>
                                            <span className="text-slate-700">{issue.title}</span>
                                            <span className="ml-auto shrink-0 text-xs text-slate-400">
                        {issue.issueTypeNm}
                      </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
