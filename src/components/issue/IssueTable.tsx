"use client";

import {Avatar, IssueTypeIcon, PriorityIcon, StatusLozenge} from "@/components/cira/ui/Badges";
import type {IssueResponse} from "@/types/issue";
import Link from "next/link";
import {useRouter} from "next/navigation";

interface Props {
    issues: IssueResponse[];
    projectId?: string; // 없으면 이슈의 projectId (검색 결과처럼 여러 프로젝트가 섞일 때)
    emptyText?: string;
}

const date = (dt?: string) => (dt ? new Date(dt).toLocaleDateString("ko-KR") : "-");

// md 이상은 표, 모바일은 카드 목록
export default function IssueTable({issues, projectId, emptyText = "이슈가 없습니다."}: Props) {
    const router = useRouter();
    const href = (issue: IssueResponse) => `/cira/projects/${projectId ?? issue.projectId}/issues/${issue.id}`;

    if (issues.length === 0) {
        return <div className="py-16 text-center text-sm text-slate-400">{emptyText}</div>;
    }

    return (
        <>
            <table className="hidden w-full text-sm md:table">
                <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="w-8 pb-2 pl-4 font-medium" aria-label="유형"/>
                    <th className="w-28 pb-2 font-medium">키</th>
                    <th className="pb-2 font-medium">요약</th>
                    <th className="w-32 pb-2 font-medium">상태</th>
                    <th className="w-12 pb-2 text-center font-medium">P</th>
                    <th className="w-32 pb-2 font-medium">담당자</th>
                    <th className="w-24 pb-2 pr-4 font-medium">수정일</th>
                </tr>
                </thead>
                <tbody>
                {issues.map((issue) => (
                    <tr
                        key={issue.id}
                        onClick={() => router.push(href(issue))}
                        className="h-9 cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                    >
                        <td className="pl-4"><IssueTypeIcon typeName={issue.issueTypeNm}/></td>
                        <td className="font-mono text-xs text-slate-500">{issue.issueKey}</td>
                        <td className="truncate font-medium text-slate-900">{issue.title}</td>
                        <td><StatusLozenge label={issue.statusNm}/></td>
                        <td className="text-center"><span className="inline-flex"><PriorityIcon priority={issue.priority}/></span></td>
                        <td>
                            <span className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Avatar name={issue.assignee?.name}/>{issue.assignee?.name ?? "미지정"}
                            </span>
                        </td>
                        <td className="pr-4 text-xs text-slate-400">{date(issue.modifiedAt ?? issue.createdAt)}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <ul className="divide-y divide-slate-100 md:hidden">
                {issues.map((issue) => (
                    <li key={issue.id}>
                        <Link href={href(issue)} className="block px-3 py-3 active:bg-slate-50">
                            <div className="mb-1 flex items-center gap-2">
                                <IssueTypeIcon typeName={issue.issueTypeNm}/>
                                <span className="font-mono text-xs text-slate-500">{issue.issueKey}</span>
                                <span className="flex-1"/>
                                <PriorityIcon priority={issue.priority}/>
                            </div>
                            <p className="mb-2 text-sm font-medium text-slate-900">{issue.title}</p>
                            <div className="flex items-center justify-between">
                                <StatusLozenge label={issue.statusNm}/>
                                <Avatar name={issue.assignee?.name}/>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    );
}
