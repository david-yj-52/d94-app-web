"use client";

import {useEffect, useId, useState} from "react";

/**
 * ```mermaid 블록을 다이어그램으로. mermaid 는 처음 필요할 때만 불러온다(dynamic import).
 * securityLevel "strict" — mermaid 가 라벨의 HTML·스크립트를 걸러 낸 SVG 를 준다.
 */
export default function MermaidDiagram({code}: { code: string }) {
    const id = `mmd-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        let alive = true;
        void import("mermaid").then(async ({default: mermaid}) => {
            mermaid.initialize({startOnLoad: false, securityLevel: "strict", theme: "neutral"});
            try {
                const out = await mermaid.render(id, code);
                if (alive) {
                    setSvg(out.svg);
                    setError(null);
                }
            } catch (e) {
                if (alive) setError(e instanceof Error ? e.message : String(e));
            }
        });
        return () => {
            alive = false;
        };
    }, [code, id]);
    if (error) {
        return (
            <div className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                Mermaid 오류: {error}
                <pre className="mt-2 overflow-x-auto text-slate-600">{code}</pre>
            </div>
        );
    }
    if (!svg) return <div className="my-3 h-24 animate-pulse rounded-lg bg-slate-100"/>;
    // mermaid(strict) 가 만든 SVG — 사용자 입력 HTML 이 아님
    return <div className="my-3 flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{__html: svg}}/>;
}
