"use client";

import type {IssueResponse, Priority} from "@/types/issue";
import {useRouter} from "next/navigation";

const PRIORITY_ICONS: Record<Priority, { icon: string; color: string }> = {
    HIGHEST: {icon: "⬆⬆", color: "text-red-600"},
    HIGH: {icon: "⬆", color: "text-orange-500"},
    MEDIUM: {icon: "➡", color: "text-yellow-500"},
    LOW: {icon: "⬇", color: "text-blue-400"},
    LOWEST: {icon: "⬇⬇", color: "text-slate-400"},
};

interface Props {
    issues: IssueResponse[];
    projectId: string;
}

export default function IssueTable({issues, projectId}: Props) {
    const router = useRouter();

    if (issues.length === 0) {
        return (
            <div className="text-center py-16 text-slate-400">
                <p className="font-medium">이슈가 없습니다.</p>
                <p className="text-sm mt-1">새 이슈를 생성해보세요.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                <tr className="border-b border-slate-200 text-left">
                    <th className="pb-2 pl-4 font-medium text-slate-500 w-28">키</th>
                    <th className="pb-2 font-medium text-slate-500">제목</th>
                    <th className="pb-2 font-medium text-slate-500 w-28 text-center">
                        상태
                    </th>
                    <th className="pb-2 font-medium text-slate-500 w-24 text-center">
                        우선순위
                    </th>
                    <th className="pb-2 font-medium text-slate-500 w-32">담당자</th>
                    <th className="pb-2 pr-4 font-medium text-slate-500 w-24">
                        생성일
                    </th>
                </tr>
                </thead>
                <tbody>
                {issues.map((issue) => {
                    const pri = issue.priority
                        ? PRIORITY_ICONS[issue.priority]
                        : undefined;
                    return (
                        <tr
                            key={issue.id}
                            onClick={() =>
                                router.push(
                                    `/projects/${projectId}/issues/${issue.id}`,
                                )
                            }
                            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        >
                            <td className="py-3 pl-4 font-mono text-xs text-slate-500">
                                {issue.issueKey}
                            </td>
                            <td className="py-3 text-slate-900 font-medium">
                                {issue.title}
                            </td>
                            <td className="py-3 text-center">
                                {issue.statusNm && (
                                    <span
                                        className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {issue.statusNm}
                    </span>
                                )}
                            </td>
                            <td className="py-3 text-center">
                                {pri && (
                                    <span
                                        className={`text-xs font-semibold ${pri.color}`}
                                        title={issue.priority}
                                    >
                      {pri.icon}
                    </span>
                                )}
                            </td>
                            <td className="py-3 text-slate-600 text-xs">
                                {issue.assignee?.name ?? "-"}
                            </td>
                            <td className="py-3 pr-4 text-slate-400 text-xs">
                                {issue.createdAt
                                    ? new Date(issue.createdAt).toLocaleDateString("ko-KR")
                                    : "-"}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
