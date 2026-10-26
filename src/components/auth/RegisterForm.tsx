"use client";

import {useRegister} from "@/hooks/useAuth";
import {zodResolver} from "@hookform/resolvers/zod";
import {isAxiosError} from "axios";
import {signIn} from "next-auth/react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

/** 가입 실패 응답 → 사용자 안내 문구 */
function registerErrorMessage(error: unknown): string {
    if (!isAxiosError(error) || !error.response) {
        return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
    }
    const {status, data} = error.response;
    const message: string | undefined = data?.message;
    if (status === 400 && message?.includes("already exists")) return "이미 가입된 이메일입니다.";
    // UMD(server) public-paths 에 /tsh/api/v1/auth/** 가 없으면 가입 요청이 토큰 없음으로 막힌다
    if (status === 401) return "가입 요청이 서버에서 거절되었습니다. 관리자에게 문의해주세요.";
    if (status >= 502) return "서버에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
    return message || "회원가입에 실패했습니다.";
}

const schema = z
    .object({
        name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다."),
        email: z.string().email("올바른 이메일 형식을 입력해주세요."),
        password: z
            .string()
            .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
            .regex(
                /^(?=.*[a-zA-Z])(?=.*\d)/,
                "비밀번호는 영문과 숫자를 포함해야 합니다.",
            ),
        passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
        message: "비밀번호가 일치하지 않습니다.",
        path: ["passwordConfirm"],
    });

type FormData = z.infer<typeof schema>;

export default function RegisterForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<FormData>({resolver: zodResolver(schema)});

    const {mutateAsync: registerUser} = useRegister();

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        try {
            await registerUser({email: data.email, name: data.name, password: data.password});
        } catch (error) {
            setServerError(registerErrorMessage(error));
            return;
        }
        setSuccess(true);
        // 가입한 계정으로 바로 로그인. 실패하면 로그인 화면으로 보낸다
        const result = await signIn("credentials", {email: data.email, password: data.password, redirect: false});
        if (result?.error) {
            setTimeout(() => router.push("/login"), 1500);
        } else {
            window.location.href = "/home";
        }
    };

    if (success) {
        return (
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10 text-center">
                <div className="text-green-500 text-4xl mb-3">✓</div>
                <p className="text-lg font-semibold text-slate-800">
                    회원가입이 완료되었습니다!
                </p>
                <p className="text-sm text-slate-500 mt-1">로그인하는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">회원가입</h1>
            <p className="text-sm text-slate-500 mb-8">이메일로 계정을 만드세요. 가입 후 바로 로그인됩니다.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        이름
                    </label>
                    <input
                        {...register("name")}
                        type="text"
                        placeholder="홍길동"
                        className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                    )}
                </div>

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
                            placeholder="영문+숫자 8자 이상"
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

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        비밀번호 확인
                    </label>
                    <div className="relative">
                        <input
                            {...register("passwordConfirm")}
                            type={showConfirm ? "text" : "password"}
                            placeholder="비밀번호를 다시 입력하세요"
                            className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                            {showConfirm ? "숨기기" : "보기"}
                        </button>
                    </div>
                    {errors.passwordConfirm && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.passwordConfirm.message}
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
                            처리 중...
                        </>
                    ) : (
                        "회원가입"
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                이미 계정이 있으신가요?{" "}
                <Link
                    href="/login"
                    className="text-blue-600 font-medium hover:underline"
                >
                    로그인
                </Link>
            </p>
        </div>
    );
}
