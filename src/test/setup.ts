import "@testing-library/jest-dom/vitest";
import {cleanup} from "@testing-library/react";
import {afterAll, afterEach, beforeAll, vi} from "vitest";
import {authState} from "./auth";
import {resetRecorded, server} from "./msw/server";

// next-auth 는 브라우저 세션이 필요하다 → 상태만 흉내 낸다 (authState 로 바꿈)
vi.mock("next-auth/react", () => ({
    signOut: vi.fn(async () => undefined),
    useSession: () => ({status: authState.status, data: null}),
}));

beforeAll(() => server.listen({onUnhandledRequest: "error"}));
afterEach(() => {
    cleanup();
    server.resetHandlers();
    resetRecorded();
    authState.status = "authenticated";
});
afterAll(() => server.close());
