import {spaceHref} from "@/hooks/useSpaces";
import type {Space} from "@/types/space";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach, describe, expect, it, vi} from "vitest";
import CiraSidebar from "./CiraSidebar";

const nav = vi.hoisted(() => ({pathname: "/cira/projects/p1/boards", search: "space=def"}));
vi.mock("next/navigation", () => ({
    usePathname: () => nav.pathname,
    useSearchParams: () => new URLSearchParams(nav.search),
    useRouter: () => ({push: vi.fn()}),
}));
vi.mock("next/link", () => ({
    default: ({href, children, onClick, ...rest}: {href: string; children: React.ReactNode; onClick?: () => void}) =>
        <a href={href} onClick={(e) => { e.preventDefault(); onClick?.(); }} {...rest}>{children}</a>,
}));
vi.mock("next-auth/react", () => ({useSession: () => ({data: {user: {email: "a@x.test"}}})}));
vi.mock("@/hooks/useProjects", () => ({useProject: () => ({data: {id: "p1", key: "CI", name: "CIRA"}})}));
vi.mock("@/hooks/useProjectSettings", () => ({useProjectMembers: () => ({data: [{email: "a@x.test", role: "ADMIN"}]})}));
vi.mock("@/components/project/CreateSpaceModal", () => ({default: () => null}));

const sp = (id: string, name: string, isDefault = false): Space =>
    ({id, projectId: "p1", name, key: id, description: null, presetTypeId: null, adminUserId: "u", adminNm: null, isDefault, sortOrd: 0, canManage: true});
const spaces = [sp("def", "General", true), sp("hw", "HW팀")];
vi.mock("@/hooks/useSpaces", async (orig) => {
    const actual = await orig<typeof import("@/hooks/useSpaces")>();
    return {
        ...actual,
        useCurrentSpace: () => {
            const requested = new URLSearchParams(nav.search).get("space");
            const space = spaces.find((s) => s.id === requested) ?? spaces[0];
            return {space, spaces, spaceId: space.id, isAll: !requested, setSpace: vi.fn(),
                withSpace: (href: string, id: string | undefined = space.id) => actual.spaceHref(href, id)};
        },
    };
});

describe("CiraSidebar 팀 트리", () => {
    beforeEach(() => {
        nav.pathname = "/cira/projects/p1/boards";
        nav.search = "space=def";
    });

    it("설정 화면 안에서도 다른 팀의 같은 설정 화면으로 갈 수 있다", () => {
        nav.pathname = "/cira/projects/p1/settings/workflow";
        render(<CiraSidebar/>);
        const hw = screen.getByRole("link", {name: "HW팀"});
        expect(hw.getAttribute("href")).toBe(spaceHref("/cira/projects/p1/settings/workflow", "hw"));
    });

    it("팀 링크를 누르면 onNavigate (모바일 서랍 닫기 — 쿼리만 바뀌어도)", async () => {
        const onNavigate = vi.fn();
        render(<CiraSidebar onNavigate={onNavigate}/>);
        await userEvent.click(screen.getByRole("button", {name: "HW팀"}));
        const links = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/cira/projects/p1/issues?space=hw");
        await userEvent.click(links[0]);
        expect(onNavigate).toHaveBeenCalled();
    });
});
