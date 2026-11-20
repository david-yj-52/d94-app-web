import apiClient from "./client";
import type {UserSummary} from "@/types/issue";
import type {Me} from "@/types/settings";

export async function searchUsers(keyword: string): Promise<UserSummary[]> {
    const res = await apiClient.get("/v1/users/search", {params: {keyword}});
    return res.data.data ?? [];
}

export async function getMe(): Promise<Me> {
    const res = await apiClient.get("/v1/users/me");
    return res.data.data;
}
