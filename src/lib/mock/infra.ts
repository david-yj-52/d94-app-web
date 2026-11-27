// infra mock — router.ts 가 registerInfraMock(on) 으로 등록한다. dev 서버 재시작 시 초기화.
// ponytail: 수집·집계는 d94-query 만 한다 — mock 은 시드 노드 2개(delap 온라인, jetson 예정)와 CRUD 만.
import type {MockResult} from "./router";
import type {InfraMetric, InfraNode, InfraService, NodeSummary} from "@/types/infra";
import {emptyNode} from "@/types/infra";

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: Record<string, unknown> };
type On = (method: string, pattern: string, h: (ctx: Ctx) => MockResult | Promise<MockResult>) => void;

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const fail = (status: number, message: string): MockResult => ({status, body: {success: false, message}});

const metric = (nodeId: number, minutesAgo: number): InfraMetric => ({
    id: nodeId * 1000 + minutesAgo, nodeId, collectedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    cpuPct: 10 + (minutesAgo % 7) * 3, memUsedMb: 4200, memAvailableMb: 27000, memPct: 15 + (minutesAgo % 5),
    swapUsedMb: 0, diskUsedGb: 210, diskPct: 45, gpuUtilPct: null, gpuMemUsedMb: null, loadAvg1m: 0.8,
    uptimeSec: 86400 * 3, extraJson: null,
});

type Store = { nodes: InfraNode[]; services: InfraService[]; seq: number };
const g = globalThis as unknown as { __infraMock?: Store };
const store = (): Store => (g.__infraMock ??= {
    seq: 3,
    nodes: [
        {...emptyNode(), id: 1, nodeKey: "delap", name: "delap", status: "ACTIVE", osInfo: "Ubuntu 24.04", cpuCores: 20,
            memoryTotalMb: 31762, diskTotalGb: 468, sshAlias: "delap", sshKeyHint: "~/.ssh/delap", lastSeenAt: new Date().toISOString()},
        {...emptyNode(), id: 2, nodeKey: "jetson-01", name: "Jetson (Ollama)", nodeType: "EDGE_GPU", gpuModel: "Jetson Orin"},
    ],
    services: [{id: 1, nodeId: 1, name: "d94-query", kind: "DOCKER", portsText: "8080", endpointUrl: null,
        composePath: "/home/delapp/data/app/query", estimatedMemMb: 1024, description: null}],
});

const summary = (n: InfraNode): NodeSummary => {
    const latest = n.lastSeenAt ? metric(n.id!, 0) : null;
    return {node: n, latest, online: !!latest, memFreeMb: latest?.memAvailableMb ?? null, gpuMemFreeMb: null};
};
const find = (key: string) => store().nodes.find((n) => n.nodeKey === key);

export function registerInfraMock(on: On) {
    on("GET", "/v1/infra/nodes", () => ok(store().nodes.map(summary)));
    on("GET", "/v1/infra/nodes/:key", ({params}) => {
        const n = find(params.key);
        if (!n) return fail(404, "존재하지 않습니다.");
        return ok({
            summary: summary(n),
            services: store().services.filter((s) => s.nodeId === n.id),
            processes: n.lastSeenAt ? [{pid: null, procName: "d94-query", procType: "CONTAINER", memRssMb: 812, memPct: 2.5, cpuPct: 1.2, commandLine: "ghcr.io/…/d94-app-query"}] : [],
        });
    });
    on("GET", "/v1/infra/nodes/:key/metrics", ({params}) => {
        const n = find(params.key);
        return ok(n?.lastSeenAt ? Array.from({length: 60}, (_, i) => metric(n.id!, 59 - i)) : []);
    });
    on("POST", "/v1/infra/nodes", ({body}) => {
        const s = store();
        const n = {...emptyNode(), ...body, id: s.seq++} as InfraNode;
        if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(n.nodeKey)) return fail(400, "nodeKey 는 소문자·숫자·- 로 50자 이내입니다.");
        if (find(n.nodeKey)) return fail(409, "같은 키의 노드가 이미 있습니다.");
        s.nodes.push(n);
        return ok(summary(n));
    });
    on("PUT", "/v1/infra/nodes/:key", ({params, body}) => {
        const n = find(params.key);
        if (!n) return fail(404, "존재하지 않습니다.");
        Object.assign(n, body, {id: n.id, nodeKey: n.nodeKey, lastSeenAt: n.lastSeenAt});
        return ok(summary(n));
    });
    on("DELETE", "/v1/infra/nodes/:key", ({params}) => {
        const s = store();
        s.nodes = s.nodes.filter((n) => n.nodeKey !== params.key);
        return {status: 204};
    });
    on("POST", "/v1/infra/nodes/:key/services", ({params, body}) => {
        const n = find(params.key);
        if (!n) return fail(404, "존재하지 않습니다.");
        const svc = {...body, id: store().seq++, nodeId: n.id} as InfraService;
        store().services.push(svc);
        return ok(svc);
    });
    on("PUT", "/v1/infra/nodes/:key/services/:id", ({params, body}) => {
        const svc = store().services.find((s) => s.id === Number(params.id));
        if (!svc) return fail(404, "존재하지 않습니다.");
        Object.assign(svc, body, {id: svc.id, nodeId: svc.nodeId});
        return ok(svc);
    });
    on("DELETE", "/v1/infra/nodes/:key/services/:id", ({params}) => {
        const s = store();
        s.services = s.services.filter((x) => x.id !== Number(params.id));
        return {status: 204};
    });
}
