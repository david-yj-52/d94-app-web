import {auth} from "@/auth";
import LoginForm from "@/components/auth/LoginForm";
import {redirect} from "next/navigation";

export default async function LoginPage({searchParams}: { searchParams: Promise<{ reason?: string }> }) {
    const session = await auth();
    if (session) redirect("/home");

    // apiClient 가 401 로 로그아웃시키면 ?reason=expired 로 온다
    const {reason} = await searchParams;
    return <LoginForm reason={reason}/>;
}
