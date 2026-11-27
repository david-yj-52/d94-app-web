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
