import type {ReactNode} from "react";
import {twMerge} from "tailwind-merge";

/** "~이 없습니다" 빈 상태. size="sm" 은 사이드바·패널 안 작은 안내. action 은 버튼·링크(선택). */
export default function EmptyState({children, action, size = "md", className}: {
    children: ReactNode;
    action?: ReactNode;
    size?: "md" | "sm";
    className?: string;
}) {
    return (
        <div className={twMerge("text-center text-slate-400", size === "sm" ? "px-3 py-4 text-xs" : "px-4 py-10 text-sm", className)}>
            <p>{children}</p>
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
