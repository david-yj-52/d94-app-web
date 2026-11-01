import {authState} from "@/test/auth";
import {notifications, ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {renderHookWithClient} from "@/test/utils";
import {render, screen, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import {useNotifications} from "./useNotifications";

const NOTIF = "*/api/proxy/v1/notifications";

describe("useNotifications", () => {
    it("로그인 상태가 아니면 조회하지 않는다", () => {
        authState.status = "unauthenticated";
        const {client} = renderHookWithClient(() => useNotifications());
        expect(client.getQueryState(["notifications", "recent"])?.fetchStatus).toBe("idle");
    });

    it("첫 결과는 기준선 — 토스트 없이 [\"notifications\", \"recent\"] 에 캐시한다", async () => {
        const {client, result} = renderHookWithClient(() => useNotifications());
        await waitFor(() => expect(client.getQueryData(["notifications", "recent"])).toBeDefined());
        render(<>{result.current.ToastComponent}</>);
        expect(screen.queryByText("CIRA-1 담당자로 지정됨")).not.toBeInTheDocument();
    });

    it("다음 조회에서 처음 보는 안 읽은 알림만 토스트로 띄우고 unread-count 를 무효화한다", async () => {
        const {client, result, rerender} = renderHookWithClient(() => useNotifications());
        await waitFor(() => expect(client.getQueryData(["notifications", "recent"])).toBeDefined());
        const spy = vi.spyOn(client, "invalidateQueries");

        const fresh = {...notifications()[0], id: "NTF-3", title: "새 댓글"};
        const readOne = {...notifications()[0], id: "NTF-4", title: "읽은 알림", read: true};
        server.use(http.get(NOTIF, () => HttpResponse.json(ok([fresh, readOne, ...notifications()]))));
        await client.refetchQueries({queryKey: ["notifications", "recent"]});
        rerender();

        await waitFor(() => expect(spy).toHaveBeenCalledWith({queryKey: ["notifications-unread-count"]}));
        const {container} = render(<>{result.current.ToastComponent}</>);
        expect(container).toHaveTextContent("새 댓글");
        expect(container).not.toHaveTextContent("읽은 알림");
    });

    it("새 안 읽은 알림이 여러 건이면 건수로 보여 준다", async () => {
        const {client, result, rerender} = renderHookWithClient(() => useNotifications());
        await waitFor(() => expect(client.getQueryData(["notifications", "recent"])).toBeDefined());
        const base = notifications()[0];
        server.use(http.get(NOTIF, () => HttpResponse.json(ok([{...base, id: "X1"}, {...base, id: "X2"}]))));
        await client.refetchQueries({queryKey: ["notifications", "recent"]});
        rerender();
        await waitFor(() => {
            const {container} = render(<>{result.current.ToastComponent}</>);
            expect(container).toHaveTextContent("새 알림 2건");
        });
    });
});
