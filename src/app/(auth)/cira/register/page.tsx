import {auth} from "@/auth";
import RegisterForm from "@/components/auth/RegisterForm";
import {redirect} from "next/navigation";

export default async function CiraRegisterPage() {
    const session = await auth();
    if (session) redirect("/home");

    return <RegisterForm/>;
}
