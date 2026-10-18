"use client";

import type {NotificationItem} from "@/lib/api/notifications";
import {getNotifications, getUnreadCount, markAllRead, markRead,} from "@/lib/api/notifications";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {AtSign, Bell, MessageSquare, RefreshCw, UserCheck, X} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";

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
    ISSUE_ASSIGNED: <UserCheck className="h-4 w-4 text-blue-500"/>,
    ISSUE_COMMENTED: <MessageSquare className="h-4 w-4 text-green-500"/>,
    ISSUE_STATUS_CHANGED: <RefreshCw className="h-4 w-4 text-yellow-500"/>,
    MENTION: <AtSign className="h-4 w-4 text-purple-500"/>,
};

export default function NotificationBell() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const {data: unreadCount = 0} = useQuery({
        queryKey: ["notifications-unread-count"],
        queryFn: getUnreadCount,
        refetchInterval: 60_000,
    });

    const {data: notifPage} = useQuery({
        queryKey: ["notifications", "recent"],
        queryFn: () => getNotifications(0, 10),
        enabled: open,
    });

    const notifications = notifPage?.content ?? [];

    const markReadMut = useMutation({
        mutationFn: markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["notifications"]});
            queryClient.invalidateQueries({queryKey: ["notifications-unread-count"]});
        },
    });

    const markAllMut = useMutation({
        mutationFn: markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["notifications"]});
            queryClient.invalidateQueries({queryKey: ["notifications-unread-count"]});
        },
    });

    useEffect(() => {
        function onPointerDown(e: PointerEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, []);

    function handleNotificationClick(n: NotificationItem) {
        if (!n.isRead) markReadMut.mutate(n.id);
        if (n.issueKey) {
            router.push(`/search?q=${encodeURIComponent(n.issueKey)}`);
        }
        setOpen(false);
    }

    const badgeCount =
        unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="알림"
            >
                <Bell className="h-[18px] w-[18px]"/>
                {badgeCount && (
                    <span
                        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {badgeCount}
          </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-800">알림</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllMut.mutate()}
                                    disabled={markAllMut.isPending}
                                    className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                >
                                    모두 읽음
                                </button>
                            )}
                            <button onClick={() => setOpen(false)}>
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600"/>
                            </button>
                        </div>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                            알림이 없습니다.
                        </div>
                    ) : (
                        <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <button
                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                                            n.isRead ? "opacity-60" : ""
                                        }`}
                                        onClick={() => handleNotificationClick(n)}
                                    >
                    <span className="mt-0.5 shrink-0">
                      {TYPE_ICON[n.type] ?? <Bell className="h-4 w-4 text-gray-400"/>}
                    </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-800">
                                                {n.title}
                                            </p>
                                            {n.body && (
                                                <p className="mt-0.5 truncate text-xs text-gray-500">{n.body}</p>
                                            )}
                                            <p className="mt-1 text-[10px] text-gray-400">
                                                {relativeTime(n.createdAt)}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"/>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="border-t border-gray-100 px-4 py-2.5">
                        <Link
                            href="/notifications"
                            className="block text-center text-xs text-blue-600 hover:underline"
                            onClick={() => setOpen(false)}
                        >
                            전체 알림 보기
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
