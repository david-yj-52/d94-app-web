import {ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {lastRequest, renderWithClient} from "@/test/utils";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import GeneralSettingsPanel from "./GeneralSettingsPanel";

vi.mock("next/font/google", () => {
    const font = (name: string) => () => ({className: `font-${name}`});
    return {
        Noto_Sans_KR: font("noto"), Nanum_Gothic: font("nanum"),
        Black_Han_Sans: font("blackhan"), Do_Hyeon: font("dohyeon"),
    };
});

const SETTINGS = "*/api/proxy/v1/settings";

describe("GeneralSettingsPanel", () => {
    it("저장된 값이 없으면 TSHInc · 기본 폰트로 채운다", async () => {
        renderWithClient(<GeneralSettingsPanel readOnly={false}/>);
        expect(await screen.findByLabelText("로고 글자")).toHaveValue("TSHInc");
        expect(screen.getByLabelText("로고 폰트")).toHaveValue("default");
    });

    it("저장된 값으로 채운다", async () => {
        server.use(http.get(SETTINGS, () => HttpResponse.json(ok({
            "general.logo.text": "ACME", "general.logo.font": "do-hyeon",
        }))));
        renderWithClient(<GeneralSettingsPanel readOnly={false}/>);
        await waitFor(() => expect(screen.getByLabelText("로고 글자")).toHaveValue("ACME"));
        expect(screen.getByLabelText("로고 폰트")).toHaveValue("do-hyeon");
    });

    it("저장하면 로고 글자와 폰트를 PUT 한다", async () => {
        const user = userEvent.setup();
        renderWithClient(<GeneralSettingsPanel readOnly={false}/>);
        const text = await screen.findByLabelText("로고 글자");
        await user.clear(text);
        await user.type(text, "ACME");
        await user.selectOptions(screen.getByLabelText("로고 폰트"), "black-han-sans");
        await user.click(screen.getByRole("button", {name: "저장"}));
        await waitFor(() => expect(lastRequest("PUT", "/v1/settings")?.body).toEqual({
            "general.logo.text": "ACME", "general.logo.font": "black-han-sans",
        }));
    });

    it("목록에 없는 폰트가 저장돼 있으면 기본으로 보이고, 글자만 바꿔 저장해도 기본 폰트로 보낸다", async () => {
        server.use(http.get(SETTINGS, () => HttpResponse.json(ok({"general.logo.font": "comic-sans"}))));
        const user = userEvent.setup();
        renderWithClient(<GeneralSettingsPanel readOnly={false}/>);
        const text = await screen.findByLabelText("로고 글자");
        expect(screen.getByLabelText("로고 폰트")).toHaveValue("default");
        await user.clear(text);
        await user.type(text, "ACME");
        await user.click(screen.getByRole("button", {name: "저장"}));
        await waitFor(() => expect(lastRequest("PUT", "/v1/settings")?.body).toEqual({
            "general.logo.text": "ACME", "general.logo.font": "default",
        }));
    });

    it("공백뿐인 글자면 저장할 수 없다", async () => {
        const user = userEvent.setup();
        renderWithClient(<GeneralSettingsPanel readOnly={false}/>);
        const text = await screen.findByLabelText("로고 글자");
        await user.clear(text);
        await user.type(text, "   ");
        expect(screen.getByRole("button", {name: "저장"})).toBeDisabled();
    });

    it("readOnly 면 모두 비활성이고 안내를 보인다", async () => {
        renderWithClient(<GeneralSettingsPanel readOnly/>);
        expect(await screen.findByLabelText("로고 글자")).toBeDisabled();
        expect(screen.getByLabelText("로고 폰트")).toBeDisabled();
        expect(screen.getByRole("button", {name: "저장"})).toBeDisabled();
        expect(screen.getByText("관리자만 변경할 수 있습니다.")).toBeInTheDocument();
    });
});
