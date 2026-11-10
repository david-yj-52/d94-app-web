import type {BoardColumnResponse} from "@/types/board";

// 보드 빠른 필터. 컬럼은 비어도 남긴다(드롭 대상 유지)
export function filterColumns(
    columns: BoardColumnResponse[],
    {mineEmail, keyword = ""}: { mineEmail?: string | null; keyword?: string },
): BoardColumnResponse[] {
    const me = mineEmail?.toLowerCase();
    const q = keyword.trim().toLowerCase();
    if (!me && !q) return columns;
    return columns.map((c) => ({
        ...c,
        issues: c.issues.filter(
            (i) =>
                (!me || i.assignee?.email?.toLowerCase() === me) &&
                (!q || i.issueKey.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)),
        ),
    }));
}
