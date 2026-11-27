import {lastRequest, renderWithClient} from "@/test/utils";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, it, vi} from "vitest";
import CreateProjectModal from "./CreateProjectModal";

describe("CreateProjectModal 작업 공간 구성", () => {
    it("공간을 여러 개 추가해 spaces 로 보낸다 — 첫 번째가 기본, 빈 공간은 presetTypeId null", async () => {
        const onClose = vi.fn();
        renderWithClient(<CreateProjectModal onClose={onClose}/>);
        await screen.findByRole("option", {name: "KANBAN"});
        await userEvent.type(screen.getByPlaceholderText("PROJ"), "SFARM");
        await userEvent.type(screen.getByPlaceholderText("프로젝트 이름"), "스마트팜 PoC");
        await userEvent.clear(screen.getByLabelText("작업 공간 1 이름"));
        await userEvent.type(screen.getByLabelText("작업 공간 1 이름"), "공통");
        await userEvent.click(screen.getByRole("button", {name: "작업 공간 추가"}));
        await userEvent.type(screen.getByLabelText("작업 공간 2 이름"), "Hardware");
        await userEvent.selectOptions(screen.getByLabelText("작업 공간 2 프리셋"), "KANBAN");
        await userEvent.click(screen.getByRole("button", {name: "생성"}));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(lastRequest("POST", "/v1/projects")?.body).toEqual({
            key: "SFARM", name: "스마트팜 PoC", description: "",
            spaces: [{name: "공통", presetTypeId: null}, {name: "Hardware", presetTypeId: "PT-KANBAN"}],
        });
    });

    it("공간 이름이 겹치면 보내지 않는다", async () => {
        renderWithClient(<CreateProjectModal onClose={vi.fn()}/>);
        await userEvent.type(screen.getByPlaceholderText("PROJ"), "DUP");
        await userEvent.type(screen.getByPlaceholderText("프로젝트 이름"), "중복");
        await userEvent.click(screen.getByRole("button", {name: "작업 공간 추가"}));
        await userEvent.type(screen.getByLabelText("작업 공간 2 이름"), "General");
        await userEvent.click(screen.getByRole("button", {name: "생성"}));
        expect(await screen.findByText("작업 공간 이름이 겹칩니다.")).toBeInTheDocument();
        expect(lastRequest("POST", "/v1/projects")).toBeUndefined();
    });
});
