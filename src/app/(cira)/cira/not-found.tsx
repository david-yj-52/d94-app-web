import Link from "next/link";

export default function CiraNotFound() {
    return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
            <h1 className="mb-2 text-lg font-semibold">찾을 수 없습니다</h1>
            <p className="mb-6 text-sm text-cira-muted">주소가 바뀌었거나 삭제된 항목입니다.</p>
            <Link href="/cira/projects" className="text-sm font-semibold text-cira-brand">프로젝트 목록으로</Link>
        </div>
    );
}
