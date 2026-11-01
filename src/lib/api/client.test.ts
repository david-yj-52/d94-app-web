import {error} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {http, HttpResponse} from "msw";
import {signOut} from "next-auth/react";
import {describe, expect, it, vi} from "vitest";
import apiClient, {SESSION_EXPIRED_REASON} from "./client";

describe("lib/api/client", () => {
    it("baseURL 은 /api/proxy, 401 이면 signOut 을 한 번만 부르고 /v1/auth/* 401 은 제외한다", async () => {
        server.use(
            http.get("*/api/proxy/v1/projects", () => HttpResponse.json(error("UNAUTHORIZED", "x"), {status: 401})),
            http.post("*/api/proxy/v1/auth/login", () => HttpResponse.json(error("UNAUTHORIZED", "x"), {status: 401})),
        );
        const spy = vi.mocked(signOut);
        spy.mockClear();

        await expect(apiClient.post("/v1/auth/login", {})).rejects.toMatchObject({response: {status: 401}});
        expect(spy).not.toHaveBeenCalled();

        await Promise.allSettled([apiClient.get("/v1/projects"), apiClient.get("/v1/projects")]);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({callbackUrl: `/login?reason=${SESSION_EXPIRED_REASON}`});
    });
});
