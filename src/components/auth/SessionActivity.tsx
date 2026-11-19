"use client";

import {useSession} from "next-auth/react";
import {useEffect} from "react";

import {refreshSession} from "@/lib/api/session";

/** 사용자 입력을 서버에 알리는 최소 간격. 유휴 제한(30분)보다 충분히 짧고, 15분 accessToken 은 이 신호로 미리 회전된다 */
const PING_INTERVAL_MS = 60_000;

/**
 * 키보드·포인터 입력이 있으면 세션 update({active: true})를 보내 유휴 타이머를 되돌린다 (ADR 0007).
 * 폴링 같은 자동 요청은 활동으로 치지 않는다 → 자리를 비우면 유휴 제한 뒤 세션이 끝난다.
 * 렌더링하는 것은 없다. Providers 에 한 번 둔다.
 */
export default function SessionActivity() {
    const authenticated = useSession().status === "authenticated";

    useEffect(() => {
        if (!authenticated) return;
        let last = 0;
        const onInput = () => {
            const now = Date.now();
            if (now - last < PING_INTERVAL_MS) return;
            last = now;
            void refreshSession(true);
        };
        const opts = {capture: true, passive: true};
        window.addEventListener("pointerdown", onInput, opts);
        window.addEventListener("keydown", onInput, opts);
        return () => {
            window.removeEventListener("pointerdown", onInput, opts);
            window.removeEventListener("keydown", onInput, opts);
        };
    }, [authenticated]);

    return null;
}
