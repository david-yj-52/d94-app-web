import {members, workflowStatuses} from "@/test/msw/fixtures";
import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {getProjectMembers, getWorkflowStatuses, updateProjectMemberRole} from "./projectSettings";

// 이슈 생성 모달(담당자·초기 상태)이 쓰는 부분만 확인한다
describe("lib/api/projectSettings", () => {
    it("getProjectMembers: userId·userNm 을 그대로 돌려준다", async () => {
        const list = await getProjectMembers("PRJ-1");
        expect(lastRequest()?.path).toBe("/v1/projects/PRJ-1/members");
        expect(list).toEqual(members);
        expect(list[0].userNm).toBe("김개발");
    });

    it("updateProjectMemberRole: PUT /members/{userId}/role", async () => {
        await updateProjectMemberRole("PRJ-1", "USR-0002", {role: "ADMIN"});
        expect(lastRequest()).toMatchObject({
            method: "PUT", path: "/v1/projects/PRJ-1/members/USR-0002/role", body: {role: "ADMIN"},
        });
    });

    it("getWorkflowStatuses: 목록을 그대로 돌려준다", async () => {
        expect(await getWorkflowStatuses("PRJ-1")).toEqual(workflowStatuses);
        expect(lastRequest()?.path).toBe("/v1/projects/PRJ-1/workflow/statuses");
    });
});
