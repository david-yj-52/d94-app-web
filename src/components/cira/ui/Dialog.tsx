"use client";

import * as RD from "@radix-ui/react-dialog";
import {X} from "lucide-react";
import type {ReactNode} from "react";

// 모바일(<768px)은 전체 화면 시트, 그 이상은 가운데 모달. side="left" 는 모바일 메뉴 서랍
export default function Dialog({open, onOpenChange, title, children, side, hideTitle}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
    side?: "left";
    hideTitle?: boolean;
}) {
    const panel = side === "left"
        ? "inset-y-0 left-0 w-72 max-w-[85vw]"
        : "inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-md md:max-h-[85vh]";
    return (
        <RD.Root open={open} onOpenChange={onOpenChange}>
            <RD.Portal>
                <RD.Overlay className="fixed inset-0 z-50 bg-black/40"/>
                <RD.Content
                    aria-describedby={undefined}
                    className={`cira-root fixed z-50 flex flex-col overflow-y-auto bg-white shadow-xl focus:outline-none ${panel}`}
                >
                    <div className={`flex items-center justify-between border-b border-cira-border px-4 py-3 ${hideTitle ? "sr-only" : ""}`}>
                        <RD.Title className="text-base font-semibold">{title}</RD.Title>
                        <RD.Close className="flex h-10 w-10 items-center justify-center rounded text-cira-muted hover:bg-gray-100"
                                  aria-label="닫기">
                            <X className="h-4 w-4"/>
                        </RD.Close>
                    </div>
                    {children}
                </RD.Content>
            </RD.Portal>
        </RD.Root>
    );
}
