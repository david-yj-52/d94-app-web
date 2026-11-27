import type {InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";

// 입력·선택·여러 줄 공통 모양. React 19 라 ref 는 일반 prop 으로 넘어감(react-hook-form register 그대로 사용 가능)
const FIELD = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand";

export function Input({className, ...props}: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={twMerge(FIELD, "h-10", className)} {...props}/>;
}

export function Select({className, ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select className={twMerge(FIELD, "h-10", className)} {...props}/>;
}

export function Textarea({className, ...props}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={twMerge(FIELD, "resize-none py-2", className)} {...props}/>;
}
