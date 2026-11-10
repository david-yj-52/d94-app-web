/** @type {import('next').NextConfig} */
const nextConfig = {
    // ✅ webpack 설정 제거하고 turbopack 설정으로 변경
    turbopack: {},

    // ✅ SSR에서 solclientjs 제외
    serverExternalPackages: ["solclientjs"],

    // CIRA 는 /cira 아래로 옮겼다. 예전 북마크·알림 링크용 (쿼리는 Next 가 그대로 넘김)
    async redirects() {
        return [
            {source: "/projects", destination: "/cira/projects", permanent: true},
            {source: "/projects/:path*", destination: "/cira/projects/:path*", permanent: true},
            {source: "/dashboard", destination: "/cira/dashboard", permanent: true},
            {source: "/search", destination: "/cira/search", permanent: true},
            {source: "/search/:path*", destination: "/cira/search/:path*", permanent: true},
            {source: "/notifications", destination: "/cira/notifications", permanent: true},
            // d94-query 위키가 [[CIRA-1]] 을 /issues/CIRA-1 링크로 만든다
            {source: "/issues/:key", destination: "/cira/search?q=:key", permanent: true},
        ];
    },
};

export default nextConfig;
