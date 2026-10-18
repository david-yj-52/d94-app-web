"use client";

import {addTodos} from "@/app/actions";
import {useRef} from "react";
import {useFormStatus} from "react-dom";

function SubmitButton() {
    const {pending} = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors
     disabled:bg-blue-300 disabled:cursor-not-allowed min-w-[80px]"
        >
            {pending ? (
                <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
            ) : (
                "Add"
            )}
        </button>
    );
}

export default function AddTodoForm() {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await addTodos(formData);
                formRef.current?.reset(); // 등록 성공 후 입력창 초기화
            }}
            className="flex gap-2 mb-8"
        >
            <input
                type="text"
                name="todoText"
                placeholder="새로운 할 일을 입력하세요."
                className="flex-1 px-4 py-3 rounded-xl border border-r-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
            />
            <SubmitButton/>
        </form>
    );
}
