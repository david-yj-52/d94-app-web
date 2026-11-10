import {describe, expect, it} from "vitest";
import {buildSegments} from "./segments";
import {rangeToAnchor} from "./selection";
import type {PageAnnotation} from "@/types/study";

const order = new Map([["b1", 1], ["b2", 2], ["b3", 3]]);
const ann = (id: string, s: string, so: number, e: string, eo: number, color: PageAnnotation["color"] = "yellow"): PageAnnotation =>
    ({id, startBlockKey: s, startOffset: so, endBlockKey: e, endOffset: eo, color, hasNote: false});

describe("buildSegments", () => {
    it("returns one plain segment when nothing applies", () => {
        expect(buildSegments("abc", "b1", [], [], order)).toEqual(
            [{start: 0, end: 3, text: "abc", termId: null, annotationIds: [], color: null}]);
    });

    it("partialOverlapSplitsIntoThree", () => {
        const segs = buildSegments("audit planning", "b1", [{blockKey: "b1", start: 0, end: 5, termId: "t1"}],
            [ann("a1", "b1", 3, "b1", 9)], order);
        expect(segs.map((s) => [s.text, s.termId, s.color])).toEqual(
            [["aud", "t1", null], ["it", "t1", "yellow"], [" pla", null, "yellow"], ["nning", null, null]]);
    });

    it("annotation spanning blocks covers middle fully and end block prefix", () => {
        const a = [ann("a1", "b1", 2, "b3", 1, "green")];
        expect(buildSegments("xyz", "b2", [], a, order).map((s) => [s.text, s.color])).toEqual([["xyz", "green"]]);
        expect(buildSegments("pq", "b3", [], a, order).map((s) => [s.text, s.color])).toEqual([["p", "green"], ["q", null]]);
    });

    it("ignores hits and annotations of other blocks", () => {
        const segs = buildSegments("abc", "b1", [{blockKey: "b2", start: 0, end: 1, termId: "t"}], [ann("a", "b2", 0, "b2", 1)], order);
        expect(segs).toHaveLength(1);
    });
});

describe("rangeToAnchor", () => {
    const mount = (html: string) => {
        document.body.innerHTML = `<div id="root">${html}</div>`;
        return document.getElementById("root") as HTMLElement;
    };

    it("offsetIgnoresNestedSpans", () => {
        const root = mount(`<p data-block-key="b1">Audit <span><mark>plan</mark>ning</span></p>`);
        const plan = root.querySelector("mark")!.firstChild!;
        const ning = root.querySelector("span")!.lastChild!;
        const r = document.createRange();
        r.setStart(plan, 1);
        r.setEnd(ning, 4);
        expect(rangeToAnchor(r, root)).toEqual({startBlockKey: "b1", startOffset: 7, endBlockKey: "b1", endOffset: 14, text: "lanning"});
    });

    it("cross-block selection reports both keys", () => {
        const root = mount(`<p data-block-key="b1">abcdef</p><p data-block-key="b2">ghij</p>`);
        const r = document.createRange();
        r.setStart(root.querySelector('[data-block-key="b1"]')!.firstChild!, 3);
        r.setEnd(root.querySelector('[data-block-key="b2"]')!.firstChild!, 2);
        expect(rangeToAnchor(r, root)).toMatchObject({startBlockKey: "b1", startOffset: 3, endBlockKey: "b2", endOffset: 2});
    });

    it("selectionInsideTableCellUsesCellKey", () => {
        const root = mount(`<table data-block-key="t1" data-block-type="TABLE"><tbody><tr><td data-block-key="c1">What is</td></tr></tbody></table>`);
        const r = document.createRange();
        const t = root.querySelector("td")!.firstChild!;
        r.setStart(t, 0);
        r.setEnd(t, 4);
        expect(rangeToAnchor(r, root)).toMatchObject({startBlockKey: "c1", endBlockKey: "c1", startOffset: 0, endOffset: 4});
    });

    it("returns null for collapsed or outside-root selection", () => {
        const root = mount(`<p data-block-key="b1">abc</p>`);
        const r = document.createRange();
        r.setStart(root.querySelector("p")!.firstChild!, 1);
        expect(rangeToAnchor(r, root)).toBeNull();
        document.body.insertAdjacentHTML("beforeend", `<p id="out">zzz</p>`);
        const o = document.createRange();
        o.selectNodeContents(document.getElementById("out")!);
        expect(rangeToAnchor(o, root)).toBeNull();
    });
});
