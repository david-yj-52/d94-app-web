import {lastRequest, renderWithClient} from "@/test/utils";
import {screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, it} from "vitest";
import CiraSettingsPanel from "./CiraSettingsPanel";

describe("기준정보 › CIRA — 필드 라이브러리", () => {
    it("복사본이 0개인 전역 필드는 '아직 어디에도 적용되지 않음'", async () => {
        renderWithClient(<CiraSettingsPanel readOnly={false}/>);
        await userEvent.click(await screen.findByRole("tab", {name: "사용자 정의 필드"}));
        const row = await screen.findByRole("listitem", {name: "고객사"});
        expect(within(row).getByText("아직 어디에도 적용되지 않음")).toBeInTheDocument();
    });

    it("전역 필드를 만들 때 넣을 프리셋을 고르면 copyToTypeIds 로 보낸다", async () => {
        renderWithClient(<CiraSettingsPanel readOnly={false}/>);
        await userEvent.click(await screen.findByRole("tab", {name: "사용자 정의 필드"}));
        await userEvent.click(screen.getByRole("button", {name: "새 필드"}));
        await userEvent.type(screen.getByLabelText("이름"), "계약 금액");
        await userEvent.click(screen.getByRole("checkbox", {name: "KANBAN"}));
        await userEvent.click(screen.getByRole("button", {name: "저장"}));
        expect((await screen.findAllByText(/저장했습니다/)).length).toBeGreaterThan(0);
        expect(lastRequest("POST")).toMatchObject({path: "/v1/cira/custom-fields", body: {fieldNm: "계약 금액", copyToTypeIds: ["PT-KANBAN"]}});
    });

    it("프리셋 화면의 '이 프리셋의 필드' [+ 새 필드] 는 타입 경로로 만든다", async () => {
        renderWithClient(<CiraSettingsPanel readOnly={false}/>);
        await userEvent.click(await screen.findByRole("button", {name: "이 프리셋에 새 필드"}));
        await userEvent.type(screen.getByLabelText("이름"), "단계");
        await userEvent.click(screen.getByRole("button", {name: "저장"}));
        expect((await screen.findAllByText(/저장했습니다/)).length).toBeGreaterThan(0);
        expect(lastRequest("POST")?.path).toBe("/v1/cira/project-types/PT-KANBAN/custom-fields");
    });
});

describe("기준정보 › CIRA — 프리셋 기본 워크플로 (V670)", () => {
    it("상태를 추가·분류하고 보드 유형을 바꿔 저장하면 statuses·boardType 을 보낸다", async () => {
        renderWithClient(<CiraSettingsPanel readOnly={false}/>);
        const wf = await screen.findByRole("region", {name: "기본 워크플로"});
        expect(within(wf).getByLabelText("상태 4 이름")).toHaveValue("Done");
        await userEvent.selectOptions(within(wf).getByLabelText("보드 유형"), "SCRUM");
        await userEvent.click(within(wf).getByRole("button", {name: "상태 3 빼기"})); // In Review
        await userEvent.click(within(wf).getByRole("button", {name: "상태 추가"}));
        await userEvent.type(within(wf).getByLabelText("상태 4 이름"), "검증");
        await userEvent.click(within(wf).getByRole("button", {name: "워크플로 저장"}));
        expect((await screen.findAllByText(/워크플로를 저장했습니다/)).length).toBeGreaterThan(0);
        expect(lastRequest("PUT")).toMatchObject({path: "/v1/cira/project-types/PT-KANBAN", body: {boardType: "SCRUM", statuses: [
            {name: "To Do", category: "TODO"}, {name: "In Progress", category: "IN_PROGRESS"}, {name: "Done", category: "DONE"},
            {name: "검증", category: "IN_PROGRESS"}]}});
    });

    it("첫 상태가 '할 일'이 아니면 저장할 수 없다", async () => {
        renderWithClient(<CiraSettingsPanel readOnly={false}/>);
        const wf = await screen.findByRole("region", {name: "기본 워크플로"});
        await userEvent.selectOptions(within(wf).getByLabelText("상태 1 분류"), "IN_PROGRESS");
        expect(within(wf).getByText("첫 상태는 '할 일'이어야 합니다.")).toBeInTheDocument();
        expect(within(wf).getByRole("button", {name: "워크플로 저장"})).toBeDisabled();
    });
});
