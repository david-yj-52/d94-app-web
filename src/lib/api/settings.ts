import apiClient from "./client";
import type {SettingMap} from "@/types/settings";

export async function getSettings(): Promise<SettingMap> {
    const res = await apiClient.get("/v1/settings");
    return res.data.data ?? {};
}

/** 바뀐 키만 보낸다. 응답은 저장 후 전체 설정 (ADMIN 아니면 403) */
export async function updateSettings(changes: SettingMap): Promise<SettingMap> {
    const res = await apiClient.put("/v1/settings", changes);
    return res.data.data ?? {};
}
