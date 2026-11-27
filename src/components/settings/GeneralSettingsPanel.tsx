"use client";

import {useState} from "react";
import {isAxiosError} from "axios";
import TshLogo from "@/components/TshLogo";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {LOGO_FONTS, logoFontClass} from "@/components/ui/logoFonts";
import {useSettings, useUpdateSettings} from "@/hooks/useSettings";
import {DEFAULT_LOGO_TEXT, LOGO_FONT_KEY, LOGO_TEXT_KEY} from "@/types/settings";
import Button from "@/components/ui/Button";

const LOGO_TEXT_MAX = 30; // d94-query SettingService.LOGO_TEXT_MAX
const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand disabled:opacity-60";

/** General 그룹: 헤더 로고 글자·폰트 (모든 사용자·모든 페이지에 적용) */
export default function GeneralSettingsPanel({readOnly}: { readOnly: boolean }) {
    const {data} = useSettings();
    if (!data) return <SkeletonCard/>;
    return <LogoForm readOnly={readOnly}
                     initialText={data[LOGO_TEXT_KEY] || DEFAULT_LOGO_TEXT}
                     initialFont={knownFont(data[LOGO_FONT_KEY])}/>;
}

/** 목록에서 빠진 폰트가 저장돼 있으면 기본으로 — 아니면 select 와 상태가 어긋나 저장이 400 으로 막힌다 */
function knownFont(id: string | undefined): string {
    return LOGO_FONTS.some((f) => f.id === id) ? id! : "default";
}

function LogoForm({readOnly, initialText, initialFont}: { readOnly: boolean; initialText: string; initialFont: string }) {
    const [text, setText] = useState(initialText);
    const [font, setFont] = useState(initialFont);
    const update = useUpdateSettings();
    const {show, ToastComponent} = useToast();

    const trimmed = text.trim();
    const valid = trimmed.length > 0 && trimmed.length <= LOGO_TEXT_MAX;

    const save = () => update.mutate(
        {[LOGO_TEXT_KEY]: trimmed, [LOGO_FONT_KEY]: font},
        {
            onSuccess: () => show("저장했습니다"),
            onError: (e) => show((isAxiosError(e) && e.response?.data?.message) || "저장하지 못했습니다", "error"),
        },
    );

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">헤더 로고</h3>
            {readOnly && <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">관리자만 변경할 수 있습니다.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="logo-text" className="mb-1 block text-xs font-medium text-slate-600">로고 글자</label>
                    <input id="logo-text" className={inputCls} value={text} maxLength={LOGO_TEXT_MAX}
                           disabled={readOnly} onChange={(e) => setText(e.target.value)}/>
                    {!valid && <p className="mt-0.5 text-xs text-red-500">1~{LOGO_TEXT_MAX}자로 입력하세요.</p>}
                </div>
                <div>
                    <label htmlFor="logo-font" className="mb-1 block text-xs font-medium text-slate-600">로고 폰트</label>
                    <select id="logo-font" className={inputCls} value={font}
                            disabled={readOnly} onChange={(e) => setFont(e.target.value)}>
                        {LOGO_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="mt-5">
                <p className="mb-1 text-xs font-medium text-slate-600">미리보기</p>
                <div className="flex h-14 items-center gap-2 rounded-lg border border-slate-100 bg-white px-4">
                    <TshLogo className="h-7 w-7 shrink-0 object-contain"/>
                    <span className={`text-base font-bold tracking-tight text-gray-900 ${logoFontClass(font)}`}>
                        {trimmed || DEFAULT_LOGO_TEXT}
                    </span>
                </div>
            </div>
            <div className="mt-5 flex justify-end">
                <Button type="button" onClick={save} disabled={readOnly || !valid || update.isPending}>
                    저장
                </Button>
            </div>
            {ToastComponent}
        </section>
    );
}
