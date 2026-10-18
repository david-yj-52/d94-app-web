import {auth} from "@/auth";
import {NextResponse} from "next/server";
import {handleMockRequest, isMockEnabled} from "@/lib/mock/router";

const API_BASE_URL = process.env.BACKEND_URL;

async function proxyHandler(
    request: Request,
    {params}: { params: Promise<{ path: string[] }> },
) {
    const resolvedParams = await params;

    // TODO: 임시 - DEV_MOCK_API=true 이면 백엔드 대신 Mock 데이터로 응답 (백엔드 복구 후 제거)
    if (isMockEnabled()) {
        const mock = await handleMockRequest(request, resolvedParams.path);
        return mock.raw ?? NextResponse.json(mock.body ?? {success: true, data: null}, {status: mock.status});
    }

    const url = new URL(request.url);
    const targetPath = `/${resolvedParams.path.join("/")}${url.search}`;
    const method = request.method;

    const session = await auth();

    try {
        let body: BodyInit | undefined = undefined;
        let isFormData = false;

        if (method !== "GET" && method !== "HEAD") {
            const contentType = request.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const json = await request.json();
                body = JSON.stringify(json);
            } else if (contentType?.includes("multipart/form-data")) {
                body = await request.formData();
                isFormData = true;
            }
        }

        // form-data는 Content-Type 생략 → fetch가 boundary 포함해서 자동 설정
        const headers: Record<string, string> = {};
        if (session?.user?.accessToken) {
            headers.Authorization = `Bearer ${session.user.accessToken}`;
        }
        if (!isFormData) {
            headers["Content-Type"] = "application/json";
        }

        console.log(`${API_BASE_URL}${targetPath}`);
        const res = await fetch(`${API_BASE_URL}${targetPath}`, {
            method,
            body,
            headers,
        });

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({error: res.statusText}));
            const err: any = new Error(`Backend API Error: ${res.status}`);
            err.status = res.status;
            err.body = errBody;
            throw err;
        }

        const result = await res.json();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error(`Proxy Error (${method} ${targetPath}):`, error);
        return NextResponse.json(
            error.body || {error: error.message || "Internal Server Error"},
            {status: error.status || 500},
        );
    }
}

export {
    proxyHandler as GET,
    proxyHandler as POST,
    proxyHandler as PUT,
    proxyHandler as DELETE,
};
