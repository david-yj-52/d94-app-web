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
    issueId: string,
    commentId: string,
    data: UpdateCommentRequest,
): Promise<CommentResponse> {
    const res = await apiClient.put(
        `/v1/issues/${issueId}/comments/${commentId}`,
        data,
    );
    return res.data.data;
}

export async function deleteComment(
    issueId: string,
    commentId: string,
): Promise<void> {
    await apiClient.delete(`/v1/issues/${issueId}/comments/${commentId}`);
}

export async function addReaction(
    commentId: string,
    emoji: string,
): Promise<void> {
    await apiClient.post(`/v1/comments/${commentId}/reactions`, {emoji});
}

export async function removeReaction(
    commentId: string,
    emoji: string,
): Promise<void> {
    await apiClient.delete(`/v1/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`);
}
