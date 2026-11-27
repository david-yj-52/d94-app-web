import type {ButtonHTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";

const VARIANT = {
    primary: "bg-d94-brand font-semibold text-white hover:bg-d94-brand-hover",
    secondary: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-50",
    danger: "bg-red-500 font-semibold text-white hover:bg-red-600",
};
const SIZE = {md: "h-10 px-4 text-sm", sm: "h-8 px-3 text-xs"};

/** 공통 버튼. className 은 tailwind-merge 로 덮어씀(예: flex-1, w-full, px-5). type 은 기본 <button> 과 같음(폼 안에서는 submit) — 폼 밖 동작 버튼은 type="button" 을 주세요. */
export default function Button({variant = "primary", size = "md", className, ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof VARIANT;
    size?: keyof typeof SIZE;
}) {
    return (
        <button
            className={twMerge("inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60", SIZE[size], VARIANT[variant], className)}
            {...props}
        />
    );
}
