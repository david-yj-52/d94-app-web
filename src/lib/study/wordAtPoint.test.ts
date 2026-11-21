import {describe, expect, it, vi} from "vitest";
import {expandWord, wordAtPoint} from "./wordAtPoint";

describe("expandWord", () => {
    it("expands across the whole word", () => expect(expandWord("the controls that", 6)).toEqual([4, 12]));
    it("keeps internal apostrophes and hyphens", () => expect(expandWord("a well-known auditor's view", 5)).toEqual([2, 12]));
    it("trims a trailing apostrophe", () => expect("auditors' view".slice(...expandWord("auditors' view", 3)!)).toBe("auditors"));
    it("returns null for spaces and digits", () => { expect(expandWord("a  b", 2)).toBeNull(); expect(expandWord("1234", 1)).toBeNull(); });
    it("works at end of text", () => expect(expandWord("plan", 4)).toEqual([0, 4]));
});

describe("wordAtPoint", () => {
    it("rejects nodes outside the reader", () => {
        const root = document.createElement("div"); const outside = document.createTextNode("auditor");
        document.body.append(outside);
        const range = document.createRange(); range.setStart(outside, 2);
        Object.defineProperty(document, "caretRangeFromPoint", {configurable: true, value: vi.fn(() => range)});
        expect(wordAtPoint(10, 10, root)).toBeNull();
    });
    it("reads text nested inside mark", () => {
        const root = document.createElement("div"); root.innerHTML = "<mark>auditor</mark>"; document.body.append(root);
        const text = root.querySelector("mark")!.firstChild!;
        Object.defineProperty(document, "caretRangeFromPoint", {configurable: true, value: vi.fn(() => { const r = document.createRange(); r.setStart(text, 2); return r; })});
        Object.defineProperty(Range.prototype, "getBoundingClientRect", {configurable: true, value: vi.fn(() => ({left:0,right:50,top:0,bottom:20,width:50,height:20,x:0,y:0,toJSON:()=>({})} as DOMRect))});
        expect(wordAtPoint(10, 10, root)?.word).toBe("auditor");
    });
});
