import {describe, expect, it, vi} from "vitest";
import {LOGO_FONTS, logoFontClass} from "./logoFonts";

// next/font 는 빌드 도구(SWC) 변환이 필요하다 → 폰트 이름을 className 으로 돌려주는 가짜로 바꾼다
vi.mock("next/font/google", () => {
    const font = (name: string) => () => ({className: `font-${name}`});
    return {
        Noto_Sans_KR: font("noto"), Nanum_Gothic: font("nanum"),
        Black_Han_Sans: font("blackhan"), Do_Hyeon: font("dohyeon"),
    };
});

describe("logoFonts", () => {
    it("폰트 목록 순서는 기본 → Noto → 나눔고딕 → Black Han Sans → Do Hyeon (백엔드 허용 목록과 같은 id)", () => {
        expect(LOGO_FONTS.map((f) => f.id)).toEqual(
            ["default", "noto-sans-kr", "nanum-gothic", "black-han-sans", "do-hyeon"]);
    });

    it("id 로 className 을 찾는다", () => {
        expect(logoFontClass("do-hyeon")).toBe("font-dohyeon");
    });

    it("모르는 id·없는 값·default 는 기본 폰트(빈 클래스)", () => {
        expect(logoFontClass("comic-sans")).toBe("");
        expect(logoFontClass(undefined)).toBe("");
        expect(logoFontClass("default")).toBe("");
    });
});
