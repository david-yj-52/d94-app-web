import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {render, renderHook} from "@testing-library/react";
import type {ReactElement, ReactNode} from "react";
import {recorded, type RecordedRequest} from "./msw/handlers";

/** 재시도·캐시 없는 테스트용 QueryClient */
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {retry: false, gcTime: Infinity},
            mutations: {retry: false},
        },
    });
}

function wrapperFor(client: QueryClient) {
    return function Wrapper({children}: {children: ReactNode}) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
}

export function renderWithClient(ui: ReactElement, client = createTestQueryClient()) {
    return {client, ...render(ui, {wrapper: wrapperFor(client)})};
}

export function renderHookWithClient<T>(hook: () => T, client = createTestQueryClient()) {
    return {client, ...renderHook(hook, {wrapper: wrapperFor(client)})};
}

/** MSW 가 받은 마지막 요청 (메서드·경로로 거를 수 있음) */
export function lastRequest(method?: string, path?: string): RecordedRequest | undefined {
    return [...recorded].reverse().find((r) => (!method || r.method === method) && (!path || r.path === path));
}
