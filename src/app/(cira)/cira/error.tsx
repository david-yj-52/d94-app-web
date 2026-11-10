"use client";

export default function CiraError({reset}: { error: Error; reset: () => void }) {
    return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
            <h1 className="mb-2 text-lg font-semibold">화면을 불러오지 못했습니다</h1>
            <p className="mb-6 text-sm text-cira-muted">잠시 후 다시 시도해 주세요.</p>
            <button onClick={reset} className="h-10 rounded-md bg-cira-brand px-4 text-sm font-semibold text-white">
                다시 시도
            </button>
        </div>
    );
}
