"use client";
import {useCallback, useEffect, useRef, useState, type RefObject} from "react";
import {wordAtPoint} from "@/lib/study/wordAtPoint";

export function useWordHover(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
    const [hover, setHover] = useState<{word: string; rect: DOMRect} | null>(null);
    const [candidate, setCandidate] = useState<{word: string; rect: DOMRect} | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const candidateWord = useRef<string | null>(null);
    const hoverWord = useRef<string | null>(null);
    hoverWord.current = hover?.word ?? null;
    const cancelClose = useCallback(() => { clearTimeout(closeTimer.current); closeTimer.current = undefined; }, []);
    const keepOpen = cancelClose;
    const close = useCallback(() => { cancelClose(); candidateWord.current = null; setHover(null); setCandidate(null); }, [cancelClose]);
    // 열린 팝업이 있으면 200ms 유예 후 닫는다(이미 돌고 있으면 유지)
    const scheduleClose = useCallback(() => { if (hoverWord.current && closeTimer.current === undefined) closeTimer.current = setTimeout(close, 200); }, [close]);
    useEffect(() => {
        const root = containerRef.current; if (!root || !enabled) { close(); return; }
        let frame = 0;
        const move = (event: MouseEvent) => {
            if (event.buttons || window.getSelection()?.isCollapsed === false || event.target instanceof Element && event.target.closest("[data-tip]")) { close(); return; }
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const found = wordAtPoint(event.clientX, event.clientY, root);
                if (!found || matchMedia("(hover: none)").matches) { candidateWord.current = null; setCandidate(null); scheduleClose(); return; }
                if (found.word === hoverWord.current) { cancelClose(); candidateWord.current = null; setCandidate(null); return; }
                scheduleClose();
                if (candidateWord.current !== found.word) { candidateWord.current = found.word; setCandidate(found); }
            });
        };
        const leave = scheduleClose;
        root.addEventListener("mousemove", move); root.addEventListener("mouseleave", leave);
        return () => { root.removeEventListener("mousemove", move); root.removeEventListener("mouseleave", leave); cancelAnimationFrame(frame); cancelClose(); };
    }, [containerRef, enabled, close, scheduleClose, cancelClose]);
    useEffect(() => {
        if (!candidate) return;
        const timer = setTimeout(() => { cancelClose(); setHover(candidate); }, 400);
        return () => clearTimeout(timer);
    }, [candidate, cancelClose]);
    return {hover, keepOpen, close};
}
