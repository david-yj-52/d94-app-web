import {redirect} from "next/navigation";

/** 예전 회원가입 경로. 이메일 회원가입은 /register 로 옮겼다 */
export default function CiraRegisterPage() {
    redirect("/register");
}
