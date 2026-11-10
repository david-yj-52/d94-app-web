"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import type {ReactNode} from "react";

// Radix DropdownMenu 를 CIRA 스타일로. trigger 는 button 요소여야 한다 (asChild)
export default function Menu({trigger, items, align = "end"}: {
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
                    className="cira-root z-50 min-w-[10rem] rounded-md border border-cira-border bg-white p-1 shadow-lg"
                >
                    {items.map((item, i) => (
                        <DM.Item
                            key={i}
                            disabled={item.disabled}
                            onSelect={item.onSelect}
                            className={`flex min-h-9 cursor-pointer select-none items-center rounded px-2 text-sm outline-none data-[highlighted]:bg-cira-brand-soft data-[disabled]:opacity-40 ${
                                item.danger ? "text-red-600" : "text-cira-text"
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
