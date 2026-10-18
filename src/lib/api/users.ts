import apiClient from "./client";
import type {UserSummary} from "@/types/issue";

export async function searchUsers(keyword: string): Promise<UserSummary[]> {
    const res = await apiClient.get("/v1/users/search", {params: {keyword}});
    return res.data.data ?? [];
}
