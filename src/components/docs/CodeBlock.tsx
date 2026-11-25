"use client";

import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import "highlight.js/styles/github.css";

// ponytail: 자주 쓰는 언어만 등록(번들 크기). 필요하면 여기에 한 줄씩 추가
for (const [name, lang] of Object.entries({bash, css, go, java, javascript, json, kotlin, python, sql, typescript, xml, yaml})) {
    hljs.registerLanguage(name, lang);
}
hljs.registerAliases(["sh", "shell", "zsh"], {languageName: "bash"});
hljs.registerAliases(["js", "jsx"], {languageName: "javascript"});
hljs.registerAliases(["ts", "tsx"], {languageName: "typescript"});
hljs.registerAliases(["html", "svg"], {languageName: "xml"});
hljs.registerAliases(["yml"], {languageName: "yaml"});
hljs.registerAliases(["py"], {languageName: "python"});
hljs.registerAliases(["kt"], {languageName: "kotlin"});

/** ``` 코드 블록 문법 하이라이트. 모르는 언어는 그대로(이스케이프된 텍스트) */
export default function CodeBlock({code, language}: { code: string; language: string | null }) {
    const known = language && hljs.getLanguage(language);
    return (
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {language && <div className="border-b border-slate-200 px-3 py-1 text-xs text-slate-500">{language}</div>}
            <pre className="overflow-x-auto p-3 text-sm leading-6">
                {known
                    // highlight.js 결과는 원문을 이스케이프한 HTML 이다
                    ? <code className="hljs !bg-transparent !p-0" dangerouslySetInnerHTML={{__html: hljs.highlight(code, {language}).value}}/>
                    : <code>{code}</code>}
            </pre>
        </div>
    );
}
