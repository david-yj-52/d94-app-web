import {ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {lastRequest, renderWithClient} from "@/test/utils";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import NotificationBell from "./NotificationBell";

const push = vi.fn();
vi.mock("next/navigation", () => ({useRouter: () => ({push})}));

const COUNT = "*/api/proxy/v1/notifications/unread-count";

describe("NotificationBell", () => {
    it("백엔드 {count} 로 배지를 그린다", async () => {
        renderWithClient(<NotificationBell/>);
        const bell = screen.getByRole("button", {name: "알림"});
        await waitFor(() => expect(bell).toHaveTextContent("1"));
    });

    it("99 를 넘으면 99+, 0 이면 배지가 없다", async () => {
        server.use(http.get(COUNT, () => HttpResponse.json(ok({count: 150}))));
        const first = renderWithClient(<NotificationBell/>);
        await waitFor(() => expect(screen.getByRole("button", {name: "알림"})).toHaveTextContent("99+"));
        first.unmount();

        server.use(http.get(COUNT, () => HttpResponse.json(ok({count: 0}))));
        const {client} = renderWithClient(<NotificationBell/>);
        await waitFor(() => expect(client.getQueryData(["notifications-unread-count"])).toBe(0));
        expect(screen.getByRole("button", {name: "알림"})).toHaveTextContent("");
    });

    it("열 때만 목록을 조회하고, 백엔드 필드(message·read)를 화면에 보인다", async () => {
        const user = userEvent.setup();
        renderWithClient(<NotificationBell/>);
        await waitFor(() => expect(lastRequest("GET", "/v1/notifications/unread-count")).toBeDefined());
        expect(lastRequest("GET", "/v1/notifications")).toBeUndefined();

        await user.click(screen.getByRole("button", {name: "알림"}));
        expect(await screen.findByText("CIRA-1 담당자로 지정됨")).toBeInTheDocument();
        expect(screen.getByText("로그인 버그")).toBeInTheDocument(); // message → body
        expect(screen.getByText("Sprint 1 시작").closest("button")).toHaveClass("opacity-60"); // read → isRead
    });

    it("안 읽은 알림을 누르면 읽음 처리하고 issueKey 로 검색 화면에 간다", async () => {
        const user = userEvent.setup();
        renderWithClient(<NotificationBell/>);
        await user.click(screen.getByRole("button", {name: "알림"}));
        await user.click(await screen.findByText("CIRA-1 담당자로 지정됨"));

        await waitFor(() => expect(lastRequest("PUT")).toMatchObject({path: "/v1/notifications/NTF-2/read"}));
        expect(push).toHaveBeenCalledWith("/cira/search?q=CIRA-1");
        expect(screen.queryByText("CIRA-1 담당자로 지정됨")).not.toBeInTheDocument();
    });

    it("읽은 알림·리소스 없는 알림은 읽음 요청도 이동도 하지 않는다", async () => {
        push.mockClear();
        const user = userEvent.setup();
        renderWithClient(<NotificationBell/>);
        await user.click(screen.getByRole("button", {name: "알림"}));
        await user.click(await screen.findByText("Sprint 1 시작"));
        expect(lastRequest("PUT")).toBeUndefined();
        expect(push).not.toHaveBeenCalled();
    });

    it("모두 읽음 → read-all 후 목록·개수를 무효화한다", async () => {
        const user = userEvent.setup();
        const {client} = renderWithClient(<NotificationBell/>);
        const spy = vi.spyOn(client, "invalidateQueries");
        await user.click(screen.getByRole("button", {name: "알림"}));
        await user.click(await screen.findByRole("button", {name: "모두 읽음"}));
        await waitFor(() => expect(lastRequest("PUT")).toMatchObject({path: "/v1/notifications/read-all"}));
        await waitFor(() => expect(spy.mock.calls.map((c) => c[0]?.queryKey))
            .toEqual([["notifications"], ["notifications-unread-count"]]));
    });

    it("바깥을 누르면 닫힌다", async () => {
        const user = userEvent.setup();
        renderWithClient(<><NotificationBell/><p>바깥</p></>);
        await user.click(screen.getByRole("button", {name: "알림"}));
        expect(await screen.findByText("전체 알림 보기")).toBeInTheDocument();
        await user.click(screen.getByText("바깥"));
        expect(screen.queryByText("전체 알림 보기")).not.toBeInTheDocument();
    });
});
