import {ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {lastRequest} from "@/test/utils";
import {http, HttpResponse} from "msw";
import {describe, expect, it} from "vitest";
import {getNotifications, getUnreadCount, markAllRead, markRead} from "./notifications";

describe("lib/api/notifications", () => {
    it("getNotifications: 백엔드 목록을 NotificationItem 으로 바꾼다", async () => {
        const page = await getNotifications(0, 20);
        expect(lastRequest()?.path).toBe("/v1/notifications");
        expect(page.content).toEqual([
            {
                id: "NTF-2", type: "ISSUE_ASSIGNED", title: "CIRA-1 담당자로 지정됨", body: "로그인 버그",
                isRead: false, issueId: "ISS-1", issueKey: "CIRA-1", createdAt: "2026-10-31T08:59:00",
            },
            {
                id: "NTF-1", type: "SPRINT_STARTED", title: "Sprint 1 시작", body: "",
                isRead: true, issueId: undefined, issueKey: undefined, createdAt: "2026-10-30T09:00:00",
            },
        ]);
        expect(page).toMatchObject({totalElements: 2, totalPages: 1, number: 0, size: 20});
    });

    it("getNotifications: 목록을 page·size 로 자른다", async () => {
        const second = await getNotifications(1, 1);
        expect(second.content.map((n) => n.id)).toEqual(["NTF-1"]);
        expect(second).toMatchObject({totalElements: 2, totalPages: 2, number: 1, size: 1});
    });

    it("getNotifications: 빈 목록이어도 totalPages 는 1", async () => {
        server.use(http.get("*/api/proxy/v1/notifications", () => HttpResponse.json(ok([]))));
        expect(await getNotifications()).toMatchObject({content: [], totalElements: 0, totalPages: 1});
    });

    it("getNotifications: mock 라우터의 페이지 모양(web 모양)도 통과시킨다", async () => {
        const mockPage = {
            content: [{id: "n1", type: "MENTION", title: "t", body: "b", isRead: false, createdAt: "2026-10-31T00:00:00Z"}],
            totalElements: 1, totalPages: 1, number: 0, size: 10,
        };
        server.use(http.get("*/api/proxy/v1/notifications", () => HttpResponse.json(ok(mockPage))));
        expect(await getNotifications(0, 10)).toEqual(mockPage);
    });

    it("getUnreadCount: {count} 에서 숫자를 꺼낸다 (mock 의 숫자도 허용)", async () => {
        expect(await getUnreadCount()).toBe(1);
        expect(lastRequest()?.path).toBe("/v1/notifications/unread-count");
        server.use(http.get("*/api/proxy/v1/notifications/unread-count", () => HttpResponse.json(ok(7))));
        expect(await getUnreadCount()).toBe(7);
    });

    it("markRead / markAllRead 경로", async () => {
        await markRead("NTF-2");
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/notifications/NTF-2/read"});
        await markAllRead();
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/notifications/read-all"});
    });
});
