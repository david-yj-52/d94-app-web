/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // CIRA 화면 전용 (.cira-root 안에서만 값이 있음) → ADR 0006
            colors: {
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
