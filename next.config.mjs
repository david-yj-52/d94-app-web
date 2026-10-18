/** @type {import('next').NextConfig} */
const nextConfig = {
    // ✅ webpack 설정 제거하고 turbopack 설정으로 변경
    turbopack: {},

    // ✅ SSR에서 solclientjs 제외
    serverExternalPackages: ["solclientjs"],
};

export default nextConfig;
