import {act, renderHook} from "@testing-library/react";
import {AxiosError, AxiosHeaders} from "axios";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {Note} from "@/types/docs";

const mutateAsync = vi.fn();
vi.mock("@/hooks/useDocs", () => ({useAutosaveNote: () => ({mutateAsync})}));
vi.mock("@/lib/docs/drafts", () => ({saveDraft: vi.fn(async () => undefined), deleteDraft: vi.fn(async () => undefined)}));

import {useNoteAutosave} from "./useNoteAutosave";
import {deleteDraft, saveDraft} from "@/lib/docs/drafts";

const note: Note = {
    id: "n1", title: "T", content: "a", folderId: null, kind: "idea", stream: null, origin: null, version: 3,
    tags: [], links: [], createdAt: null, modifiedAt: null,
};

const httpError = (status: number, code: string) =>
    new AxiosError("x", "ERR", undefined, undefined,
        {status, statusText: "", headers: {}, config: {headers: new AxiosHeaders()}, data: {code, message: "msg"}});

describe("useNoteAutosave", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mutateAsync.mockReset();
    });
    afterEach(() => vi.useRealTimers());

    it("입력이 멈추고 1.5초 뒤 저장하고, 응답 버전을 다음 저장에 쓴다", async () => {
        mutateAsync.mockImplementation(async (req) => ({...note, ...req, version: req.version + 1}));
        const {result} = renderHook(() => useNoteAutosave(note, vi.fn()));

        act(() => result.current.change("T", "ab"));
        expect(result.current.state).toBe("pending");
        await act(async () => vi.advanceTimersByTimeAsync(1499));
        expect(mutateAsync).not.toHaveBeenCalled();
        await act(async () => vi.advanceTimersByTimeAsync(1));
        expect(mutateAsync).toHaveBeenLastCalledWith({title: "T", content: "ab", version: 3});
        expect(result.current.state).toBe("saved");
        expect(saveDraft).toHaveBeenCalled();
        expect(deleteDraft).toHaveBeenCalledWith("n1");

        act(() => result.current.change("T", "abc"));
        await act(async () => vi.advanceTimersByTimeAsync(1500));
        expect(mutateAsync).toHaveBeenLastCalledWith({title: "T", content: "abc", version: 4});
    });

    it("저장 중에 입력하면 끝난 뒤 이어서 저장한다 (요청은 하나씩)", async () => {
        let release!: () => void;
        mutateAsync.mockImplementationOnce((req) => new Promise((r) => (release = () => r({...note, version: req.version + 1}))));
        mutateAsync.mockImplementation(async (req) => ({...note, version: req.version + 1}));
        const {result} = renderHook(() => useNoteAutosave(note, vi.fn()));

        act(() => result.current.change("T", "ab"));
        await act(async () => vi.advanceTimersByTimeAsync(1500)); // 첫 저장 시작(응답 대기)
        act(() => result.current.change("T", "abc"));
        await act(async () => vi.advanceTimersByTimeAsync(1500)); // 진행 중이라 대기
        expect(mutateAsync).toHaveBeenCalledTimes(1);
        await act(async () => {
            release();
            await vi.advanceTimersByTimeAsync(300);
        });
        expect(mutateAsync).toHaveBeenCalledTimes(2);
        expect(mutateAsync).toHaveBeenLastCalledWith({title: "T", content: "abc", version: 4});
    });

    it("409 버전 충돌은 conflict(재시도 없음), 네트워크 오류는 offline(10초 뒤 재시도)", async () => {
        mutateAsync.mockRejectedValueOnce(httpError(409, "DOCS_VERSION_CONFLICT"));
        const {result} = renderHook(() => useNoteAutosave(note, vi.fn()));
        act(() => result.current.change("T", "ab"));
        await act(async () => vi.advanceTimersByTimeAsync(1500));
        expect(result.current.state).toBe("conflict");

        mutateAsync.mockReset();
        mutateAsync.mockRejectedValueOnce(new AxiosError("Network Error", "ERR_NETWORK"));
        mutateAsync.mockImplementation(async (req) => ({...note, version: req.version + 1}));
        const second = renderHook(() => useNoteAutosave(note, vi.fn())).result;
        act(() => second.current.change("T", "xyz"));
        await act(async () => vi.advanceTimersByTimeAsync(1500));
        expect(second.current.state).toBe("offline");
        await act(async () => vi.advanceTimersByTimeAsync(10_000));
        expect(second.current.state).toBe("saved");
    });
});
