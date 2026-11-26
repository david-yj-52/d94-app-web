import {describe, expect, it} from "vitest";
import {formatValue, insertRef, refQueryAt} from "./formulaRef";

describe("formulaRef", () => {
    it("커서 앞 @부분코드를 찾는다", () => {
        expect(refQueryAt("4500 / @hou", 11)).toBe("hou");
        expect(refQueryAt("4500 / @", 8)).toBe("");
        expect(refQueryAt("a + b", 5)).toBeNull();
        expect(refQueryAt("@wage + 1", 9)).toBeNull(); // 이미 끝난 참조
    });

    it("선택한 코드로 바꾸고 커서를 뒤로 옮긴다", () => {
        expect(insertRef("4500 / @hou * 60", 11, "hourly_wage")).toEqual({text: "4500 / @hourly_wage  * 60", caret: 20});
    });

    it("값을 읽기 좋게 쓴다", () => {
        expect(formatValue(null)).toBe("—");
        expect(formatValue(25000.4)).toBe("25,000");
        expect(formatValue(10.8333)).toBe("10.83");
    });
});
