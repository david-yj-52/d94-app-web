import {project} from "@/test/msw/fixtures";
import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {createProject, getProject, getProjects, updateProject} from "./projects";

describe("lib/api/projects", () => {
    it("getProjects: 목록을 그대로 돌려준다", async () => {
        expect(await getProjects()).toEqual([project]);
        expect(lastRequest()).toMatchObject({method: "GET", path: "/v1/projects"});
    });

    it("getProject: 단건 경로", async () => {
        expect((await getProject("PRJ-1")).key).toBe("CIRA");
        expect(lastRequest()?.path).toBe("/v1/projects/PRJ-1");
    });

    it("createProject / updateProject: 본문을 그대로 보낸다", async () => {
        await createProject({key: "NEW", name: "새 프로젝트", projectType: "SCRUM"});
        expect(lastRequest()).toMatchObject({
            method: "POST", path: "/v1/projects", body: {key: "NEW", name: "새 프로젝트", projectType: "SCRUM"},
        });

        const updated = await updateProject("PRJ-1", {name: "바뀐 이름", projectType: "KANBAN"});
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/projects/PRJ-1"});
        expect(updated.name).toBe("바뀐 이름");
    });
});
