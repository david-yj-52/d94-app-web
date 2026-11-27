// d94-query /api/v1/infra (InfraDtos) 와 짝

export type NodeType = "HOME_PC" | "CLOUD_VM" | "EDGE_GPU" | "MCU" | "SERVERLESS";
export type NodeLocation = "HOME_LAN" | "OCI" | "VERCEL";
export type NodeStatus = "ACTIVE" | "PLANNED" | "MAINTENANCE";
export type ServiceKind = "DOCKER" | "SYSTEMD" | "FIRMWARE" | "HOSTED";
export type MetricRange = "1h" | "6h" | "24h" | "7d";

/** 장비 스펙·접속 가이드. 비밀번호·개인키 필드는 일부러 없다 */
export interface InfraNode {
    id: number | null;
    nodeKey: string;
    name: string;
    nodeType: NodeType;
    location: NodeLocation;
    status: NodeStatus;
    osInfo: string | null;
    cpuModel: string | null;
    cpuCores: number | null;
    memoryTotalMb: number | null;
    gpuModel: string | null;
    gpuMemoryMb: number | null;
    diskTotalGb: number | null;
    specsExtraJson: string | null;
    hostLabel: string | null;
    sshAlias: string | null;
    sshUser: string | null;
    sshPort: number | null;
    sshKeyHint: string | null;
    accessNotes: string | null;
    lastSeenAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface InfraMetric {
    id: number | null;
    nodeId: number;
    collectedAt: string;
    cpuPct: number | null;
    memUsedMb: number | null;
    memAvailableMb: number | null;
    memPct: number | null;
    swapUsedMb: number | null;
    diskUsedGb: number | null;
    diskPct: number | null;
    gpuUtilPct: number | null;
    gpuMemUsedMb: number | null;
    loadAvg1m: number | null;
    uptimeSec: number | null;
    /** ESP32 free_heap_kb·wifi_rssi, Vercel 배포 요약 등 (JSON 문자열) */
    extraJson: string | null;
}

export interface InfraService {
    id: number | null;
    nodeId: number | null;
    name: string;
    kind: ServiceKind;
    portsText: string | null;
    endpointUrl: string | null;
    composePath: string | null;
    estimatedMemMb: number | null;
    description: string | null;
}

export interface InfraProcess {
    pid: number | null;
    procName: string;
    procType: "PROCESS" | "CONTAINER";
    memRssMb: number | null;
    memPct: number | null;
    cpuPct: number | null;
    commandLine: string | null;
}

export interface NodeSummary {
    node: InfraNode;
    latest: InfraMetric | null;
    /** LAST_SEEN_AT 3분 이내 */
    online: boolean;
    memFreeMb: number | null;
    gpuMemFreeMb: number | null;
}

export interface NodeDetail {
    summary: NodeSummary;
    services: InfraService[];
    processes: InfraProcess[];
}

export const NODE_TYPE_LABEL: Record<NodeType, string> = {
    HOME_PC: "홈 PC", CLOUD_VM: "클라우드 VM", EDGE_GPU: "엣지 GPU", MCU: "MCU", SERVERLESS: "서버리스",
};
export const LOCATION_LABEL: Record<NodeLocation, string> = {HOME_LAN: "Home", OCI: "OCI", VERCEL: "Vercel"};
export const STATUS_LABEL: Record<NodeStatus, string> = {ACTIVE: "운영", PLANNED: "예정", MAINTENANCE: "점검"};
export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
    DOCKER: "Docker", SYSTEMD: "systemd", FIRMWARE: "펌웨어", HOSTED: "호스팅",
};

/** 새 노드 폼 기본값 */
export const emptyNode = (): InfraNode => ({
    id: null, nodeKey: "", name: "", nodeType: "HOME_PC", location: "HOME_LAN", status: "PLANNED",
    osInfo: null, cpuModel: null, cpuCores: null, memoryTotalMb: null, gpuModel: null, gpuMemoryMb: null,
    diskTotalGb: null, specsExtraJson: null, hostLabel: null, sshAlias: null, sshUser: null, sshPort: null,
    sshKeyHint: null, accessNotes: null, lastSeenAt: null, createdAt: null, updatedAt: null,
});
