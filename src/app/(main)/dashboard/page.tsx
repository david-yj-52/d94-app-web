"use client";

import {useDashboard} from "@/hooks/useReports";
import {Skeleton} from "@/components/ui/Skeleton";
import type {ActivityItem, DashboardIssue} from "@/types/reports";
import Link from "next/link";

const PRIORITY_COLOR: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-slate-100 text-slate-600",
};

const PRIORITY_LABEL: Record<string, string> = {
    CRITICAL: "긴급",
    HIGH: "높음",
    MEDIUM: "중간",
    LOW: "낮음",
};

function formatDate(dt?: string) {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
    });
}

function formatRelativeTime(dt: string) {
    const diff = Date.now() - new Date(dt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "방금 전";
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
}

function isOverdue(dueDate?: string) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

function isDueToday(dueDate?: string) {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    const today = new Date();
    return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    );
}

function IssueRow({issue}: { issue: DashboardIssue }) {
    const overdue = isOverdue(issue.dueDate);
    return (
        <tr className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="py-2.5 pl-4 font-mono text-xs text-slate-400 w-24">
                {issue.issueKey}
            </td>
            <td className="py-2.5 text-sm text-slate-800 max-w-[260px]">
                <span className="line-clamp-1">{issue.title}</span>
                {issue.projectName && (
                    <span className="text-xs text-slate-400 ml-1">· {issue.projectName}</span>
                )}
            </td>
            <td className="py-2.5 px-2">
        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
          {issue.statusNm ?? issue.status}
        </span>
            </td>
            <td className="py-2.5 px-2">
        <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[issue.priority] ?? "bg-slate-100 text-slate-500"}`}
        >
          {PRIORITY_LABEL[issue.priority] ?? issue.priority}
        </span>
            </td>
            <td
                className={`py-2.5 pr-4 text-xs text-right ${overdue ? "text-red-500 font-medium" : "text-slate-400"}`}
            >
                {issue.dueDate ? formatDate(issue.dueDate) : "-"}
            </td>
        </tr>
    );
}

function ActivityRow({item}: { item: ActivityItem }) {
    const activityIcon: Record<string, string> = {
        ISSUE_CREATED: "🆕",
        ISSUE_UPDATED: "✏️",
        ISSUE_CLOSED: "✅",
        COMMENT_ADDED: "💬",
        SPRINT_STARTED: "🚀",
        SPRINT_COMPLETED: "🏁",
    };
    return (
        <div className="flex items-start gap-3 py-3 border-t border-slate-100 first:border-0">
      <span className="text-lg leading-none mt-0.5">
        {activityIcon[item.type] ?? "📌"}
      </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{item.description}</p>
                {item.issueKey && (
                    <p className="text-xs text-slate-400 mt-0.5">{item.issueKey}</p>
                )}
            </div>
            <span className="text-xs text-slate-400 shrink-0">
        {formatRelativeTime(item.createdAt)}
      </span>
        </div>
    );
}

export default function DashboardPage() {
    const {data: dashboard, isLoading} = useDashboard();

    const todayDueCount =
        dashboard?.assignedIssues.filter((i) => isDueToday(i.dueDate)).length ?? 0;
    const thisWeekCompleted =
        dashboard?.recentActivity.filter((a) => a.type === "ISSUE_CLOSED").length ??
        0;

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl"/>
                    ))}
                </div>
                <Skeleton className="h-64 rounded-xl"/>
                <Skeleton className="h-48 rounded-xl"/>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">내 대시보드</h1>
                <p className="text-sm text-slate-500 mt-0.5">나에게 할당된 작업과 최근 활동을 확인합니다.</p>
            </div>

            {/* 상단 요약 카드 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs font-medium text-slate-500 mb-1">내 할당 이슈</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {dashboard?.assignedIssues.length ?? 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">진행 중인 작업</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs font-medium text-slate-500 mb-1">오늘 마감</p>
                    <p className={`text-3xl font-bold ${todayDueCount > 0 ? "text-red-600" : "text-slate-900"}`}>
                        {todayDueCount}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">오늘 기한 이슈</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-xs font-medium text-slate-500 mb-1">이번 주 완료</p>
                    <p className="text-3xl font-bold text-green-600">{thisWeekCompleted}</p>
                    <p className="text-xs text-slate-400 mt-1">완료된 이슈</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* 좌측: 할당 이슈 + 마감 임박 */}
                <div className="col-span-2 space-y-6">
                    {/* 내 할당 이슈 */}
                    <div className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-800">나에게 할당된 이슈</h2>
                        </div>
                        {!dashboard?.assignedIssues.length ? (
                            <div className="py-10 text-center text-slate-400 text-sm">
                                할당된 이슈가 없습니다.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="bg-slate-50">
                                    <th className="py-2 pl-4 text-left text-xs font-medium text-slate-500 w-24">키</th>
                                    <th className="py-2 text-left text-xs font-medium text-slate-500">제목</th>
                                    <th className="py-2 px-2 text-left text-xs font-medium text-slate-500 w-24">상태</th>
                                    <th className="py-2 px-2 text-left text-xs font-medium text-slate-500 w-16">우선순위</th>
                                    <th className="py-2 pr-4 text-right text-xs font-medium text-slate-500 w-20">마감일</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dashboard.assignedIssues.map((issue) => (
                                    <IssueRow key={issue.id} issue={issue}/>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* 마감 임박 이슈 */}
                    <div className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-800">
                                마감 임박 이슈
                                <span className="ml-2 text-xs font-normal text-slate-400">7일 이내</span>
                            </h2>
                        </div>
                        {!dashboard?.upcomingDeadlines.length ? (
                            <div className="py-10 text-center text-slate-400 text-sm">
                                마감 임박 이슈가 없습니다.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="bg-slate-50">
                                    <th className="py-2 pl-4 text-left text-xs font-medium text-slate-500 w-24">키</th>
                                    <th className="py-2 text-left text-xs font-medium text-slate-500">제목</th>
                                    <th className="py-2 px-2 text-left text-xs font-medium text-slate-500 w-24">상태</th>
                                    <th className="py-2 px-2 text-left text-xs font-medium text-slate-500 w-16">우선순위</th>
                                    <th className="py-2 pr-4 text-right text-xs font-medium text-slate-500 w-20">마감일</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dashboard.upcomingDeadlines.map((issue) => (
                                    <IssueRow key={issue.id} issue={issue}/>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* 우측: 최근 활동 */}
                <div className="col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-800">최근 활동</h2>
                        </div>
                        <div className="px-4 py-2">
                            {!dashboard?.recentActivity.length ? (
                                <div className="py-8 text-center text-slate-400 text-sm">
                                    최근 활동이 없습니다.
                                </div>
                            ) : (
                                dashboard.recentActivity.slice(0, 15).map((item) => (
                                    <ActivityRow key={item.id} item={item}/>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 스프린트 진행 현황 */}
                    {dashboard?.sprintProgress.sprintName && (
                        <div className="bg-white rounded-xl border border-slate-200 mt-6 p-5">
                            <h2 className="text-sm font-semibold text-slate-800 mb-3">현재 스프린트</h2>
                            <p className="text-xs text-slate-500 mb-3 font-medium">
                                {dashboard.sprintProgress.sprintName}
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>진행률</span>
                                    <span>
                    {dashboard.sprintProgress.completedIssues} /{" "}
                                        {dashboard.sprintProgress.totalIssues}
                  </span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{
                                            width: `${
                                                dashboard.sprintProgress.totalIssues > 0
                                                    ? Math.round(
                                                        (dashboard.sprintProgress.completedIssues /
                                                            dashboard.sprintProgress.totalIssues) *
                                                        100,
                                                    )
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 pt-1">
                                    <span>진행 중: {dashboard.sprintProgress.inProgressIssues}</span>
                                    <span>완료: {dashboard.sprintProgress.completedIssues}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <Link
                            href="/projects"
                            className="text-sm text-blue-600 hover:text-blue-800 no-underline"
                        >
                            전체 프로젝트 보기 →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
