import apiClient from "./client";
import type {
    BoardColumnResponse,
    BoardDetailResponse,
    BoardResponse,
    CreateBoardColumnRequest,
    CreateBoardRequest,
    MoveIssueRequest,
    UpdateBoardColumnRequest,
    UpdateBoardRequest,
} from "@/types/board";

/** spaceId 없음 = 기본 작업 공간 */
export async function getBoards(projectId: string, spaceId?: string | null): Promise<BoardResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/boards`, {params: spaceId ? {spaceId} : {}});
    return res.data.data;
}

export async function createBoard(
    projectId: string,
    data: CreateBoardRequest,
): Promise<BoardResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/boards`, data);
    return res.data.data;
}

export async function getBoardDetail(
    boardId: string,
): Promise<BoardDetailResponse> {
    const res = await apiClient.get(`/v1/boards/${boardId}`);
    return res.data.data;
}

export async function updateBoard(
    boardId: string,
    data: UpdateBoardRequest,
): Promise<BoardResponse> {
    const res = await apiClient.put(`/v1/boards/${boardId}`, data);
    return res.data.data;
}

export async function deleteBoard(boardId: string): Promise<void> {
    await apiClient.delete(`/v1/boards/${boardId}`);
}

export async function addColumn(
    boardId: string,
    data: CreateBoardColumnRequest,
): Promise<BoardColumnResponse> {
    const res = await apiClient.post(`/v1/boards/${boardId}/columns`, data);
    return res.data.data;
}

export async function updateColumn(
    boardId: string,
    columnId: string,
    data: UpdateBoardColumnRequest,
): Promise<BoardColumnResponse> {
    const res = await apiClient.put(
        `/v1/boards/${boardId}/columns/${columnId}`,
        data,
    );
    return res.data.data;
}

export async function deleteColumn(
    boardId: string,
    columnId: string,
): Promise<void> {
    await apiClient.delete(`/v1/boards/${boardId}/columns/${columnId}`);
}

export async function moveIssue(
    boardId: string,
    issueId: string,
    data: MoveIssueRequest,
): Promise<BoardDetailResponse> {
    const res = await apiClient.put(
        `/v1/boards/${boardId}/issues/${issueId}/move`,
        data,
    );
    return res.data.data;
}
