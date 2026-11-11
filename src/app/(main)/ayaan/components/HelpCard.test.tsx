import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import HelpCard from "./HelpCard";

describe("HelpCard", () => {
    it("EXHAUST_POLICY 카드에 5개 제목과 부록 A 문구가 보인다", () => {
        render(<HelpCard helpKey="EXHAUST_POLICY" defaultOpen/>);
        for (const t of ["무엇인가", "기본값·범위", "언제 바꾸나", "예시", "주의"]) {
            expect(screen.getByText(t)).toBeInTheDocument();
        }
        expect(screen.getAllByText(/WAIT_SAME_TOOL/).length).toBeGreaterThan(0);
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
});
