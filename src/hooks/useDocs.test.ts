import {ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {renderHookWithClient} from "@/test/utils";
import {waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, it} from "vitest";
import {useNotes} from "./useDocs";

describe("useNotes", () => {
    const origins: (string | null)[] = [];
    const listNotes = http.get("*/api/proxy/v1/docs/notes", ({request}) => {
        origins.push(new URL(request.url).searchParams.get("origin"));
        return HttpResponse.json(ok([]));
    });

    it("enabled=false 면 요청하지 않는다 (노트를 불러오기 전 파생 노트 조회 — 예전엔 origin=\\u0000 을 보내 500)", async () => {
        origins.length = 0;
        server.use(listNotes);
        const {result} = renderHookWithClient(() => useNotes({origin: undefined}, false));
        await new Promise((r) => setTimeout(r, 20));
        expect(result.current.fetchStatus).toBe("idle");
        expect(origins).toEqual([]);
    });

    it("enabled 면 origin 으로 조회한다", async () => {
        origins.length = 0;
        server.use(listNotes);
        const {result} = renderHookWithClient(() => useNotes({origin: "원본", vaultId: "V-1"}));
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(origins).toEqual(["원본"]);
    });
});
