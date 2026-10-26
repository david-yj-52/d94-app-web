import {auth} from "@/auth";
import RegisterForm from "@/components/auth/RegisterForm";
import {redirect} from "next/navigation";

/** 이메일 회원가입 (소셜 로그인은 미구현) */
export default async function RegisterPage() {
    const session = await auth();
    if (session) redirect("/home");

    return <RegisterForm/>;
}
