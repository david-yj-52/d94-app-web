// CIRA 프로젝트 타입·필드·컬럼 mock — router.ts 가 registerFieldsMock(on) 으로 등록한다. dev 서버 재시작 시 초기화.
// ponytail: 검증은 백엔드(CiraFieldService) 몫. 여기는 화면 확인용으로 계산 규칙(고정 → 타입 → 추가, 기본 표시)만 흉내낸다
import type {MockResult} from "./router";
import type {FieldDef, ProjectTypeResponse, TypeField} from "@/types/fields";

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: Record<string, unknown> };
type On = (method: string, pattern: string, h: (ctx: Ctx) => MockResult | Promise<MockResult>) => void;

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const fail = (status: number, message: string): MockResult => ({status, body: {success: false, code: "BAD_REQUEST", message}});

const sys = (fieldKey: string, name: string, fieldType: FieldDef["fieldType"]): FieldDef =>
    ({fieldKey, name, kind: "sys", fieldType, required: false, sortable: true, defaultVisible: true});
const SYSTEM: FieldDef[] = [
    sys("sys:type", "유형", "SELECT"), sys("sys:key", "키", "TEXT"), sys("sys:summary", "요약", "TEXT"),
    sys("sys:status", "상태", "SELECT"), sys("sys:priority", "우선순위", "SELECT"), sys("sys:assignee", "담당자", "USER"),
    sys("sys:reporter", "보고자", "USER"), sys("sys:storyPoints", "스토리 포인트", "NUMBER"), sys("sys:sprint", "스프린트", "SELECT"),
    sys("sys:dueDate", "마감일", "DATE"), sys("sys:startedAt", "시작일", "DATETIME"), sys("sys:resolvedAt", "해결일", "DATETIME"),
    sys("sys:createdAt", "생성일", "DATETIME"), sys("sys:modifiedAt", "수정일", "DATETIME"),
];
const FIXED = ["sys:type", "sys:key", "sys:summary", "sys:status"];
const BASE: TypeField[] = [
    {fieldKey: "sys:priority", defaultVisible: true}, {fieldKey: "sys:assignee", defaultVisible: true},
    {fieldKey: "sys:modifiedAt", defaultVisible: true},
];

const types: ProjectTypeResponse[] = [
    {id: "PT-SCRUM", typeNm: "SCRUM", sortOrd: 1, spaceCount: 0, fields: [...BASE,
            {fieldKey: "sys:sprint", defaultVisible: false}, {fieldKey: "sys:storyPoints", defaultVisible: false}]},
    {id: "PT-KANBAN", typeNm: "KANBAN", sortOrd: 2, spaceCount: 0, fields: [...BASE]},
];
const customFields: FieldDef[] = [];
/** 타입 필드의 소속 타입 (FieldDef 에는 타입 id 칸이 없다) */
const typeOfField: Record<string, string> = {};
const projectFieldKeys: Record<string, string[]> = {};
const prefs: Record<string, string[]> = {};
let seq = 0;

/** 프로젝트 → 타입 id (router 의 프로젝트 store 와 이어 줌) */
export function mockTypeOf(typeIdOrName?: unknown): ProjectTypeResponse {
    return types.find((t) => t.id === typeIdOrName || t.typeNm === typeIdOrName) ?? types[0];
}

function effective(projectId: string, typeId?: string | null): FieldDef[] {
    const visible = customFields.filter((f) => !f.projectId || f.projectId === projectId);
    const resolve = (k: string) => SYSTEM.find((f) => f.fieldKey === k) ?? visible.find((f) => f.fieldKey === k);
    const out = new Map<string, FieldDef>();
    FIXED.forEach((k) => out.set(k, {...resolve(k)!, source: "fixed", defaultVisible: true}));
    mockTypeOf(typeId).fields.forEach((tf) => {
        const f = resolve(tf.fieldKey);
        if (f && !out.has(f.fieldKey)) out.set(f.fieldKey, {...f, source: "type", defaultVisible: tf.defaultVisible});
    });
    (projectFieldKeys[projectId] ?? []).forEach((k) => {
        const f = resolve(k);
        if (f && !out.has(k)) out.set(k, {...f, source: "project", defaultVisible: true});
    });
    return [...out.values()];
}

const isGlobal = (f: FieldDef) => !f.projectId && !typeOfField[f.fieldKey];

function saveField(body: Record<string, unknown>, projectId: string | null, existing?: FieldDef, typeId?: string): FieldDef {
    const f: FieldDef = {
        fieldKey: existing?.fieldKey ?? `cf:mock-${++seq}`,
        name: String(body.fieldNm ?? "").trim(),
        kind: "cf",
        fieldType: existing?.fieldType ?? (body.fieldType as FieldDef["fieldType"]),
        options: (body.options as string[] | undefined) ?? null,
        required: body.required === true,
        sortable: false,
        defaultVisible: true,
        projectId,
        scope: projectId ? "project" : typeId ? "type" : "global",
        sourceFieldId: existing?.sourceFieldId ?? null,
        sourceName: existing?.sourceName ?? null,
        createdBy: existing?.createdBy ?? "mock-user",
        canEdit: !!projectId,
    };
    if (typeId) typeOfField[f.fieldKey] = typeId;
    if (existing) Object.assign(existing, f);
    else customFields.push(f);
    return existing ?? f;
}

/** 가져오기 = 원본 복사 (설계 F3) */
function copyField(src: FieldDef, projectId: string | null, typeId?: string): FieldDef {
    const copy = saveField({fieldNm: src.name, fieldType: src.fieldType, options: src.options, required: src.required},
        projectId, undefined, typeId);
    copy.sourceFieldId = src.fieldKey.slice(3);
    copy.sourceName = src.name;
    return copy;
}

const removeField = (id: string) => {
    const key = `cf:${id}`;
    const i = customFields.findIndex((f) => f.fieldKey === key);
    if (i >= 0) customFields.splice(i, 1);
    types.forEach((t) => (t.fields = t.fields.filter((f) => f.fieldKey !== key)));
    Object.keys(projectFieldKeys).forEach((p) => (projectFieldKeys[p] = projectFieldKeys[p].filter((k) => k !== key)));
};

/** presetOf = 그 프로젝트 기본 공간의 프리셋 (ponytail: mock 은 공간별 필드를 흉내 내지 않고 기본 공간 프리셋으로 계산) */
export function registerFieldsMock(on: On, presetOf: (projectId: string) => string | null | undefined) {
    on("GET", "/v1/cira/field-catalog", () => ok({
        system: SYSTEM,
        custom: customFields.filter(isGlobal),
        typeFields: Object.fromEntries(types.map((t) => [t.id, customFields.filter((f) => typeOfField[f.fieldKey] === t.id)])),
        copies: Object.fromEntries(customFields.filter(isGlobal).map((g) =>
            [g.fieldKey.slice(3), customFields.filter((f) => f.sourceFieldId === g.fieldKey.slice(3)).length])),
    }));
    on("POST", "/v1/cira/project-types/:id/custom-fields", ({params, body}) => ok(saveField(body, null, undefined, params.id)));
    on("PUT", "/v1/cira/project-types/:id/custom-fields/:cfId", ({params, body}) =>
        ok(saveField(body, null, customFields.find((f) => f.fieldKey === `cf:${params.cfId}`), params.id)));
    on("DELETE", "/v1/cira/project-types/:id/custom-fields/:cfId", ({params}) => {
        removeField(params.cfId);
        return {status: 204};
    });
    on("POST", "/v1/cira/project-types/:id/custom-fields/import", ({params, body}) => {
        const src = customFields.find((f) => f.fieldKey === `cf:${body.sourceFieldId}`);
        return src ? ok(copyField(src, null, params.id)) : fail(404, "원본 없음");
    });
    on("GET", "/v1/projects/:projectId/field-library", ({params}) => {
        const typeId = presetOf(params.projectId);
        const inSet = new Set(mockTypeOf(typeId).fields.map((f) => f.fieldKey));
        const mine = customFields.filter((f) => f.projectId === params.projectId);
        return ok(customFields
            .filter((f) => isGlobal(f) || (typeOfField[f.fieldKey] === typeId && !inSet.has(f.fieldKey)))
            .map((f) => ({field: f, importedAs: mine.find((m) => m.sourceFieldId === f.fieldKey.slice(3))?.fieldKey ?? null})));
    });
    on("POST", "/v1/projects/:projectId/custom-fields/import", ({params, body}) => {
        const src = customFields.find((f) => f.fieldKey === `cf:${body.sourceFieldId}`);
        if (!src) return fail(404, "원본 없음");
        if (customFields.some((f) => f.projectId === params.projectId && f.name === src.name)) {
            return fail(400, `이 프로젝트에 같은 이름의 필드가 있습니다: ${src.name}`);
        }
        const copy = copyField(src, params.projectId);
        projectFieldKeys[params.projectId] = [...(projectFieldKeys[params.projectId] ?? []), copy.fieldKey];
        return ok(copy);
    });
    on("GET", "/v1/cira/project-types", () => ok(types));
    on("POST", "/v1/cira/project-types", ({body}) => {
        const typeNm = String(body.typeNm ?? "").trim();
        if (!typeNm || types.some((t) => t.typeNm === typeNm)) return fail(400, "이미 있는 타입 이름입니다");
        const t: ProjectTypeResponse = {id: `PT-${++seq}`, typeNm, sortOrd: types.length + 1, spaceCount: 0, fields: [...BASE]};
        types.push(t);
        return ok(t);
    });
    on("PUT", "/v1/cira/project-types/:id", ({params, body}) => {
        const t = types.find((x) => x.id === params.id);
        if (!t) return fail(404, "타입 없음");
        t.typeNm = String(body.typeNm ?? t.typeNm).trim();
        return ok(t);
    });
    on("DELETE", "/v1/cira/project-types/:id", ({params}) => {
        const i = types.findIndex((x) => x.id === params.id);
        if (i >= 0) types.splice(i, 1);
        return {status: 204};
    });
    on("PUT", "/v1/cira/project-types/:id/fields", ({params, body}) => {
        const t = types.find((x) => x.id === params.id);
        if (!t) return fail(404, "타입 없음");
        t.fields = (body as unknown as TypeField[]).filter((f) => !FIXED.includes(f.fieldKey));
        return ok(t);
    });
    on("POST", "/v1/cira/custom-fields", ({body}) => {
        const g = saveField(body, null);
        ((body.copyToTypeIds as string[] | undefined) ?? []).forEach((typeId) => copyField(g, null, typeId));
        return ok(g);
    });
    on("PUT", "/v1/cira/custom-fields/:id", ({params, body}) =>
        ok(saveField(body, null, customFields.find((f) => f.fieldKey === `cf:${params.id}`))));
    on("DELETE", "/v1/cira/custom-fields/:id", ({params}) => {
        removeField(params.id);
        return {status: 204};
    });
    on("GET", "/v1/cira/custom-fields/:id/usage", () => ok({projects: 0, issues: 0}));

    on("GET", "/v1/projects/:projectId/fields", ({params}) => ok(effective(params.projectId, presetOf(params.projectId))));
    on("PUT", "/v1/projects/:projectId/fields", ({params, body}) => {
        projectFieldKeys[params.projectId] = (body.fieldKeys as string[]).filter((k) => !FIXED.includes(k));
        return ok(effective(params.projectId, presetOf(params.projectId)));
    });
    on("POST", "/v1/projects/:projectId/custom-fields", ({params, body}) => {
        const f = saveField(body, params.projectId);
        projectFieldKeys[params.projectId] = [...(projectFieldKeys[params.projectId] ?? []), f.fieldKey];
        return ok(f);
    });
    on("PUT", "/v1/projects/:projectId/custom-fields/:id", ({params, body}) =>
        ok(saveField(body, params.projectId, customFields.find((f) => f.fieldKey === `cf:${params.id}`))));
    on("DELETE", "/v1/projects/:projectId/custom-fields/:id", ({params}) => {
        removeField(params.id);
        return {status: 204};
    });

    const defaults = (projectId: string) =>
        effective(projectId, presetOf(projectId)).filter((f) => f.defaultVisible).map((f) => f.fieldKey);
    on("GET", "/v1/projects/:projectId/column-pref", ({params}) => ok({fieldKeys: prefs[params.projectId] ?? defaults(params.projectId)}));
    on("PUT", "/v1/projects/:projectId/column-pref", ({params, body}) => {
        const keys = (body.fieldKeys as string[]).filter((k) => !["sys:key", "sys:summary"].includes(k));
        prefs[params.projectId] = ["sys:key", "sys:summary", ...keys];
        return ok({fieldKeys: prefs[params.projectId]});
    });
    on("DELETE", "/v1/projects/:projectId/column-pref", ({params}) => {
        delete prefs[params.projectId];
        return ok({fieldKeys: defaults(params.projectId)});
    });
}
