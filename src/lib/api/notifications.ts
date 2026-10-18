import apiClient from "./client";

export interface NotificationItem {
    id: string;
    type:
        | "ISSUE_ASSIGNED"
        | "ISSUE_COMMENTED"
        | "ISSUE_STATUS_CHANGED"
        | "MENTION"
        | string;
    title: string;
    body: string;
    isRead: boolean;
    issueId?: string;
    issueKey?: string;
    createdAt: string;
}

export interface NotificationPage {
    content: NotificationItem[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export async function getNotifications(
    page = 0,
    size = 20,
): Promise<NotificationPage> {
    const res = await apiClient.get("/v1/notifications", {
        params: {page, size},
    });
    return res.data.data;
}

export async function markRead(id: string): Promise<void> {
    await apiClient.put(`/v1/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
    await apiClient.put("/v1/notifications/read-all");
}

export async function getUnreadCount(): Promise<number> {
    const res = await apiClient.get("/v1/notifications/unread-count");
    return res.data.data ?? 0;
}
