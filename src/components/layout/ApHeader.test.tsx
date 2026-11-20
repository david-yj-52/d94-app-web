import {ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {renderWithClient} from "@/test/utils";
import {screen, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import ApHeader from "./ApHeader";

vi.mock("next/navigation", () => ({usePathname: () => "/home", useRouter: () => ({push: vi.fn()})}));
vi.mock("next-auth/react", () => ({signOut: vi.fn()}));
vi.mock("next/font/google", () => {
    const font = (name: string) => () => ({className: `font-${name}`});
    return {
        Noto_Sans_KR: font("noto"), Nanum_Gothic: font("nanum"),
        Black_Han_Sans: font("blackhan"), Do_Hyeon: font("dohyeon"),
    };
});

const SETTINGS = "*/api/proxy/v1/settings";
const ME = "*/api/proxy/v1/users/me";
const me = (roles: string[]) => HttpResponse.json(ok({email: "a@b.c", name: "A", avatarUrl: null, roles}));

describe("ApHeader", () => {
    it("저장된 설정이 없으면 TSHInc 를 기본 폰트로 보인다", async () => {
        renderWithClient(<ApHeader user={{name: "A"}}/>);
        const logo = await screen.findByTestId("logo-text");
        expect(logo).toHaveTextContent("TSHInc");
        expect(logo.className).not.toMatch(/font-(noto|nanum|blackhan|dohyeon)/);
    });

    it("저장된 로고 글자와 폰트로 보인다", async () => {
        server.use(http.get(SETTINGS, () => HttpResponse.json(ok({
            "general.logo.text": "ACME", "general.logo.font": "do-hyeon",
        }))));
        renderWithClient(<ApHeader user={{name: "A"}}/>);
        await waitFor(() => expect(screen.getByTestId("logo-text")).toHaveTextContent("ACME"));
        expect(screen.getByTestId("logo-text").className).toContain("font-dohyeon");
    });

    it("ADMIN 이면 기준정보 링크(/settings)가 있다", async () => {
        server.use(http.get(ME, () => me(["USER", "ADMIN"])));
        renderWithClient(<ApHeader user={{name: "A"}}/>);
        expect(await screen.findByRole("link", {name: /기준정보/})).toHaveAttribute("href", "/settings");
    });

    it("ADMIN 이 아니면 기준정보 링크가 없다", async () => {
        server.use(http.get(ME, () => me(["USER"])));
        const {client} = renderWithClient(<ApHeader user={{name: "A"}}/>);
        await waitFor(() => expect(client.getQueryData(["users", "me"])).toBeDefined());
        expect(screen.queryByRole("link", {name: /기준정보/})).toBeNull();
    });
});
