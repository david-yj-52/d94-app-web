"use client";

import {useSession} from "next-auth/react";

import LoginForm from "@/components/auth/LoginForm";
import {settleReauth} from "@/lib/api/session";
import {SESSION_EXPIRED_REASON} from "@/lib/routeAccess";

/**
 * 세션 만료 시 화면 위에 띄우는 재로그인. 페이지를 떠나지 않으므로 입력 중이던 내용이 그대로 남는다 (ADR 0007).
 * 부모(Providers)가 `{open && <ReauthModal/>}` 로 렌더링한다.
 * - 로그인 성공: 기다리던 API 요청을 다시 보낸다. 다른 계정으로 로그인했으면 이전 사용자의 화면을 보이지 않도록 /home 으로 새로 연다
 * - 바깥 클릭·닫기: 모달만 닫는다 (실수로 눌러도 입력이 사라지지 않게 로그아웃·이동하지 않음). 기다리던 요청은 실패로 끝난다
 */
export default function ReauthModal() {
    const previousEmail = useSession().data?.user?.email;

    const onSuccess = async () => {
        const session = await (await fetch("/api/auth/session")).json().catch(() => null);
        if (previousEmail && session?.user?.email !== previousEmail) {
            window.location.href = "/home";
            return;
        }
        settleReauth(true);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="다시 로그인"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4"
            onClick={() => settleReauth(false)}
        >
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md">
                <button
                    type="button"
                    aria-label="닫기"
                    onClick={() => settleReauth(false)}
                    className="absolute right-4 top-4 z-10 text-sm text-slate-400 hover:text-slate-600"
                >
                    ✕
                </button>
                <LoginForm reason={SESSION_EXPIRED_REASON} onSuccess={onSuccess}/>
            </div>
        </div>
    );
}
