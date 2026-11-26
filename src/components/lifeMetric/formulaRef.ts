/** 커서 바로 앞의 `@부분코드` — 자동완성 대상. 없으면 null */
export function refQueryAt(text: string, caret: number): string | null {
    const m = /@([a-z0-9_]*)$/.exec(text.slice(0, caret));
    return m ? m[1] : null;
}

/** 커서 앞 `@부분코드` 를 `@code ` 로 바꾸고 새 커서 위치를 돌려준다 */
export function insertRef(text: string, caret: number, code: string): { text: string; caret: number } {
    const q = refQueryAt(text, caret) ?? "";
    const start = caret - q.length;
    const insert = `${code} `;
    return {text: text.slice(0, start) + insert + text.slice(caret), caret: start + insert.length};
}

/** 지표 값 표시: 큰 수는 천 단위 구분, 소수는 2자리까지 */
export function formatValue(v: number | null): string {
    if (v == null) return "—";
    return v.toLocaleString("ko-KR", {maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 2});
}
