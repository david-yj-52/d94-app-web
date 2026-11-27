"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import type {ReactNode} from "react";

// Radix DropdownMenu (····더보기 메뉴). trigger 는 button 요소여야 한다 (asChild). 키보드·바깥 클릭·포커스는 Radix 가 처리
// cira-root: 포털이 .cira-root 밖이라 CIRA 화면에서도 같은 색이 나오도록(값은 d94 토큰과 같음)
export default function DropdownMenu({trigger, items, align = "end"}: {
    trigger: ReactNode;
    items: { label: ReactNode; onSelect: () => void; disabled?: boolean; danger?: boolean }[];
    align?: "start" | "end";
}) {
    return (
        <DM.Root>
            <DM.Trigger asChild>{trigger}</DM.Trigger>
            <DM.Portal>
                <DM.Content
                    align={align}
                    sideOffset={4}
                    className="cira-root z-50 min-w-[10rem] rounded-md border border-d94-border bg-white p-1 shadow-lg"
                >
                    {items.map((item, i) => (
                        <DM.Item
                            key={i}
                            disabled={item.disabled}
                            onSelect={item.onSelect}
                            className={`flex min-h-9 cursor-pointer select-none items-center rounded px-2 text-sm outline-none data-[highlighted]:bg-d94-brand-soft data-[disabled]:opacity-40 ${
                                item.danger ? "text-red-600" : "text-d94-text"
                            }`}
                        >
                            {item.label}
                        </DM.Item>
                    ))}
                </DM.Content>
            </DM.Portal>
        </DM.Root>
    );
}
