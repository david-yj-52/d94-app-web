import type {UserSummary} from "./issue";

/** d94-query CommentReactionResponse. reactionType 에 이모지 문자가 들어 있다 */
export interface CommentReaction {
    reactionType: string;
    count: number;
    reacted: boolean;
}

export interface CommentResponse {
    id: string;
    issueId: string;
    parentId?: string | null;
    content: string;
    author: UserSummary;
    createdAt: string;
    modifiedAt: string;
    replies?: CommentResponse[];
    reactions?: CommentReaction[];
}

export interface CreateCommentRequest {
    content: string;
    parentId?: string;
}

export interface UpdateCommentRequest {
    content: string;
}
