"use client";

import {useToast} from "@/components/ui/Toast";
import {getNotifications} from "@/lib/api/notifications";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import {useEffect, useRef} from "react";

/** 새 알림 확인 주기. 화면이 숨겨져 있으면 TanStack Query 가 폴링을 멈춘다 */
const POLL_INTERVAL_MS = 30_000;

/**
 * 새 알림을 폴링해 토스트로 보여 준다 (`/api/proxy` 경유 — 토큰은 서버가 붙인다).
 * SSE 를 쓰지 않는 이유: 브라우저에 백엔드 토큰을 내려야 하고, UMD 가 스트리밍을 지원하지 않는다 (ADR 0005).
 * 첫 조회 결과는 기준선으로만 쓰고, 이후 조회에서 처음 보는 안 읽은 알림만 토스트로 띄운다.
 */
export function useNotifications() {
    const queryClient = useQueryClient();
    const {status} = useSession();
    const {show, ToastComponent} = useToast();

    // NotificationBell 과 같은 키 → 드롭다운 목록도 함께 갱신된다
    const {data} = useQuery({
        queryKey: ["notifications", "recent"],
        queryFn: () => getNotifications(0, 10),
        enabled: status === "authenticated",
        refetchInterval: POLL_INTERVAL_MS,
    });

    const seenRef = useRef<Set<string> | null>(null);

    useEffect(() => {
        if (!data) return;
        const ids = data.content.map((n) => n.id);
        if (seenRef.current === null) {
            seenRef.current = new Set(ids);
            return;
        }
        const fresh = data.content.filter((n) => !n.isRead && !seenRef.current!.has(n.id));
        ids.forEach((id) => seenRef.current!.add(id));
        if (fresh.length === 0) return;
        show(fresh.length === 1 ? fresh[0].title : `새 알림 ${fresh.length}건`, "success");
        queryClient.invalidateQueries({queryKey: ["notifications-unread-count"]});
    }, [data, queryClient, show]);

    // 로그아웃하면 기준선을 버린다 (다른 계정으로 로그인했을 때 이전 알림을 새 알림으로 보지 않도록)
    useEffect(() => {
        if (status === "unauthenticated") seenRef.current = null;
    }, [status]);

    return {ToastComponent};
}
