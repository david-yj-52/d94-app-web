"use client";

import {useEffect, useRef, useState} from "react";
import {Minus, Pause, Play, Plus} from "lucide-react";
import type {SectionRef} from "@/types/study";

const SPEED_COOKIE = "study_autoscroll_speed";
/** 1단계 = 초당 15px. ponytail: 체감 보정은 이 값 하나로 */
const PX_PER_LEVEL = 15;
const END_HOLD_MS = 2000; // 페이지 끝에서 멈춰 "다음" 을 보여 주는 시간
const START_HOLD_MS = 1000; // 새 페이지 맨 위에서 쉬는 시간
/** 누르면 멈추는 키 (방향키·페이지 이동·Space) */
export const STOP_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

export function clampLevel(n: number): number {
    return Number.isFinite(n) ? Math.min(10, Math.max(1, Math.round(n))) : 3;
}

/** 입력칸·버튼·링크·열린 창 안의 Enter 는 그 요소 몫이다 */
function ownsEnter(t: EventTarget | null): boolean {
    return t instanceof HTMLElement && !!t.closest("input, textarea, select, button, a, [contenteditable], [role=dialog]");
}

interface Props {
    /** 지금 그려진 페이지. 로딩 중이거나 본문 탭이 아니면 undefined → 움직이지 않는다 */
    pageId: string | undefined;
    next: SectionRef | null;
    onNext: (next: SectionRef) => void;
}

/**
 * 자동 스크롤: 설정한 속도로 내려가고, 휠·터치·방향키·본문 마우스 누름이면 멈추고, Enter 로 다시 간다.
 * 페이지 끝에서 2초 쉬고 다음 페이지로 넘어가 계속 간다. 마지막 페이지 끝이면 멈춘다.
 */
export default function AutoScroll({pageId, next, onNext}: Props) {
    const [running, setRunning] = useState(false);
    const [level, setLevel] = useState(3);
    const [nextLabel, setNextLabel] = useState<string | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const lastPage = useRef<string | undefined>(undefined);
    // rAF 루프가 최신 값을 읽도록
    const live = useRef({level, next, onNext});
    live.current = {level, next, onNext};

    // 속도는 기기(브라우저)별로 기억 (localStorage 금지 규칙 → 쿠키)
    useEffect(() => {
        const raw = document.cookie.split("; ").find((c) => c.startsWith(`${SPEED_COOKIE}=`))?.split("=")[1];
        if (raw) setLevel(clampLevel(Number(raw)));
    }, []);
    const changeLevel = (d: number) => setLevel((cur) => {
        const v = clampLevel(cur + d); // 연달아 눌러도 누른 만큼 (최신 값 기준)
        document.cookie = `${SPEED_COOKIE}=${v}; Path=/study; Max-Age=31536000; SameSite=Lax`;
        return v;
    });

    // 멈춤·재개 입력
    useEffect(() => {
        const stop = () => setRunning(false);
        const onKey = (e: KeyboardEvent) => {
            if (STOP_KEYS.has(e.key)) stop();
            else if (e.key === "Enter" && !ownsEnter(e.target)) setRunning(true);
        };
        // 조절기 밖을 누르면(글자 선택·마킹 드래그 포함) 멈춘다
        const onDown = (e: MouseEvent) => {
            if (!boxRef.current?.contains(e.target as Node)) stop();
        };
        window.addEventListener("wheel", stop, {passive: true});
        window.addEventListener("touchstart", stop, {passive: true});
        window.addEventListener("keydown", onKey);
        window.addEventListener("mousedown", onDown);
        return () => {
            window.removeEventListener("wheel", stop);
            window.removeEventListener("touchstart", stop);
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("mousedown", onDown);
        };
    }, []);

    // 스크롤 루프. 새 페이지면 맨 위에서 1초 쉬고, 같은 페이지에서 Enter 로 재개하면 바로 간다
    useEffect(() => {
        setNextLabel(null);
        const newPage = !!pageId && pageId !== lastPage.current;
        if (pageId) lastPage.current = pageId;
        if (!running || !pageId) return;
        let frame = 0;
        let last = performance.now();
        const holdUntil = newPage ? last + START_HOLD_MS : 0;
        let endAt = 0;
        let carry = 0; // 소수점 px 누적 (브라우저가 스크롤 위치를 정수로 반올림)
        const tick = (now: number) => {
            const dt = Math.min(now - last, 100); // 탭이 뒤로 갔다 오면 한 번에 크게 뛰지 않게
            last = now;
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
            if (atBottom) {
                const {next: n, onNext: go} = live.current;
                if (!n) return setRunning(false); // 마지막 페이지
                if (!endAt) {
                    endAt = now;
                    setNextLabel(n.title);
                } else if (now - endAt >= END_HOLD_MS) {
                    return go(n); // pageId 가 바뀌면 이 효과가 다시 돈다
                }
            } else if (now >= holdUntil) {
                carry += (live.current.level * PX_PER_LEVEL * dt) / 1000;
                const px = Math.floor(carry);
                if (px) {
                    window.scrollBy(0, px);
                    carry -= px;
                }
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [running, pageId]);

    return (
        <div ref={boxRef}
             className="fixed bottom-4 right-4 z-30 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-lg">
            {nextLabel && running && <span className="mr-1 max-w-[180px] truncate text-xs text-slate-500">다음: {nextLabel}</span>}
            <button type="button" onClick={() => setRunning((r) => !r)} aria-pressed={running}
                    aria-label={running ? "자동 스크롤 멈춤" : "자동 스크롤 시작"} title="Enter: 다시 시작 · 휠·방향키: 멈춤"
                    className="flex items-center gap-1 rounded px-2 py-1 font-medium text-slate-700 hover:bg-slate-100">
                {running ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                자동 스크롤
            </button>
            <button type="button" onClick={() => changeLevel(-1)} disabled={level <= 1} aria-label="느리게"
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><Minus className="h-4 w-4"/></button>
            <span className="w-5 text-center tabular-nums text-slate-700" aria-label="속도">{level}</span>
            <button type="button" onClick={() => changeLevel(1)} disabled={level >= 10} aria-label="빠르게"
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><Plus className="h-4 w-4"/></button>
        </div>
    );
}
