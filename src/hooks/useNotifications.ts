"use client";

import {useToast} from "@/components/ui/Toast";
import type {NotificationItem, NotificationPage} from "@/lib/api/notifications";
import {useQueryClient} from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import {useEffect, useRef} from "react";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export function useNotifications() {
    const queryClient = useQueryClient();
    const {data: session} = useSession();
    const {show, ToastComponent} = useToast();

    const esRef = useRef<EventSource | null>(null);
    const retriesRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Keep latest session in a ref so connect() always uses the current token
    const sessionRef = useRef(session);
    sessionRef.current = session;

    useEffect(() => {
        if (!session) return;

        function connect() {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
            const token = sessionRef.current?.user?.accessToken;
            const qs = token ? `?token=${encodeURIComponent(token)}` : "";
            const url = `${backendUrl}/api/v1/notifications/subscribe${qs}`;

            const es = new EventSource(url);
            esRef.current = es;

            es.onmessage = (event) => {
                retriesRef.current = 0;
                try {
                    const notification: NotificationItem = JSON.parse(event.data);
                    queryClient.setQueryData<NotificationPage>(
                        ["notifications", "recent"],
                        (old) => ({
                            ...(old ?? {content: [], totalElements: 0, totalPages: 1, number: 0, size: 10}),
                            content: [notification, ...(old?.content ?? [])].slice(0, 10),
                            totalElements: (old?.totalElements ?? 0) + 1,
                        }),
                    );
                    queryClient.setQueryData<number>(
                        ["notifications-unread-count"],
                        (old) => (old ?? 0) + 1,
                    );
                    show(notification.title, "success");
                } catch {
                    // ignore malformed SSE payloads
                }
            };

            es.onerror = () => {
                es.close();
                esRef.current = null;
                if (retriesRef.current < MAX_RETRIES) {
                    retriesRef.current += 1;
                    retryTimerRef.current = setTimeout(connect, RETRY_DELAY_MS);
                }
            };
        }

        connect();

        function handleVisibilityChange() {
            if (!document.hidden && !esRef.current) {
                retriesRef.current = 0;
                connect();
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            esRef.current?.close();
            esRef.current = null;
        };
    }, [session?.user?.id]);

    return {ToastComponent};
}
