import {auth} from "@/auth";
import Link from "next/link";
import {redirect} from "next/navigation";

export default async function RegisterPage() {
    const session = await auth();
    if (session) redirect("/home");

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">회원가입</h1>
            <p className="text-sm text-slate-500 mb-8">
                소셜 계정으로 간편하게 시작하세요.
            </p>

            <button
                type="button"
                disabled
                className="w-full h-11 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium flex items-center justify-center gap-3 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path
                        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                        fill="#FFC107"
                    />
                    <path
                        d="M6.306 14.691l6.571 4.819C14.655 17.108 19.001 14 24 14c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                        fill="#FF3D00"
                    />
                    <path
                        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.31 0-9.625-3.618-11.29-8.472l-6.521 5.025C9.505 39.556 16.227 44 24 44z"
                        fill="#4CAF50"
                    />
                    <path
                        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.596 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"
                        fill="#1976D2"
                    />
                </svg>
                Google로 계속하기 (준비 중)
            </button>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
                <p className="text-sm text-slate-500">
                    이메일로 가입하시려면{" "}
                    <Link
                        href="/cira/register"
                        className="text-blue-600 font-medium hover:underline"
                    >
                        여기
                    </Link>
                    를 클릭하세요.
                </p>
                <p className="text-sm text-slate-500">
                    이미 계정이 있으신가요?{" "}
                    <Link
                        href="/login"
                        className="text-blue-600 font-medium hover:underline"
                    >
                        로그인
                    </Link>
                </p>
            </div>
        </div>
    );
}
