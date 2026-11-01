import apiClient from "./client";
import type {CommentResponse, CreateCommentRequest, UpdateCommentRequest,} from "@/types/comment";

export async function getComments(issueId: string): Promise<CommentResponse[]> {
    const res = await apiClient.get(`/v1/issues/${issueId}/comments`);
    return res.data.data;
}

export async function createComment(
    issueId: string,
    data: CreateCommentRequest,
): Promise<CommentResponse> {
    const res = await apiClient.post(`/v1/issues/${issueId}/comments`, data);
    return res.data.data;
}

export async function updateComment(
    commentId: string,
    data: UpdateCommentRequest,
): Promise<CommentResponse> {
    const res = await apiClient.put(`/v1/comments/${commentId}`, data);
    return res.data.data;
}

export async function deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/v1/comments/${commentId}`);
}

/** 반응 토글: 이미 눌렀으면 취소, 아니면 추가. 바뀐 댓글을 돌려준다 */
export async function toggleReaction(
    commentId: string,
    reactionType: string,
): Promise<CommentResponse> {
    const res = await apiClient.post(`/v1/comments/${commentId}/reactions`, {reactionType});
    return res.data.data;
}
