import {beforeEach, describe, expect, it, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const getDictionary = vi.fn();
vi.mock("@/lib/api/study", () => ({getDictionary: (...a: unknown[]) => getDictionary(...a)}));
import DictionaryPopover from "./DictionaryPopover";

const rect = {left: 10, top: 10, bottom: 30} as DOMRect;
const found = {word: "implement", status: "FOUND", suggestions: [], entries: [{headword: "implement", pos: "verb", senses: [
    {definition: "뜻1", example: null}, {definition: "뜻2", example: null}, {definition: "뜻3", example: null}, {definition: "뜻4", example: null}]}]};
const apiError = (code: string, message?: string) => Object.assign(new Error("x"), {isAxiosError: true, response: {status: 409, data: {code, message}}});

function renderPopover(props: Partial<React.ComponentProps<typeof DictionaryPopover>> = {}) {
    const fns = {onKeepOpen: vi.fn(), onClose: vi.fn(), onSaveTerm: vi.fn(), onRegisterKey: vi.fn()};
    const qc = new QueryClient({defaultOptions: {queries: {retry: false}}});
    const view = render(<QueryClientProvider client={qc}><DictionaryPopover word="implement" rect={rect} {...fns} {...props}/></QueryClientProvider>);
    return {...fns, ...view};
}

describe("DictionaryPopover", () => {
    beforeEach(() => { getDictionary.mockReset(); });

    it("shows headword, pos and up to 3 senses", async () => {
        getDictionary.mockResolvedValue(found);
        renderPopover();
        expect(await screen.findByText("implement")).toBeTruthy();
        expect(screen.getByText("verb")).toBeTruthy();
        expect(screen.getByText("뜻3")).toBeTruthy();
        expect(screen.queryByText("뜻4")).toBeNull();
    });

    it("shows suggestions when not found", async () => {
        getDictionary.mockResolvedValue({word: "sowr", status: "NOT_FOUND", entries: [], suggestions: ["sower"]});
        renderPopover({word: "sowr"});
        expect(await screen.findByText("사전에 없는 단어입니다")).toBeTruthy();
        expect(screen.getByText("sower")).toBeTruthy();
    });

    it("shows register-key action on STUDY_DICTIONARY_KEY_REQUIRED", async () => {
        getDictionary.mockRejectedValue(apiError("STUDY_DICTIONARY_KEY_REQUIRED"));
        const {onRegisterKey} = renderPopover();
        const b = await screen.findByRole("button", {name: "키 등록"});
        fireEvent.click(b);
        expect(onRegisterKey).toHaveBeenCalledTimes(1);
    });

    it("shows the error message without a register button for other errors", async () => {
        getDictionary.mockRejectedValue(apiError("STUDY_DICTIONARY_UPSTREAM", "사전 서버 오류"));
        renderPopover();
        expect(await screen.findByText("사전 서버 오류")).toBeTruthy();
        expect(screen.queryByRole("button", {name: "키 등록"})).toBeNull();
    });

    it("save-to-terms passes headword and first definition", async () => {
        getDictionary.mockResolvedValue(found);
        const {onSaveTerm} = renderPopover();
        fireEvent.click(await screen.findByRole("button", {name: "단어장에 저장"}));
        expect(onSaveTerm).toHaveBeenCalledWith("implement", "뜻1");
    });

    it("never renders inside the article", async () => {
        getDictionary.mockResolvedValue(found);
        const {container} = renderPopover();
        const dialog = await screen.findByRole("dialog");
        expect(dialog.parentElement).toBe(document.body);
        expect(container.contains(dialog)).toBe(false);
    });
});
