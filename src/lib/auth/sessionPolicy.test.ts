import {describe, expect, it} from "vitest";
import {IDLE_TIMEOUT_MS, isSessionExpired, MAX_SESSION_MS, needsRefresh, REFRESH_BEFORE_MS} from "./sessionPolicy";

const NOW = 1_800_000_000_000;

describe("lib/auth/sessionPolicy", () => {
    it("유휴 제한·절대 수명을 넘기면 만료", () => {
        const base = {loginAt: NOW - 1000, lastActiveAt: NOW - 1000, refreshToken: "r"};
        expect(isSessionExpired(base, NOW)).toBe(false);
        expect(isSessionExpired({...base, lastActiveAt: NOW - IDLE_TIMEOUT_MS}, NOW)).toBe(true);
        expect(isSessionExpired({...base, loginAt: NOW - MAX_SESSION_MS}, NOW)).toBe(true);
    });

    it("accessToken 이 만료돼도 refreshToken 이 있으면 살아 있고, 없으면 만료 (mock 은 exp 없음)", () => {
        const expired = {accessTokenExpiresAt: NOW - 1};
        expect(isSessionExpired({...expired, refreshToken: "r"}, NOW)).toBe(false);
        expect(isSessionExpired(expired, NOW)).toBe(true);
        expect(isSessionExpired({accessToken: "dev-admin-token"}, NOW)).toBe(false);
    });

    it("만료 REFRESH_BEFORE_MS 전부터, refreshToken 이 있을 때만 refresh", () => {
        const exp = NOW + REFRESH_BEFORE_MS;
        expect(needsRefresh({refreshToken: "r", accessTokenExpiresAt: exp + 1}, NOW)).toBe(false);
        expect(needsRefresh({refreshToken: "r", accessTokenExpiresAt: exp}, NOW)).toBe(true);
        expect(needsRefresh({accessTokenExpiresAt: exp}, NOW)).toBe(false);
    });
});
