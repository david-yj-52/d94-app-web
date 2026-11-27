import type {ReactNode} from "react";
import {twMerge} from "tailwind-merge";

/** 상태·종류 배지(알약). 기본은 회색, 색은 className 으로(예: STATUS_COLOR[x]) — tailwind-merge 로 기본색을 덮어씀. */
export default function Badge({className, children}: { className?: string; children: ReactNode }) {
    return (
        <span className={twMerge("inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600", className)}>
            {children}
        </span>
    );
}
