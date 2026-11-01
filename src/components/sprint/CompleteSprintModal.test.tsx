import {sprint} from "@/test/msw/fixtures";
import {lastRequest, renderWithClient} from "@/test/utils";
import type {SprintResponse} from "@/types/sprint";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, it, vi} from "vitest";
import CompleteSprintModal from "./CompleteSprintModal";

// 부모(sprints 화면)는 useSprints 결과를 그대로 넘긴다 → 백엔드 모양 그대로 web 타입으로 본다
const activeSprint = sprint as unknown as SprintResponse;

function setup() {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithClient(
        <CompleteSprintModal projectId="PRJ-1" sprint={activeSprint} onClose={onClose} onSuccess={onSuccess}/>,
    );
    return {user, onClose, onSuccess};
}

describe("CompleteSprintModal", () => {
    it("스프린트 이슈를 조회해 미완료 이슈를 보이고, 백로그로 완료한다", async () => {
        const {user, onClose, onSuccess} = setup();
        expect(await screen.findByText("로그인 버그")).toBeInTheDocument(); // statusNm "To Do" → 미완료
        expect(lastRequest("GET", "/v1/projects/PRJ-1/issues")?.query.get("sprintId")).toBe("SPR-1");

        await user.click(screen.getByRole("button", {name: /완료/}));
        await waitFor(() => expect(onSuccess).toHaveBeenCalled());
        expect(onClose).toHaveBeenCalled();
        expect(lastRequest("POST")).toMatchObject({
            path: "/v1/sprints/SPR-1/complete",
            body: {incompleteIssueAction: "BACKLOG"},
        });
    });

    // 다음 스프린트 후보 = sprintStat "Planned" 이고 현재 스프린트가 아닌 것
    it("계획 중(Planned) 스프린트를 다음 스프린트 후보로 보여 주고, 골라서 완료한다", async () => {
        const {user, onSuccess} = setup();
        await screen.findByText("로그인 버그");
        await user.click(screen.getByRole("radio", {name: /다음 스프린트로 이동/}));
        const option = await screen.findByRole("option", {name: /Sprint 2/});
        expect(screen.queryByRole("option", {name: /Sprint 1/})).not.toBeInTheDocument(); // 자기 자신(Active) 제외
        await user.selectOptions(option.closest("select")!, "SPR-2");
        await user.click(screen.getByRole("button", {name: /완료/}));
        await waitFor(() => expect(onSuccess).toHaveBeenCalled());
        expect(lastRequest("POST")).toMatchObject({
            path: "/v1/sprints/SPR-1/complete",
            body: {incompleteIssueAction: "NEXT_SPRINT", nextSprintId: "SPR-2"},
        });
    });
});
