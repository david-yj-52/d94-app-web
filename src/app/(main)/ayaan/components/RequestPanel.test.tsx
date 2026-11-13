import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {describe, expect, it, vi} from "vitest";
import type {AyaanRequest} from "@/types/ayaan";
import RequestPanel from "./RequestPanel";

const answerRequest = vi.fn();
vi.mock("@/lib/api/ayaan", () => ({answerRequest: (...a: unknown[]) => answerRequest(...a)}));

const req = (o: Partial<AyaanRequest>): AyaanRequest => ({
    id: "q1", taskId: "t1", kind: "QUESTION", status: "OPEN", question: "A or B?", options: ["A", "B"], recommend: 1,
    context: null, answer: null, decision: null, answeredBy: null, answeredAt: null, createdAt: "2026-11-13T03:00:00", ...o,
});
const renderPanel = (requests: AyaanRequest[], onError = vi.fn()) => render(
    <QueryClientProvider client={new QueryClient()}>
        <RequestPanel requests={requests} onAnswered={vi.fn()} onError={onError}/>
    </QueryClientProvider>,
);

describe("RequestPanel", () => {
    it("선택지 클릭과 자유 답변이 answer API 를 부른다", async () => {
        answerRequest.mockResolvedValue({});
        renderPanel([req({})]);
        fireEvent.click(screen.getByRole("button", {name: "B (추천)"}));
        await waitFor(() => expect(answerRequest).toHaveBeenCalledWith("q1", {choice: 1}));
        fireEvent.change(screen.getByLabelText("자유 답변"), {target: {value: " C안 "}});
        fireEvent.click(screen.getByRole("button", {name: "답변"}));
        await waitFor(() => expect(answerRequest).toHaveBeenCalledWith("q1", {answer: "C안"}));
    });
    it("권한 요청은 자유 답변 없이 버튼만, 이력은 답과 응답자를 보여준다", () => {
        renderPanel([
            req({id: "q0", status: "CONSUMED", answer: "A", answeredBy: "tg:1"}),
            req({kind: "PERMISSION", question: "Bash: git push", options: ["허용 1회", "거부"], recommend: null}),
        ]);
        expect(screen.getByText("권한 요청 — 응답 대기")).toBeInTheDocument();
        expect(screen.queryByLabelText("자유 답변")).toBeNull();
        expect(screen.getByRole("button", {name: "허용 1회"})).toBeInTheDocument();
        expect(screen.getByText(/tg:1/)).toBeInTheDocument();
    });
    it("409 는 이미 처리됨으로 알린다", async () => {
        answerRequest.mockRejectedValue({response: {status: 409}});
        const onError = vi.fn();
        renderPanel([req({})], onError);
        fireEvent.click(screen.getByRole("button", {name: "A"}));
        await waitFor(() => expect(onError).toHaveBeenCalledWith("이미 처리된 요청입니다."));
    });
});
