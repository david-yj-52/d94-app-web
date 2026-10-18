"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {signIn} from "next-auth/react";
import Link from "next/link";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

// TODO: 임시 - 백엔드 미기동 시 admin/admin 로그인 허용 (백엔드 복구 후 제거)
const DEV_ADMIN = "admin";

const schema = z.object({
    email: z.string().refine(
        (v) => v === DEV_ADMIN || z.string().email().safeParse(v).success,
        "올바른 이메일 형식을 입력해주세요."
    ),
    password: z.string().refine(
        (v) => v === DEV_ADMIN || v.length >= 8,
        "비밀번호는 최소 8자 이상이어야 합니다."
    ),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<FormData>({resolver: zodResolver(schema)});

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });
        if (result?.error) {
            setServerError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
            window.location.href = "/home";
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">로그인</h1>
            <p className="text-sm text-slate-500 mb-8">
                CIRA에 오신 것을 환영합니다.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        이메일
                    </label>
                    <input
                        {...register("email")}
                        type="email"
                        placeholder="example@company.com"
                        className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        비밀번호
                    </label>
                    <div className="relative">
                        <input
                            {...register("password")}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                            {showPassword ? "숨기기" : "보기"}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {serverError && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                        {serverError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            로그인 중...
                        </>
                    ) : (
                        "로그인"
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                계정이 없으신가요?{" "}
                <Link
                    href="/cira/register"
                    className="text-blue-600 font-medium hover:underline"
                >
                    회원가입
                </Link>
            </p>
        </div>
    );
}
