import {ok, project} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {renderWithClient} from "@/test/utils";
import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw";
import {Suspense} from "react";
import {describe, expect, it, vi} from "vitest";
import SettingsGeneralPage from "./page";

vi.mock("next/navigation", () => ({useRouter: () => ({push: vi.fn()})}));

describe("프로젝트 설정 › 기본 정보", () => {
    it("프로젝트 타입 선택이 없고, 저장은 이름·설명만 보낸다 (V660: 프로젝트에는 타입이 없다)", async () => {
        let sent: unknown;
        server.use(http.put("*/api/proxy/v1/projects/:projectId", async ({request}) => {
            sent = await request.json();
            return HttpResponse.json(ok(project));
        }));
        const params = Promise.resolve({projectId: "PRJ-1"});
        await act(async () => {
            renderWithClient(<Suspense><SettingsGeneralPage params={params}/></Suspense>);
        });
        const name = await screen.findByDisplayValue(project.name);
        expect(screen.queryByRole("combobox")).toBeNull();
        expect(screen.queryByText("프로젝트 타입")).toBeNull();

        await userEvent.clear(name);
        await userEvent.type(name, "새 이름");
        await userEvent.click(screen.getByRole("button", {name: "저장"}));
        await waitFor(() => expect(sent).toEqual({name: "새 이름", description: project.description ?? ""}));
    });
});
