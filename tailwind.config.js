/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // 서비스 공통 디자인 토큰 (CIRA 기준) → docs/decisions/0008-service-design-system.md
            colors: {
                d94: {
                    brand: "var(--d94-brand)",
                    "brand-hover": "var(--d94-brand-hover)",
                    "brand-soft": "var(--d94-brand-soft)",
                    bg: "var(--d94-bg)",
                    surface: "var(--d94-surface)",
                    sidebar: "var(--d94-sidebar)",
                    border: "var(--d94-border)",
                    text: "var(--d94-text)",
                    muted: "var(--d94-muted)",
                    danger: "var(--d94-danger)",
                    success: "var(--d94-success)",
                    warning: "var(--d94-warning)",
                },
                // CIRA 화면 전용 (.cira-root 안에서만 값이 있음) → ADR 0006
                cira: {
                    brand: "var(--cira-brand)",
                    "brand-soft": "var(--cira-brand-soft)",
                    bg: "var(--cira-bg)",
                    surface: "var(--cira-surface)",
                    sidebar: "var(--cira-sidebar)",
                    border: "var(--cira-border)",
                    text: "var(--cira-text)",
                    muted: "var(--cira-muted)",
                },
            },
        },
    },
    plugins: [],
};
