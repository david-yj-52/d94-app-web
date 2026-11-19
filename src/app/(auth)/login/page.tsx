import {auth} from "@/auth";
import LoginForm from "@/components/auth/LoginForm";
import {safeCallbackUrl} from "@/lib/routeAccess";
import {redirect} from "next/navigation";

export default async function LoginPage({searchParams}: {
    searchParams: Promise<{ reason?: string; callbackUrl?: string }>;
}) {
    // 만료 안내(?reason=expired)와 돌아갈 경로(?callbackUrl=)는 미들웨어가 붙인다. 내부 경로만 허용
    const {reason, callbackUrl} = await searchParams;
    const target = safeCallbackUrl(callbackUrl);

    const session = await auth();
    if (session) redirect(target);

    return <LoginForm reason={reason} callbackUrl={target}/>;
}
