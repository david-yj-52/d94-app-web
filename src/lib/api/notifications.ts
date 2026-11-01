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

/** d94-query `NotificationResponse` (필드 이름이 web 과 다르다) */
interface BackendNotification {
    id: string;
    type: string;
    title: string;
    message?: string;
    resourceType?: string;
    resourceId?: string;
    issueKey?: string;
    read: boolean;
    createdAt: string;
}

/** 백엔드 응답과 mock(web 모양) 응답을 모두 NotificationItem 으로 맞춘다 */
function toNotificationItem(n: BackendNotification | NotificationItem): NotificationItem {
    if ("isRead" in n) return n;
    return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.message ?? "",
        isRead: n.read,
        issueId: n.resourceType === "ISSUE" ? n.resourceId : undefined,
        issueKey: n.issueKey ?? undefined,
        createdAt: n.createdAt,
    };
}

export async function getNotifications(
    page = 0,
    size = 20,
): Promise<NotificationPage> {
    const res = await apiClient.get("/v1/notifications", {
        params: {page, size},
    });
    const data = res.data.data;
    // mock 은 페이지 객체를 주고, d94-query 는 페이지 없이 목록 전체를 준다 → 목록이면 여기서 자른다
    if (!Array.isArray(data)) {
        return {...data, content: (data?.content ?? []).map(toNotificationItem)};
    }
    const items = (data as BackendNotification[]).map(toNotificationItem);
    return {
        content: items.slice(page * size, page * size + size),
        totalElements: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / size)),
        number: page,
        size,
    };
}

export async function markRead(id: string): Promise<void> {
    await apiClient.put(`/v1/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
    await apiClient.put("/v1/notifications/read-all");
}

export async function getUnreadCount(): Promise<number> {
    const res = await apiClient.get("/v1/notifications/unread-count");
    const data = res.data.data;
    // d94-query 는 {count: N}, mock 은 숫자를 준다
    return typeof data === "number" ? data : (data?.count ?? 0);
}
