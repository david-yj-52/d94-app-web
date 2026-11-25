import {ok, project} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {renderWithClient} from "@/test/utils";
import {act, screen, waitFor} from "@testing-library/react";
import {delay, http, HttpResponse} from "msw";
import {Suspense} from "react";
import {describe, expect, it, vi} from "vitest";
import SettingsGeneralPage from "./page";

vi.mock("next/navigation", () => ({useRouter: () => ({push: vi.fn()})}));

const types = [
    {id: "PT-HW", typeNm: "Hardware Development", descr: null, sortOrd: 1, projectCount: 0, fields: []},
    {id: "PT-SW", typeNm: "Software Development", descr: null, sortOrd: 2, projectCount: 1, fields: []},
];

describe("프로젝트 설정 › 기본 정보", () => {
    it("타입 목록이 프로젝트보다 늦게 와도 프로젝트의 타입이 선택돼 있다 (새로고침 시 첫 타입으로 보이던 결함)", async () => {
        server.use(
            http.get("*/api/proxy/v1/projects/:projectId", () =>
                HttpResponse.json(ok({...project, projectTypeId: "PT-SW", projectTypeNm: "Software Development"}))),
            http.get("*/api/proxy/v1/cira/project-types", async () => {
                await delay(150);
                return HttpResponse.json(ok(types));
            }),
        );
        const params = Promise.resolve({projectId: "PRJ-1"});
        await act(async () => {
            renderWithClient(<Suspense><SettingsGeneralPage params={params}/></Suspense>);
        });
        await screen.findByRole("option", {name: "Software Development"}, {timeout: 5000});
        await waitFor(() => expect(screen.getByRole<HTMLSelectElement>("combobox").value).toBe("PT-SW"));
        expect(screen.getByRole<HTMLOptionElement>("option", {name: "Software Development"}).selected).toBe(true);
    });
});
