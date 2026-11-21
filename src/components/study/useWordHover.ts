"use client";
import {useCallback, useEffect, useRef, useState, type RefObject} from "react";
import {wordAtPoint} from "@/lib/study/wordAtPoint";

export function useWordHover(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
    const [hover, setHover] = useState<{word: string; rect: DOMRect} | null>(null);
    const [candidate, setCandidate] = useState<{word: string; rect: DOMRect} | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const candidateWord = useRef<string | null>(null);
    const keepOpen = useCallback(() => clearTimeout(closeTimer.current), []);
    const close = useCallback(() => { clearTimeout(closeTimer.current); candidateWord.current = null; setHover(null); setCandidate(null); }, []);
    useEffect(() => {
        const root = containerRef.current; if (!root || !enabled) { close(); return; }
        let frame = 0;
        const move = (event: MouseEvent) => {
            if (event.buttons || window.getSelection()?.isCollapsed === false || event.target instanceof Element && event.target.closest("[data-tip]")) { close(); return; }
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const found = wordAtPoint(event.clientX, event.clientY, root);
                if (!found || matchMedia("(hover: none)").matches) { candidateWord.current = null; setCandidate(null); return; }
                if (candidateWord.current !== found.word) { candidateWord.current = found.word; setHover(null); setCandidate(found); }
            });
        };
        const leave = () => { closeTimer.current = setTimeout(close, 200); };
        root.addEventListener("mousemove", move); root.addEventListener("mouseleave", leave);
        return () => { root.removeEventListener("mousemove", move); root.removeEventListener("mouseleave", leave); cancelAnimationFrame(frame); clearTimeout(closeTimer.current); };
    }, [containerRef, enabled, close]);
    useEffect(() => {
        if (!candidate) { setHover(null); return; }
        const timer = setTimeout(() => setHover(candidate), 400);
        return () => clearTimeout(timer);
    }, [candidate]);
    return {hover, keepOpen, close};
}
