import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {getTasks} from "./ayaan";

describe("lib/api/ayaan", () => {
    it("getTasks: 필터를 쿼리로 보내고 data 를 돌려준다", async () => {
        const tasks = await getTasks({status: "PAUSED"});
        const req = lastRequest("GET");
        expect(req?.path).toBe("/v1/ayaan/tasks");
        expect(req?.query.get("status")).toBe("PAUSED");
        expect(tasks).toEqual([]);
    });
});
