import react from "@vitejs/plugin-react";
import {fileURLToPath} from "node:url";
import {defineConfig} from "vitest/config";

// 테스트 설정 → docs/testing.md
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {"@": fileURLToPath(new URL("./src", import.meta.url))},
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        restoreMocks: true,
        coverage: {
            provider: "v8",
            reporter: ["text-summary", "json-summary", "html"],
            reportsDirectory: "./coverage",
            // CIRA 로직 계층만 측정한다 (화면 page.tsx·실험 모듈 제외)
            include: [
                "src/lib/api/**/*.ts",
                "src/hooks/**/*.ts",
                "src/components/{board,issue,layout,sprint}/**/*.tsx",
                "src/lib/mock/router.ts",
            ],
            exclude: ["**/*.test.{ts,tsx}"],
        },
    },
});
