"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import {useAutosaveNote} from "@/hooks/useDocs";
import {deleteDraft, saveDraft} from "@/lib/docs/drafts";
import {docsError} from "@/lib/docs/error";
import type {Note} from "@/types/docs";

/** saved 저장됨 · pending 입력 중(곧 저장) · saving 저장 중 · offline 서버에 못 보냄(초안 보관, 10초 뒤 재시도) · conflict 다른 곳에서 수정됨 · error 거절됨(제목 중복 등) */
export type SaveState = "saved" | "pending" | "saving" | "offline" | "conflict" | "error";

const DEBOUNCE_MS = 1500;
const RETRY_MS = 10_000;

/**
 * 입력이 멈추고 1.5초 뒤 서버에 저장한다. 저장 중에 또 입력하면 끝난 뒤 이어서 저장(요청은 항상 하나씩).
 * 바뀔 때마다 IndexedDB 초안도 남기고, 서버 저장이 그 내용까지 성공하면 초안을 지운다.
 * 버전은 응답으로 따라가므로 자동 저장끼리 409 가 나지 않는다.
 */
export function useNoteAutosave(note: Note, onError: (message: string) => void) {
    const {mutateAsync} = useAutosaveNote(note.id); // mutateAsync 는 렌더 사이에 안정적
    const [state, setState] = useState<SaveState>("saved");
    const version = useRef(note.version);
    const latest = useRef({title: note.title, content: note.content});
    const savedKey = useRef(JSON.stringify(latest.current));
    const inFlight = useRef(false);
    const again = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const flush = useCallback(async (): Promise<boolean> => {
        clearTimeout(timer.current);
        const snap = {...latest.current};
        const key = JSON.stringify(snap);
        if (key === savedKey.current) {
            setState("saved");
            return true;
        }
        if (inFlight.current) {
            again.current = true;
            return false;
        }
        inFlight.current = true;
        setState("saving");
        try {
            const res = await mutateAsync({...snap, version: version.current});
            version.current = res.version;
            savedKey.current = key;
            if (JSON.stringify(latest.current) === key) {
                setState("saved");
                void deleteDraft(note.id);
            }
            return true;
        } catch (e) {
            const status = axios.isAxiosError(e) ? e.response?.status : undefined;
            const code = axios.isAxiosError(e) ? (e.response?.data as { code?: string } | undefined)?.code : undefined;
            if (code === "DOCS_VERSION_CONFLICT") {
                setState("conflict");
            } else if (status && status >= 400 && status < 500) {
                setState("error");
                onErrorRef.current(docsError(e, "저장하지 못했습니다."));
            } else {
                setState("offline"); // 네트워크·5xx: 초안은 이미 있으니 잠시 뒤 다시
                timer.current = setTimeout(() => void flush(), RETRY_MS);
            }
            return false;
        } finally {
            inFlight.current = false;
            if (again.current) {
                again.current = false;
                timer.current = setTimeout(() => void flush(), 300);
            }
        }
    }, [mutateAsync, note.id]);

    /** 제목·본문이 바뀔 때마다 부른다 */
    const change = useCallback((title: string, content: string) => {
        latest.current = {title, content};
        setState((s) => (s === "conflict" ? s : "pending"));
        clearTimeout(draftTimer.current);
        draftTimer.current = setTimeout(() =>
            void saveDraft({noteId: note.id, title, content, baseVersion: version.current, savedAt: Date.now()}), 300);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    }, [flush, note.id]);

    // 저장 안 된 채 탭을 닫으려 하면 경고 (초안은 남아 있다)
    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (JSON.stringify(latest.current) !== savedKey.current) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, []);

    // 화면을 떠날 때 남은 입력을 보낸다 (실패해도 초안은 남는다)
    useEffect(() => () => {
        clearTimeout(timer.current);
        void flush();
    }, [flush]);

    return {state, change, flush};
}
