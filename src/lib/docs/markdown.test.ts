import {describe, expect, it} from "vitest";
import {extractLinks, extractTags, extractTasks, linkTitle, readFrontmatter, stripFrontmatter, titleFromHref, toMarkdownLinks} from "./markdown";

const NOTE = `---
kind: doc
origin: "[[아이디어 A]]"
---
본문 [[노트 B]] 와 [[노트 C|별칭]] [[노트 D#헤딩]] #설계/백엔드 #123
- [ ] 할 일 📅 2026-12-01
- [/] 진행
* [x] 끝`;

describe("docs markdown", () => {
    it("frontmatter", () => {
        expect(readFrontmatter(NOTE)).toEqual({kind: "doc", origin: "[[아이디어 A]]"});
        expect(linkTitle(readFrontmatter(NOTE).origin)).toBe("아이디어 A");
        expect(stripFrontmatter(NOTE).startsWith("본문")).toBe(true);
    });

    it("links·tags·tasks (서버 DocsMarkdownIndexer 와 같은 규칙)", () => {
        expect(extractLinks(NOTE)).toEqual(["노트 B", "노트 C", "노트 D"]);
        expect(extractTags(NOTE)).toEqual(["설계/백엔드"]);
        expect(extractTasks(NOTE)).toEqual([
            {lineNo: 5, text: "할 일 📅 2026-12-01", status: "todo", dueDt: "2026-12-01"},
            {lineNo: 6, text: "진행", status: "doing", dueDt: null},
            {lineNo: 7, text: "끝", status: "done", dueDt: null},
        ]);
    });

    it("wikilink → markdown link 왕복", () => {
        const md = toMarkdownLinks("[[노트 C|별칭]] [[A B]]");
        expect(md).toBe("[별칭](#note:%EB%85%B8%ED%8A%B8%20C) [A B](#note:A%20B)");
        expect(titleFromHref("#note:%EB%85%B8%ED%8A%B8%20C")).toBe("노트 C");
        expect(titleFromHref("https://x")).toBeNull();
    });
});
