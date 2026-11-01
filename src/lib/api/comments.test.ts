import {comment} from "@/test/msw/fixtures";
import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {createComment, deleteComment, getComments, toggleReaction, updateComment} from "./comments";

describe("lib/api/comments", () => {
    it("getComments: 이슈 댓글 목록(답글·parentId·reactionType 포함)을 그대로 돌려준다", async () => {
        const list = await getComments("ISS-1");
        expect(lastRequest()?.path).toBe("/v1/issues/ISS-1/comments");
        expect(list).toEqual([comment]);
        expect(list[0].reactions?.[0].reactionType).toBe("👍");
        expect(list[0].replies?.[0].parentId).toBe("CMT-1");
    });

    it("createComment: 이슈 경로로 content 를 보낸다", async () => {
        const created = await createComment("ISS-1", {content: "새 댓글"});
        expect(lastRequest()).toMatchObject({method: "POST", path: "/v1/issues/ISS-1/comments", body: {content: "새 댓글"}});
        expect(created.content).toBe("새 댓글");
    });

    it("createComment: 답글은 부모 id 를 parentId 로 보낸다", async () => {
        const reply = await createComment("ISS-1", {content: "답글", parentId: "CMT-1"});
        expect(lastRequest("POST")?.body).toEqual({content: "답글", parentId: "CMT-1"});
        expect(reply.parentId).toBe("CMT-1");
    });

    it("updateComment / deleteComment: /v1/comments/{commentId}", async () => {
        const updated = await updateComment("CMT-1", {content: "수정"});
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/comments/CMT-1", body: {content: "수정"}});
        expect(updated.content).toBe("수정");

        await expect(deleteComment("CMT-1")).resolves.toBeUndefined();
        expect(lastRequest()).toMatchObject({method: "DELETE", path: "/v1/comments/CMT-1"});
    });

    it("toggleReaction: POST {reactionType} 하나로 추가·취소하고 바뀐 댓글을 돌려준다", async () => {
        const res = await toggleReaction("CMT-1", "👍");
        expect(lastRequest()).toMatchObject({method: "POST", path: "/v1/comments/CMT-1/reactions", body: {reactionType: "👍"}});
        expect(res.id).toBe("CMT-1");
    });

    it("백엔드 오류 응답은 그대로 던진다 (예: 255자 넘는 content → 500)", async () => {
        await expect(updateComment("CMT-1", {content: "가".repeat(256)})).rejects.toMatchObject({
            response: {status: 500, data: {success: false, code: "INTERNAL_ERROR"}},
        });
    });
});
