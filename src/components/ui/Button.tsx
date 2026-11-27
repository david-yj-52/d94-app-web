import type {ButtonHTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";

const VARIANT = {
    primary: "bg-d94-brand font-semibold text-white hover:bg-d94-brand-hover",
    secondary: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-50",
    danger: "bg-red-500 font-semibold text-white hover:bg-red-600",
    link: "text-d94-brand hover:underline",
    /** 모양을 className 으로 전부 정하는 버튼(탭·목록 줄·칩·아이콘 등). 기본 모양 없음 */
    unstyled: "",
};
const SIZE = {md: "h-10 px-4 text-sm", sm: "h-8 px-3 text-xs", icon: "h-8 w-8 p-0", none: ""};
// 키보드로 포커스했을 때만 보이는 링 — 모든 버튼 공통
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d94-brand focus-visible:ring-offset-1";
const BASE = "inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/**
 * 공통 버튼. className 은 tailwind-merge 로 덮어씀(예: flex-1, w-full, px-5).
 * size 기본값: primary·secondary·ghost·danger = md, link·unstyled = none.
 * type 은 기본 <button> 과 같음(폼 안에서는 submit) — 폼 밖 동작 버튼은 type="button" 을 주세요.
 */
export default function Button({variant = "primary", size, className, ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof VARIANT;
    size?: keyof typeof SIZE;
}) {
    const plain = variant === "unstyled" || variant === "link";
    return (
        <button
            className={twMerge(FOCUS, variant === "unstyled" ? "" : BASE, SIZE[size ?? (plain ? "none" : "md")], VARIANT[variant], className)}
            {...props}
        />
    );
}
