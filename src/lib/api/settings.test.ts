import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {getSettings, updateSettings} from "./settings";
import {getMe} from "./users";

describe("lib/api/settings", () => {
    it("getSettings: GET /v1/settings, 저장된 값이 없으면 빈 맵", async () => {
        expect(await getSettings()).toEqual({});
        expect(lastRequest()?.path).toBe("/v1/settings");
    });

    it("updateSettings: PUT /v1/settings 로 바뀐 값만 보낸다", async () => {
        const saved = await updateSettings({"general.logo.text": "ACME"});
        expect(lastRequest()).toMatchObject({
            method: "PUT", path: "/v1/settings", body: {"general.logo.text": "ACME"},
        });
        expect(saved["general.logo.text"]).toBe("ACME");
    });

    it("getMe: roles 를 그대로 돌려준다", async () => {
        const me = await getMe();
        expect(lastRequest()?.path).toBe("/v1/users/me");
        expect(me.roles).toEqual(["USER", "ADMIN"]);
    });
});
