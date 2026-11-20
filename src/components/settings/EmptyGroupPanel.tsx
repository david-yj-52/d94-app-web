import Link from "next/link";
import type {SettingGroup} from "@/types/settings";

/** 아직 설정 항목이 없는 기능 그룹. link 가 있으면 기존 설정 화면으로 보낸다 */
export default function EmptyGroupPanel({group}: { group: SettingGroup }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            {group.link ? (
                <Link href={group.link} className="font-medium text-blue-600 hover:underline">기존 설정 화면으로 이동 →</Link>
            ) : "아직 설정 항목이 없습니다."}
        </section>
    );
}
