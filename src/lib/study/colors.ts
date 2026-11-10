import type {AnnotationColor} from "@/types/study";

export const ANNOTATION_COLORS: AnnotationColor[] = ["yellow", "green", "blue", "pink"];

/** 마킹 배경 */
export const MARK_CLASS: Record<AnnotationColor, string> = {
    yellow: "bg-yellow-200",
    green: "bg-green-200",
    blue: "bg-sky-200",
    pink: "bg-pink-200",
};

/** 색 선택 버튼·목록의 점 */
export const DOT_CLASS: Record<AnnotationColor, string> = {
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    blue: "bg-sky-500",
    pink: "bg-pink-500",
};

export function errorMessage(e: unknown, fallback: string): string {
    const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
    return data?.message || fallback;
}
