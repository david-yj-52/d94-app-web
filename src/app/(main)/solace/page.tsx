// src/app/(main)/solace/page.tsx
"use client";

import dynamic from "next/dynamic";

const SolaceTestContent = dynamic(() => import("./solaceTestContent"), {
    ssr: false,
});

export default function SolaceTestPage() {
    return <SolaceTestContent/>;
}
