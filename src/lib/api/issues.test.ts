import {issue1} from "@/test/msw/fixtures";
import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {
    createIssue,
    deleteIssue,
    getAvailableTransitions,
    getIssue,
    getIssues,
    updateIssue,
    updateIssueStatus,
} from "./issues";

describe("lib/api/issues", () => {
    it("getIssues: 프로젝트 이슈 경로로 필터를 보내고 Spring Page 를 그대로 돌려준다", async () => {
        const page = await getIssues("PRJ-1", {keyword: "로그인", priority: "HIGH", page: 0, size: 1});

        const req = lastRequest("GET");
        expect(req?.path).toBe("/v1/projects/PRJ-1/issues");
        expect(req?.query.get("keyword")).toBe("로그인");
        expect(req?.query.get("priority")).toBe("HIGH");
        expect(req?.query.get("size")).toBe("1");
        expect(page.content).toHaveLength(1);
        expect(page.content[0]).toEqual(issue1);
        expect(page.totalElements).toBe(2);
        expect(page.totalPages).toBe(2);
        expect(page.number).toBe(0);
    });

    it("getIssues: 값이 없는 필터는 보내지 않는다", async () => {
        await getIssues("PRJ-1", {keyword: "", status: []});
        expect([...lastRequest("GET")!.query.keys()]).toEqual([]);
    });

    // Spring 의 IssueFilterRequest(List<String> status) 는 반복 키 status=a&status=b 로 바인딩된다
    // (apiClient paramsSerializer: {indexes: null}). axios 기본 status[]=a 는 쓰지 않는다
    it("status 필터를 반복 키(status=a&status=b)로 보낸다", async () => {
        await getIssues("PRJ-1", {status: ["ST-TODO", "ST-PROG"]});
        expect(lastRequest("GET")!.query.getAll("status")).toEqual(["ST-TODO", "ST-PROG"]);
        expect(lastRequest("GET")!.query.has("status[]")).toBe(false);
    });

    it("getIssue / updateIssue / deleteIssue 경로", async () => {
        expect((await getIssue("ISS-1")).issueKey).toBe("CIRA-1");
        expect(lastRequest()?.path).toBe("/v1/issues/ISS-1");

        const updated = await updateIssue("ISS-1", {title: "새 제목"});
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/issues/ISS-1", body: {title: "새 제목"}});
        expect(updated.title).toBe("새 제목");

        await expect(deleteIssue("ISS-1")).resolves.toBeUndefined();
        expect(lastRequest()).toMatchObject({method: "DELETE", path: "/v1/issues/ISS-1"});
    });

    it("createIssue: 프로젝트 경로로 본문을 보낸다", async () => {
        const created = await createIssue("PRJ-1", {title: "새 이슈", priority: "LOW", statusId: "ST-TODO", issueTypeId: "TYPE-TASK"});
        expect(lastRequest()).toMatchObject({
            method: "POST",
            path: "/v1/projects/PRJ-1/issues",
            body: {title: "새 이슈", priority: "LOW", statusId: "ST-TODO", issueTypeId: "TYPE-TASK"},
        });
        expect(created.issueKey).toBe("CIRA-3");
    });

    // 백엔드 계약: statusId·issueTypeId 가 없으면 500 (UnexpectedRollbackException), content 는 varchar(255)
    it("createIssue: statusId·issueTypeId 없음 / content 255자 초과면 백엔드 500 을 그대로 던진다", async () => {
        await expect(createIssue("PRJ-1", {title: "필수값 없음"})).rejects.toMatchObject({response: {status: 500}});
        await expect(createIssue("PRJ-1", {
            title: "긴 설명", statusId: "ST-TODO", issueTypeId: "TYPE-TASK", content: "가".repeat(256),
        })).rejects.toMatchObject({response: {status: 500}});
    });

    it("updateIssueStatus: {statusId} 를 PUT 으로 보낸다", async () => {
        const res = await updateIssueStatus("ISS-1", "ST-PROG");
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/issues/ISS-1/status", body: {statusId: "ST-PROG"}});
        expect(res.statusId).toBe("ST-PROG");
    });

    it("getAvailableTransitions: 상태 목록을 그대로 돌려준다", async () => {
        const list = await getAvailableTransitions("ISS-1");
        expect(lastRequest()?.path).toBe("/v1/issues/ISS-1/available-transitions");
        expect(list).toEqual([{id: "ST-PROG", statusNm: "In Progress", category: "IN_PROGRESS", colorCd: "#3b82f6", sortOrd: 2}]);
    });
});
