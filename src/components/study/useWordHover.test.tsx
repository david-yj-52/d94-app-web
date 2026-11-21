import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";

const wordAtPoint = vi.fn();
vi.mock("@/lib/study/wordAtPoint", () => ({wordAtPoint: (...a: unknown[]) => wordAtPoint(...a)}));
import {useWordHover} from "./useWordHover";

const rect = {} as DOMRect;
const root = document.createElement("div");
const ref = {current: root};
const moveOver = (word: string | null) => {
    wordAtPoint.mockReturnValue(word && {word, rect});
    act(() => { root.dispatchEvent(new MouseEvent("mousemove", {clientX: 1, clientY: 1})); vi.advanceTimersByTime(20); });
};
const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("useWordHover", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal("matchMedia", () => ({matches: false}));
    });
    afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); wordAtPoint.mockReset(); });

    const setup = () => {
        const r = renderHook(() => useWordHover(ref, true));
        moveOver("alpha"); wait(400);
        expect(r.result.current.hover?.word).toBe("alpha");
        return r;
    };

    it("keeps the popover for 200ms after leaving the word, then closes", () => {
        const {result} = setup();
        moveOver(null); wait(150);
        expect(result.current.hover?.word).toBe("alpha");
        wait(60);
        expect(result.current.hover).toBeNull();
    });

    it("keepOpen cancels the pending close", () => {
        const {result} = setup();
        moveOver(null); wait(100);
        act(() => result.current.keepOpen()); wait(500);
        expect(result.current.hover?.word).toBe("alpha");
    });

    it("replaces the hover once a new word is held for 400ms", () => {
        const {result} = setup();
        moveOver("beta"); wait(100);
        expect(result.current.hover?.word).toBe("alpha");
        wait(300);
        expect(result.current.hover?.word).toBe("beta");
    });
});
