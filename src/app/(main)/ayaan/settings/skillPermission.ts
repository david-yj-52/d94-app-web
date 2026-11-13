import type {AyaanPermission, AyaanSkill, Phase} from "@/types/ayaan";

/** 이 Tool·단계에서 고를 수 있는 skill (사용 중, 단계 일치 또는 ANY) */
export function skillOptions(skills: AyaanSkill[], tool: string, phase: Phase): AyaanSkill[] {
    return skills.filter((s) => s.enabled && s.toolCd === tool && (s.phase === phase || s.phase === "ANY"));
}

/** 실행 중 승인(ASK)은 1차에 Claude 만 지원. 다른 Tool 행의 ASK 는 경고한다 */
export function askWarning(p: AyaanPermission): string | null {
    if (p.decision === "ASK" && p.toolCd !== "CLAUDE" && p.toolCd !== "*") {
        return `${p.toolCd}는 실행 중 승인을 지원하지 않아 ASK가 적용되지 않습니다.`;
    }
    return null;
}

export const EMPTY_SKILL: AyaanSkill = {
    skillCd: "", skillNm: "", toolCd: "CLAUDE", phase: "PLAN", invokeText: "", pluginRef: null,
    description: null, enabled: true, sortNo: 0,
};

/** 폼 → PUT 본문. 오류가 있으면 문구를 돌려준다 (서버 검증이 최종) */
export function toSkillBody(s: AyaanSkill): AyaanSkill | string {
    const skillCd = s.skillCd.trim().toUpperCase();
    if (!/^[A-Z0-9_]{1,50}$/.test(skillCd) || skillCd === "NONE") return "코드는 영문 대문자·숫자·_ 50자 이내(NONE 불가)입니다.";
    if (!s.skillNm.trim() || !s.invokeText.trim()) return "이름과 호출 문자열을 입력하세요.";
    const pluginRef = s.pluginRef?.trim() || null;
    if (pluginRef && s.toolCd !== "CLAUDE") return "플러그인은 CLAUDE skill 에만 연결할 수 있습니다.";
    return {...s, skillCd, skillNm: s.skillNm.trim(), invokeText: s.invokeText.trim(), pluginRef, description: s.description?.trim() || null};
}

/** CLAUDE_PLUGINS 값에서 plugin@marketplace 목록 */
export const pluginRefs = (spec: string | undefined) =>
    (spec ?? "").split(",").map((e) => e.trim().split("|")[0]).filter(Boolean);
