"use client";

import Button from "@/components/ui/Button";

export default function PumpControlPanel({
    onCommand,
    isPending,
    isAdmin,
}: {
    onCommand: (action: "ON" | "OFF") => void;
    isPending: boolean;
    isAdmin: boolean;
}) {
    if (!isAdmin) return null;
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">스마트팜 펌프 제어</h2>
            <p className="mt-1 text-sm text-slate-500">PUMP1 · 명령은 Admin만 보낼 수 있습니다. ON 후 OFF를 누를 때까지 계속 작동합니다.</p>
            <div className="mt-4 flex gap-3">
                <Button type="button" aria-label="PUMP1 켜기" disabled={isPending} onClick={() => onCommand("ON")}>PUMP1 ON</Button>
                <Button type="button" aria-label="PUMP1 끄기" disabled={isPending} variant="secondary" onClick={() => onCommand("OFF")}>PUMP1 OFF</Button>
            </div>
        </section>
    );
}
