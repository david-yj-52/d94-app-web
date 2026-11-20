import {describe, expect, it} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import AutoScroll, {clampLevel} from "./AutoScroll";

const toggle = () => screen.getByRole("button", {name: /자동 스크롤/});
const running = () => toggle().getAttribute("aria-pressed") === "true";

describe("AutoScroll", () => {
    it("starts, stops on wheel/arrow/mousedown, resumes on Enter, ignores Enter in inputs", () => {
        render(<><input aria-label="노트"/><AutoScroll pageId="p1" next={null} onNext={() => {}}/></>);
        expect(running()).toBe(false);

        fireEvent.click(toggle());
        expect(running()).toBe(true);
        fireEvent.wheel(window);
        expect(running()).toBe(false);

        fireEvent.keyDown(window, {key: "Enter"});
        expect(running()).toBe(true);
        fireEvent.keyDown(window, {key: "ArrowDown"});
        expect(running()).toBe(false);

        fireEvent.keyDown(screen.getByLabelText("노트"), {key: "Enter"});
        expect(running()).toBe(false);

        fireEvent.keyDown(window, {key: "Enter"});
        fireEvent.mouseDown(document.body); // 본문 누름(글자 선택)
        expect(running()).toBe(false);
    });

    it("keeps speed between 1 and 10 and remembers it in a cookie", () => {
        window.history.pushState({}, "", "/study/doc-1"); // 쿠키 Path=/study
        render(<AutoScroll pageId="p1" next={null} onNext={() => {}}/>);
        for (let i = 0; i < 12; i++) fireEvent.click(screen.getByRole("button", {name: "빠르게"}));
        expect(screen.getByLabelText("속도").textContent).toBe("10");
        expect(document.cookie).toContain("study_autoscroll_speed=10");
        expect(running()).toBe(false); // 조절기 버튼 누름은 멈춤 처리 대상이 아니다
        expect([clampLevel(0), clampLevel(99), clampLevel(Number("x"))]).toEqual([1, 10, 3]);
    });
});
