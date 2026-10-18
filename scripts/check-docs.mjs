// 컨텍스트 문서(AGENTS.md 계열) 동기화 검사 — AGENTS.md §10
// 사용법: npm run docs:check
// 오류(exit 1): 문서 구조가 코드와 어긋남 / 경고(exit 0): 함께 갱신했는지 확인 필요

import {execSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const IGNORE_DIRS = new Set(["node_modules", ".next", ".git"]);

const errors = [];
const warnings = [];
const summary = [];

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const read = (p) => fs.readFileSync(p, "utf8");

function walk(dir, filter, out = []) {
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
        if (IGNORE_DIRS.has(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, filter, out);
        else if (filter(e.name, p)) out.push(p);
    }
    return out;
}

// 괄호 균형을 맞춰 링크 대상을 추출 — "(main)" 같은 경로 지원
function extractLinkTargets(text) {
    const targets = [];
    let i = 0;
    while ((i = text.indexOf("](", i)) !== -1) {
        let j = i + 2;
        let depth = 1;
        while (j < text.length && depth > 0) {
            if (text[j] === "(") depth++;
            else if (text[j] === ")") depth--;
            if (depth > 0) j++;
        }
        targets.push(text.slice(i + 2, j));
        i = j;
    }
    return targets;
}

const stripCodeBlocks = (text) => text.replace(/```[\s\S]*?```/g, "");

const mdFiles = walk(ROOT, (name) => name.endsWith(".md"));
const agentsFiles = mdFiles.filter((p) => path.basename(p) === "AGENTS.md");
const rootAgents = path.join(ROOT, "AGENTS.md");

// ── 1. 링크 ─────────────────────────────────────────────────────────
{
    let count = 0;
    for (const file of mdFiles) {
        for (const t of extractLinkTargets(stripCodeBlocks(read(file)))) {
            if (/^(https?:|mailto:|#)/.test(t)) continue;
            const target = t.split("#")[0];
            if (!target) continue;
            count++;
            if (!fs.existsSync(path.resolve(path.dirname(file), decodeURI(target)))) {
                errors.push(`[링크] ${rel(file)} → ${t} (대상 없음)`);
            }
        }
    }
    summary.push(`links ${count}`);
}

// ── 2. AGENTS.md / CLAUDE.md 짝 ─────────────────────────────────────
for (const file of agentsFiles) {
    const claude = path.join(path.dirname(file), "CLAUDE.md");
    if (!fs.existsSync(claude)) {
        errors.push(`[짝] ${rel(claude)} 없음 (내용: @AGENTS.md)`);
    } else if (!read(claude).includes("@AGENTS.md")) {
        errors.push(`[짝] ${rel(claude)}에 @AGENTS.md import 없음`);
    }
}
summary.push(`pairs ${agentsFiles.length}`);

// ── 3. L1 §0 계층 지도 ──────────────────────────────────────────────
{
    const l1 = read(rootAgents);
    const mapSection = l1.slice(l1.indexOf("## 0."), l1.indexOf("## 1."));
    for (const file of agentsFiles) {
        if (file === rootAgents) continue;
        const folder = path.basename(path.dirname(file));
        if (!mapSection.includes(folder)) {
            errors.push(`[지도] ${rel(file)} 가 AGENTS.md §0 지도에 없음`);
        }
    }
    summary.push("map");
}

// ── 4. 컴포넌트 카탈로그 ───────────────────────────────────────────
{
    const catalogPath = path.join(SRC, "components", "AGENTS.md");
    const catalog = read(catalogPath);
    const components = walk(path.join(SRC, "components"), (name) => name.endsWith(".tsx"));
    for (const c of components) {
        const name = path.basename(c, ".tsx");
        if (!new RegExp(`\\b${name}\\b`).test(catalog)) {
            errors.push(`[카탈로그] ${rel(c)} 가 ${rel(catalogPath)} 목록에 없음`);
        }
    }
    summary.push(`catalog ${components.length}`);
}

// ── 5. 훅 목록 ──────────────────────────────────────────────────────
{
    const hooksDocPath = path.join(SRC, "hooks", "AGENTS.md");
    const hooksDoc = read(hooksDocPath);
    const hooks = fs.readdirSync(path.join(SRC, "hooks")).filter((n) => /\.tsx?$/.test(n));
    for (const h of hooks) {
        const name = h.replace(/\.tsx?$/, "");
        if (!new RegExp(`\\b${name}\\b`).test(hooksDoc)) {
            errors.push(`[훅] src/hooks/${h} 가 ${rel(hooksDocPath)} 표에 없음`);
        }
    }
    summary.push(`hooks ${hooks.length}`);
}

// ── 6. 화면 → L3 문서 ───────────────────────────────────────────────
{
    const appDir = path.join(SRC, "app");
    const appDoc = read(path.join(appDir, "AGENTS.md"));
    const pages = walk(appDir, (name) => name === "page.tsx");
    for (const page of pages) {
        let dir = path.dirname(page);
        let covered = false;
        while (dir !== appDir && dir.startsWith(appDir)) {
            if (fs.existsSync(path.join(dir, "AGENTS.md"))) {
                covered = true;
                break;
            }
            dir = path.dirname(dir);
        }
        if (covered) continue;
        const url =
            "/" +
            path
                .relative(appDir, path.dirname(page))
                .split(path.sep)
                .filter((s) => s && !/^\(.*\)$/.test(s))
                .join("/");
        if (!appDoc.includes(`\`${url}\``) && !appDoc.includes(`"${url}"`)) {
            errors.push(`[화면] ${rel(page)} (${url}) 에 L3 AGENTS.md 가 없고 src/app/AGENTS.md 에도 없음`);
        }
    }
    summary.push(`screens ${pages.length}`);
}

// ── 7. 문서에 적힌 import 경로 역참조 ───────────────────────────────
{
    const resolveAlias = (spec) => {
        const base = path.join(SRC, spec);
        const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
        return candidates.some((c) => fs.existsSync(c));
    };
    let count = 0;
    for (const file of mdFiles) {
        const matches = read(file).matchAll(/@\/((?:components|hooks|lib|types|app)\/[A-Za-z0-9_\-./[\]()]+)/g);
        for (const m of matches) {
            const spec = m[1].replace(/[.)]+$/, "").replace(/\/$/, "");
            if (spec.includes("...")) continue;
            count++;
            if (!resolveAlias(spec)) {
                errors.push(`[역참조] ${rel(file)} 의 @/${spec} 가 존재하지 않음`);
            }
        }
    }
    summary.push(`import refs ${count}`);
}

// ── 경고: 바뀐 코드 대비 문서 미갱신 ────────────────────────────────
{
    let changed = [];
    try {
        const opts = {encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]};
        const diff = execSync("git diff --name-only HEAD", opts);
        const untracked = execSync("git ls-files --others --exclude-standard", opts);
        changed = [...diff.split("\n"), ...untracked.split("\n")].map((s) => s.trim()).filter(Boolean);
    } catch {
        warnings.push("git 정보를 읽지 못해 변경 추적을 건너뜀");
    }
    const changedSet = new Set(changed);
    const codeFiles = changed.filter((f) => f.startsWith("src/") && /\.(ts|tsx|mjs|js)$/.test(f));

    const nearestAgents = (fileRel) => {
        let dir = path.dirname(path.join(ROOT, fileRel));
        while (dir.startsWith(ROOT)) {
            const candidate = path.join(dir, "AGENTS.md");
            if (fs.existsSync(candidate)) return rel(candidate);
            if (dir === ROOT) break;
            dir = path.dirname(dir);
        }
        return "AGENTS.md";
    };

    const appFiles = walk(path.join(SRC, "app"), (name) => /\.tsx?$/.test(name));
    for (const f of codeFiles) {
        const doc = nearestAgents(f);
        if (!changedSet.has(doc)) {
            warnings.push(`${f} 변경 → ${doc} 미변경 (갱신 필요 여부 확인)`);
        }
        // 컴포넌트·훅이 바뀌면 그것을 쓰는 화면의 L3 문서도 영향 가능
        const m = f.match(/^src\/((components|hooks)\/.+)\.(tsx?|ts)$/);
        if (m) {
            const spec = `@/${m[1]}"`;
            const impacted = new Set(
                appFiles
                    .filter((a) => read(a).includes(spec))
                    .map((a) => nearestAgents(rel(a)))
                    .filter((d) => !changedSet.has(d)),
            );
            if (impacted.size) {
                warnings.push(`  영향 가능: ${[...impacted].join(", ")}`);
            }
        }
    }
}

// ── 출력 ────────────────────────────────────────────────────────────
console.log(`docs:check  ${summary.join(" · ")}`);
for (const e of errors) console.log(`✖ ${e}`);
for (const w of warnings) console.log(`⚠ ${w}`);
if (errors.length) {
    console.log(`\n오류 ${errors.length}개 — AGENTS.md §10 매핑표에 따라 문서를 갱신하세요.`);
    process.exit(1);
}
console.log(`\n오류 없음${warnings.length ? `, 경고 ${warnings.length}개 확인 필요` : ""}.`);
