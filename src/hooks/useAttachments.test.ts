import {ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {renderHookWithClient} from "@/test/utils";
import {act} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, it} from "vitest";
import {useUploadAttachment} from "./useAttachments";

const BASE = "*/api/proxy/v1/issues/:issueId/attachments/uploads";

describe("useUploadAttachment 조각 업로드", () => {
    it("start → 조각 PUT(partSize 로 자름) → complete, 진행률은 조각 비율", async () => {
        const parts: number[] = [];
        let completeBody: unknown;
        server.use(
            http.post(BASE, () => HttpResponse.json(ok({uploadId: "up-1", partSize: 4, partCount: 3}))),
            http.put(`${BASE}/:uploadId/parts/:n`, async ({request}) => {
                parts.push((await request.arrayBuffer()).byteLength);
                return HttpResponse.json(ok(null));
            }),
            http.post(`${BASE}/:uploadId/complete`, async ({request}) => {
                completeBody = await request.json();
                return HttpResponse.json(ok({id: "a-9", fileName: "a.txt"}));
            }),
        );
        const progress: number[] = [];
        const {result} = renderHookWithClient(() => useUploadAttachment("I-1"));
        await act(() => result.current.mutateAsync({
            file: new File(["0123456789"], "a.txt", {type: "text/plain"}),
            onProgress: (p) => progress.push(p),
        }));

        expect(parts).toEqual([4, 4, 2]);
        expect(progress).toEqual([33, 67, 100]);
        expect(completeBody).toEqual({fileName: "a.txt", fileSize: 10, mimeType: "text/plain"});
    });
});
