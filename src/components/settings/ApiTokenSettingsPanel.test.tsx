import {noContent, ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {renderWithClient} from "@/test/utils";
import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ApiToken} from "@/types/apiToken";
import ApiTokenSettingsPanel from "./ApiTokenSettingsPanel";

const API = "*/api/proxy/v1/api-tokens";
const RAW = "d94_cira_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
const token = (over: Partial<ApiToken> = {}): ApiToken => ({
    id: "t1", name: "노트북", service: "cira", access: "READ", prefix: "d94_cira_abc",
    expiresAt: "2099-01-01T00:00:00", lastUsedAt: null, createdAt: "2026-11-20T10:00:00", ...over,
});

let tokens: ApiToken[];
let enabled: boolean;
/** server.use 핸들러가 기록용 패스스루보다 먼저 응답하므로 받은 요청을 여기 직접 남긴다 */
let sent: { method: string; path: string; body?: unknown }[];

beforeEach(() => {
    tokens = [];
    enabled = true;
    sent = [];
    server.use(
        http.get(API, () => HttpResponse.json(ok(tokens))),
        http.get(`${API}/services`, () => HttpResponse.json(ok([{service: "cira", enabled}]))),
        http.post(API, async ({request}) => {
            sent.push({method: "POST", path: "/v1/api-tokens", body: await request.json()});
            const info = token({id: "t-new", name: "새 토큰"});
            tokens = [info];
            return HttpResponse.json(ok({token: RAW, info}), {status: 201});
        }),
        http.delete(`${API}/:id`, ({params}) => {
            sent.push({method: "DELETE", path: `/v1/api-tokens/${params.id}`});
            tokens = [];
            return HttpResponse.json(noContent());
        }),
        http.put(`${API}/services/:service`, async ({request}) => {
            const body = (await request.json()) as { enabled: boolean };
            sent.push({method: "PUT", path: "/v1/api-tokens/services/cira", body});
            enabled = body.enabled;
            return HttpResponse.json(ok([{service: "cira", enabled}]));
        }),
    );
});

describe("ApiTokenSettingsPanel", () => {
    it("발급하면 원문을 한 번 보여주고, 확인하면 사라진다", async () => {
        const user = userEvent.setup();
        renderWithClient(<ApiTokenSettingsPanel isAdmin={false}/>);
        await screen.findByRole("option", {name: "CIRA"});
        await user.type(screen.getByLabelText("토큰 이름"), "새 토큰");
        await user.selectOptions(screen.getByLabelText("권한"), "WRITE");
        await user.selectOptions(screen.getByLabelText("만료"), "30");
        await user.click(screen.getByRole("button", {name: "발급"}));

        await waitFor(() => expect(sent.find((r) => r.method === "POST")?.body).toEqual({
            service: "cira", name: "새 토큰", access: "WRITE", expiresInDays: 30,
        }));
        expect(await screen.findByLabelText("발급된 토큰")).toHaveTextContent(RAW);
        expect(await screen.findByText("d94_cira_abc…")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "확인했습니다"}));
        expect(screen.queryByLabelText("발급된 토큰")).not.toBeInTheDocument();
        expect(screen.queryByText(RAW)).not.toBeInTheDocument();
    });

    it("이름이 비면 발급 버튼이 꺼져 있다", async () => {
        renderWithClient(<ApiTokenSettingsPanel isAdmin={false}/>);
        await screen.findByRole("option", {name: "CIRA"});
        expect(screen.getByRole("button", {name: "발급"})).toBeDisabled();
    });

    it("확인 후 폐기를 요청한다", async () => {
        tokens = [token()];
        vi.spyOn(window, "confirm").mockReturnValue(true);
        const user = userEvent.setup();
        renderWithClient(<ApiTokenSettingsPanel isAdmin={false}/>);
        await user.click(await screen.findByRole("button", {name: "노트북 폐기"}));
        await waitFor(() => expect(sent.find((r) => r.method === "DELETE")?.path).toBe("/v1/api-tokens/t1"));
        expect(await screen.findByText("발급한 토큰이 없습니다.")).toBeInTheDocument();
    });

    it("만료된 토큰은 만료됨으로 보인다", async () => {
        tokens = [token({expiresAt: "2000-01-01T00:00:00"})];
        renderWithClient(<ApiTokenSettingsPanel isAdmin={false}/>);
        const row = (await screen.findByText("노트북")).closest("tr")!;
        expect(within(row).getByText("만료됨")).toBeInTheDocument();
    });

    it("서비스 이름을 보여 주고, 기본 선택은 전역이 아닌 서비스이며 전역을 고르면 경고가 뜬다", async () => {
        server.use(http.get(`${API}/services`, () => HttpResponse.json(ok([
            {service: "all", enabled: true}, {service: "cira", enabled: true}, {service: "docs", enabled: true},
        ]))));
        const user = userEvent.setup();
        renderWithClient(<ApiTokenSettingsPanel isAdmin={false}/>);
        await screen.findByRole("option", {name: "전체 (전역)"});
        expect(screen.getByRole("option", {name: "Docs"})).toBeInTheDocument();
        expect(screen.getByLabelText("서비스")).toHaveValue("cira");
        expect(screen.queryByRole("note")).not.toBeInTheDocument();
        await user.selectOptions(screen.getByLabelText("서비스"), "all");
        expect(screen.getByRole("note")).toHaveTextContent("전역 토큰은 모든 서비스");
    });

    it("관리자가 아니면 서비스 허용을 바꿀 수 없다", async () => {
        renderWithClient(<ApiTokenSettingsPanel isAdmin={false}/>);
        expect(await screen.findByLabelText("cira API 토큰 허용")).toBeDisabled();
        expect(screen.getByText("관리자만 변경할 수 있습니다.")).toBeInTheDocument();
    });

    it("관리자가 끄면 PUT 하고, 발급할 서비스가 없어진다", async () => {
        const user = userEvent.setup();
        renderWithClient(<ApiTokenSettingsPanel isAdmin/>);
        await user.click(await screen.findByLabelText("cira API 토큰 허용"));
        await waitFor(() => expect(sent.find((r) => r.method === "PUT")?.body).toEqual({enabled: false}));
        expect(await screen.findByRole("option", {name: "허용된 서비스 없음"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "발급"})).toBeDisabled();
    });
});
