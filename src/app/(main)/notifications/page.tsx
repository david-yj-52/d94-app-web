"use client";

import type {NotificationItem} from "@/lib/api/notifications";
import {getNotifications, markAllRead, markRead} from "@/lib/api/notifications";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {AtSign, Bell, ChevronLeft, ChevronRight, MessageSquare, RefreshCw, UserCheck} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

function relativeTime(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "방금 전";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${Math.floor(diffHour / 24)}일 전`;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
    ISSUE_ASSIGNED: <UserCheck className="h-5 w-5 text-blue-500"/>,
    ISSUE_COMMENTED: <MessageSquare className="h-5 w-5 text-green-500"/>,
    ISSUE_STATUS_CHANGED: <RefreshCw className="h-5 w-5 text-yellow-500"/>,
    MENTION: <AtSign className="h-5 w-5 text-purple-500"/>,
};

const PAGE_SIZE = 20;

export default function NotificationsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);

    const {data: notifPage, isLoading} = useQuery({
        queryKey: ["notifications", page],
        queryFn: () => getNotifications(page, PAGE_SIZE),
    });

    const notifications = notifPage?.content ?? [];
    const totalPages = notifPage?.totalPages ?? 0;

    const markReadMut = useMutation({
        mutationFn: markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["notifications", page]});
            queryClient.invalidateQueries({queryKey: ["notifications-unread-count"]});
        },
    });

    const markAllMut = useMutation({
        mutationFn: markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["notifications"]});
            queryClient.invalidateQueries({queryKey: ["notifications-unread-count"]});
            setPage(0);
        },
    });

    function handleClick(n: NotificationItem) {
        if (!n.isRead) markReadMut.mutate(n.id);
        if (n.issueKey) {
            router.push(`/search?q=${encodeURIComponent(n.issueKey)}`);
        }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="mx-auto max-w-2xl px-4">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">알림</h1>
                    {unreadCount > 0 && (
                        <p className="mt-0.5 text-sm text-gray-500">
                            읽지 않은 알림 {unreadCount}개
                        </p>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllMut.mutate()}
                        disabled={markAllMut.isPending}
                        className="h-9 rounded-lg border border-gray-200 px-4 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        모두 읽음
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="space-y-2">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100"/>
                    ))}
                </div>
            )}

            {!isLoading && notifications.length === 0 && (
                <div className="py-20 text-center text-gray-400">
                    <Bell className="mx-auto mb-3 h-10 w-10 opacity-30"/>
                    <p className="font-medium">알림이 없습니다.</p>
                </div>
            )}

            {!isLoading && notifications.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <ul className="divide-y divide-gray-100">
                        {notifications.map((n) => (
                            <li key={n.id}>
                                <button
                                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                                        n.isRead ? "bg-white" : "bg-blue-50/40"
                                    }`}
                                    onClick={() => handleClick(n)}
                                >
                  <span className="mt-0.5 shrink-0">
                    {TYPE_ICON[n.type] ?? <Bell className="h-5 w-5 text-gray-400"/>}
                  </span>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-sm font-medium ${
                                                n.isRead ? "text-gray-600" : "text-gray-900"
                                            }`}
                                        >
                                            {n.title}
                                        </p>
                                        {n.body && (
                                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.body}</p>
                                        )}
                                        <p className="mt-1 text-[11px] text-gray-400">{relativeTime(n.createdAt)}</p>
                                    </div>
                                    {!n.isRead && (
                                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"/>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </button>
                    <span className="text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
                    <button
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronRight className="h-4 w-4"/>
                    </button>
                </div>
            )}
        </div>
    );
}
