export interface BoardResponse {
    id: string;
    projectId: string;
    boardNm: string;
    boardType: string;
    columnCount: number;
    createdAt: string;
    modifiedAt: string;
}

export interface BoardIssueResponse {
    id: string;
    issueKey: string;
    title: string;
    priority?: string;
    issueTypeId?: string;
    issueTypeNm?: string;
    statusId?: string;
    statusNm?: string;
    assignee?: {
        email: string;
        name: string;
        avatarUrl?: string;
    };
    rankStr?: string;
}

export interface BoardColumnResponse {
    id: string;
    boardId: string;
    statusId?: string;
    statusNm?: string;
    statusCategory?: string;
    colorCd?: string;
    columnNm: string;
    wipLimit?: number;
    sortOrd: number;
    issues: BoardIssueResponse[];
}

export interface BoardDetailResponse {
    id: string;
    projectId: string;
    boardNm: string;
    boardType: string;
    columns: BoardColumnResponse[];
    createdAt: string;
    modifiedAt: string;
}

export interface CreateBoardRequest {
    boardNm: string;
    boardType?: string;
}

export interface UpdateBoardRequest {
    boardNm?: string;
}

export interface CreateBoardColumnRequest {
    columnNm: string;
    statusId: string;
    wipLimit?: number;
}

export interface UpdateBoardColumnRequest {
    columnNm?: string;
    wipLimit?: number;
}

export interface MoveIssueRequest {
    targetColumnId: string;
    afterIssueId?: string;
    beforeIssueId?: string;
}
