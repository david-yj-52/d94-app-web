import {redirect} from "next/navigation";

/** Ayaan 기준정보는 d94 기준정보 화면의 Ayaan 그룹으로 이관됨 */
export default function AyaanSettingsRedirect() {
    redirect("/settings?group=ayaan");
}
