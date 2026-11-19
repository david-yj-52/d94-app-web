import {error} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {http, HttpResponse} from "msw";
import {describe, expect, it} from "vitest";
import apiClient from "./client";
import {settleReauth, useReauthStore} from "./session";

/** next-auth csrf·session update 흉내. alive = update 후 세션이 살아 있는가 */
function sessionEndpoints(alive: boolean, calls: { update: number; active: unknown[] }) {
    return [
        http.get("*/api/auth/csrf", () => HttpResponse.json({csrfToken: "c"})),
        http.post("*/api/auth/session", async ({request}) => {
            calls.update++;
            calls.active.push(((await request.json()) as { data: { active: unknown } }).data.active);
            return HttpResponse.json(alive ? {user: {email: "a@b.c"}} : null);
        }),
    ];
}

describe("lib/api/client", () => {
    it("/v1/auth/* 401 은 세션 갱신 없이 그대로 실패한다", async () => {
        const calls = {update: 0, active: [] as unknown[]};
        server.use(
            ...sessionEndpoints(true, calls),
            http.post("*/api/proxy/v1/auth/login", () => HttpResponse.json(error("UNAUTHORIZED", "x"), {status: 401})),
        );
        await expect(apiClient.post("/v1/auth/login", {})).rejects.toMatchObject({response: {status: 401}});
        expect(calls.update).toBe(0);
    });

    it("401 이면 세션 refresh 를 한 번만(동시 요청 합류) 보내고 원래 요청을 재시도한다", async () => {
        const calls = {update: 0, active: [] as unknown[]};
        let hits = 0;
        server.use(
            ...sessionEndpoints(true, calls),
            http.get("*/api/proxy/v1/projects", () =>
                ++hits <= 2 ? HttpResponse.json(error("UNAUTHORIZED", "x"), {status: 401}) : HttpResponse.json({success: true, data: []})),
        );
        const results = await Promise.all([apiClient.get("/v1/projects"), apiClient.get("/v1/projects")]);
        expect(results.map((r) => r.status)).toEqual([200, 200]);
        expect(calls.update).toBe(1);
        expect(calls.active).toEqual([false]); // 401 재시도는 사용자 활동이 아니다
    });

    it("refresh 로도 안 되면 재로그인 모달을 하나 띄우고, 로그인하면 기다리던 요청을 다시 보낸다", async () => {
        const calls = {update: 0, active: [] as unknown[]};
        let loggedIn = false;
        server.use(
            ...sessionEndpoints(false, calls),
            http.get("*/api/proxy/v1/projects", () =>
                loggedIn ? HttpResponse.json({success: true, data: []}) : HttpResponse.json(error("UNAUTHORIZED", "x"), {status: 401})),
        );
        const pending = Promise.all([apiClient.get("/v1/projects"), apiClient.get("/v1/projects")]);
        await expect.poll(() => useReauthStore.getState().open).toBe(true);

        loggedIn = true;
        settleReauth(true);
        expect((await pending).map((r) => r.status)).toEqual([200, 200]);
        expect(useReauthStore.getState().open).toBe(false);
    });

    it("재로그인 모달을 닫으면 요청은 401 로 실패하고 화면은 그대로다", async () => {
        const calls = {update: 0, active: [] as unknown[]};
        server.use(
            ...sessionEndpoints(false, calls),
            http.get("*/api/proxy/v1/projects", () => HttpResponse.json(error("UNAUTHORIZED", "x"), {status: 401})),
        );
        const pending = apiClient.get("/v1/projects");
        await expect.poll(() => useReauthStore.getState().open).toBe(true);
        settleReauth(false);
        await expect(pending).rejects.toMatchObject({response: {status: 401}});
    });
});
