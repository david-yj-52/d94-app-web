import {issue1, ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {lastRequest, renderWithClient} from "@/test/utils";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import CreateIssueModal from "./CreateIssueModal";

/** 멤버·워크플로우 상태 조회가 끝날 때까지 기다린 뒤 반환한다 */
async function setup() {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    const utils = renderWithClient(<CreateIssueModal projectId="PRJ-1" onClose={onClose} onSuccess={onSuccess}/>);
    // 전체 실행 때 첫 렌더가 1초(기본 대기)를 넘을 수 있다
    await screen.findByRole("option", {name: "김개발"}, {timeout: 5000});
    await waitFor(() => expect(utils.client.getQueryData(["projects", "PRJ-1", "workflow", "statuses"])).toBeDefined(),
        {timeout: 5000});
    return {...utils, user, onClose, onSuccess};
}

const titleInput = () => screen.getByPlaceholderText("이슈 제목을 입력하세요");
const submit = () => screen.getByRole("button", {name: "이슈 생성"});

describe("CreateIssueModal", () => {
    it("제목이 없으면 검증 메시지를 보이고 요청하지 않는다", async () => {
        const {user} = await setup();
        await user.click(submit());
        expect(await screen.findByText("제목을 입력해주세요.")).toBeInTheDocument();
        expect(lastRequest("POST")).toBeUndefined();
    });

    it("제목만 입력해도(우선순위·포인트 비움) 요청을 보내고, statusId 는 워크플로우 첫 상태다", async () => {
        const {user} = await setup();
        await user.type(titleInput(), "제목만");
        await user.click(submit());
        await waitFor(() => expect(lastRequest("POST")).toBeDefined());
        // 빈 우선순위("")·포인트(NaN)·담당자는 보내지 않는다. ST-TODO = sortOrd 최솟값
        expect(lastRequest("POST")).toMatchObject({path: "/v1/projects/PRJ-1/issues", body: {title: "제목만", statusId: "ST-TODO"}});
        expect(Object.keys(lastRequest("POST")!.body as object).sort()).toEqual(["statusId", "title"]);
    });

    it("담당자는 프로젝트 멤버에서 고르고 사용자 objId(userId)를 assigneeId 로 보낸다", async () => {
        const {user} = await setup();
        expect(screen.getByRole("option", {name: "이기획"})).toBeInTheDocument(); // userNm 으로 표시
        await user.type(titleInput(), "새 이슈");
        await user.selectOptions(screen.getByLabelText("우선순위"), "HIGH");
        await user.type(screen.getByPlaceholderText("0"), "5");
        await user.selectOptions(screen.getByLabelText("담당자"), "USR-0001");
        await user.click(submit());
        await waitFor(() => expect(lastRequest("POST")).toMatchObject({
            body: {title: "새 이슈", priority: "HIGH", storyPnt: 5, statusId: "ST-TODO", assigneeId: "USR-0001"},
        }));
    });

    it("서버가 성공을 주면 onSuccess·onClose 를 부른다", async () => {
        server.use(http.post("*/api/proxy/v1/projects/:projectId/issues", () => HttpResponse.json(ok(issue1))));
        const {user, onClose, onSuccess} = await setup();
        await user.type(titleInput(), "새 이슈");
        await user.click(submit());
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(onSuccess).toHaveBeenCalled();
    });

    it("서버가 실패하면 오류 문구를 보이고 닫지 않는다", async () => {
        const {user, onClose} = await setup();
        await user.type(titleInput(), "실패할 이슈"); // issueTypeId 가 없어 백엔드 모양 핸들러는 500
        await user.click(submit());
        expect(await screen.findByText("이슈 생성에 실패했습니다.")).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });

    // 남은 결함: d94-query 는 issueTypeId 가 없으면 500 (findByIdOptional(null) → UnexpectedRollbackException).
    // 웹이 고를 이슈 유형 목록 API 가 d94-query 에 없고 전역 유형 테이블도 비어 있어 웹만으로는 고칠 수 없다.
    // 백엔드가 유형 목록 API(또는 기본 유형)를 주면 폼에 유형 선택을 넣고 이 테스트를 it 으로 바꾼다
    it.fails("[결함·백엔드 대기] 생성 요청에 issueTypeId 를 담는다", async () => {
        const {user} = await setup();
        await user.type(titleInput(), "유형");
        await user.click(submit());
        await waitFor(() => expect(lastRequest("POST")).toBeDefined());
        expect(lastRequest("POST")!.body).toMatchObject({issueTypeId: expect.any(String)});
    });

    it("바깥(오버레이)·취소를 누르면 onClose", async () => {
        const {user, onClose, container} = await setup();
        await user.click(screen.getByRole("button", {name: "취소"}));
        await user.click(container.querySelector(".backdrop-blur-sm")!);
        expect(onClose).toHaveBeenCalledTimes(2);
    });
});
