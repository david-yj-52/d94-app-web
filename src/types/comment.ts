import type {UserSummary} from "./issue";

export interface CommentReaction {
    emoji: string;
    count: number;
    reacted: boolean;
}

export interface CommentResponse {
    id: string;
    issueId: string;
    content: string;
    author: UserSummary;
    createdAt: string;
    modifiedAt: string;
    replies?: CommentResponse[];
    reactions?: CommentReaction[];
}

export interface CreateCommentRequest {
    content: string;
    parentCommentId?: string;
}

export interface UpdateCommentRequest {
    content: string;
}
