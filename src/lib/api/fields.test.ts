import {server} from "@/test/msw/server";
import {http, HttpResponse} from "msw";
import {projectFields} from "@/test/msw/fixtures";
import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {createTypeField, getFieldCatalog, getFieldLibrary, importToProject, importToType} from "./fields";

describe("lib/api/fields — 라이브러리", () => {
    it("importToProject: 원본 id 를 본문으로 보내고 복사본 Field 를 돌려준다", async () => {
        const copy = await importToProject("PRJ-1", "CF-G");
        expect(lastRequest("POST")).toMatchObject({
            path: "/v1/projects/PRJ-1/custom-fields/import", body: {sourceFieldId: "CF-G"},
        });
        expect(copy.scope).toBe("project");
        expect(copy.sourceFieldId).toBe("CF-G");
    });

    it("getFieldLibrary: 항목과 이미 가져온 복사본 키를 그대로", async () => {
        const items = await getFieldLibrary("PRJ-1");
        expect(lastRequest("GET")?.path).toBe("/v1/projects/PRJ-1/field-library");
        expect(items[0]).toMatchObject({field: {fieldKey: "cf:CF-G", scope: "global"}, importedAs: null});
    });

    it("createTypeField / importToType: 타입 경로", async () => {
        await createTypeField("PT-KANBAN", {fieldNm: "단계", fieldType: "TEXT"});
        expect(lastRequest("POST")?.path).toBe("/v1/cira/project-types/PT-KANBAN/custom-fields");
        await importToType("PT-KANBAN", "CF-G");
        expect(lastRequest("POST")).toMatchObject({
            path: "/v1/cira/project-types/PT-KANBAN/custom-fields/import", body: {sourceFieldId: "CF-G"},
        });
        expect(projectFields.length).toBeGreaterThan(0);
    });
});

describe("lib/api/fields — 이전 백엔드 응답", () => {
    it("getFieldCatalog: typeFields·copies 가 없으면 빈 객체로 채운다", async () => {
        server.use(http.get("*/api/proxy/v1/cira/field-catalog",
            () => HttpResponse.json({success: true, data: {system: [], custom: []}})));
        const c = await getFieldCatalog();
        expect(c.typeFields).toEqual({});
        expect(c.copies).toEqual({});
    });
});
