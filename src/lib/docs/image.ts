// 붙여넣은 이미지를 UMD 요청 본문 상한(1MB) 안으로 줄인다. 이미 작고 허용 형식이면 그대로(GIF 애니메이션 보존).

export const MAX_UPLOAD_BYTES = 900 * 1024;
const PASSTHROUGH = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/** 긴 변 1920px 로 줄여 WebP 로, 그래도 크면 품질·크기를 낮춰 다시. 끝내 못 줄이면 throw */
export async function shrinkImage(file: Blob): Promise<Blob> {
    if (file.size <= MAX_UPLOAD_BYTES && PASSTHROUGH.includes(file.type)) return file;
    const bitmap = await createImageBitmap(file);
    try {
        for (const [maxSide, quality] of [[1920, 0.85], [1600, 0.75], [1280, 0.7], [1024, 0.6], [800, 0.5]] as const) {
            const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(bitmap.width * scale);
            canvas.height = Math.round(bitmap.height * scale);
            canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
            if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob;
        }
    } finally {
        bitmap.close();
    }
    throw new Error("이미지를 1MB 이하로 줄이지 못했습니다.");
}
