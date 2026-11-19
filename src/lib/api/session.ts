"use client";

import {create} from "zustand";

// 세션 갱신·재로그인 (ADR 0007). 백엔드 토큰은 여기 오지 않는다 — 서버 jwt 콜백이 쿠키 안에서만 바꾼다

let inflight: Promise<boolean> | null = null;

/**
 * next-auth 세션 update(POST /api/auth/session)를 보낸다. 서버 jwt 콜백이 유휴·절대 만료를 검사하고,
 * accessToken 만료가 가까우면 백엔드 refresh 로 회전한다. 결과 true = 세션이 살아 있음.
 * - 탭 안에서 한 번에 하나만 보낸다: 같은 refreshToken 으로 동시에 회전하면 한쪽이 실패한다
 * - active: 사용자 입력이 있었음 (유휴 타이머를 되돌림). 401 재시도 같은 자동 호출은 false
 */
export function refreshSession(active = false): Promise<boolean> {
    // ponytail: 진행 중인 요청에 합류하면 active 표시는 버려진다. 다음 입력(1분 뒤)에서 다시 보낸다
    inflight ??= (async () => {
        try {
            const {csrfToken} = await (await fetch("/api/auth/csrf")).json();
            const res = await fetch("/api/auth/session", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({csrfToken, data: {active}}),
            });
            const session = res.ok ? await res.json() : null;
            return !!session?.user;
        } catch {
            return false;
        }
    })().finally(() => {
        inflight = null;
    });
    return inflight;
}

/** 재로그인 모달 표시 여부. Providers 의 ReauthModal 이 구독한다 */
export const useReauthStore = create<{ open: boolean }>(() => ({open: false}));

let waiters: Array<(ok: boolean) => void> = [];

/**
 * 화면을 떠나지 않고 재로그인을 요청한다. 모달에서 로그인하면 true, 닫으면 false.
 * 동시에 여러 요청이 기다려도 모달은 하나 — 결과를 함께 받는다.
 */
export function requestReauth(): Promise<boolean> {
    useReauthStore.setState({open: true});
    return new Promise((resolve) => waiters.push(resolve));
}

/** 모달이 결과를 알린다 */
export function settleReauth(ok: boolean) {
    useReauthStore.setState({open: false});
    const pending = waiters;
    waiters = [];
    pending.forEach((resolve) => resolve(ok));
}
