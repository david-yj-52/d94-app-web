export type MilestoneStatus = "OPEN" | "CLOSED";

export interface MilestoneResponse {
    id: string;
    name: string;
    description: string | null;
    dueDate: string | null;
    status: MilestoneStatus;
    projectId: string;
}

export interface MilestoneProgressResponse {
    milestoneId: string;
    total: number;
    completed: number;
    percentage: number;
}

export interface CreateMilestoneRequest {
    name: string;
    description?: string;
    dueDate?: string;
    status?: MilestoneStatus;
}

export interface UpdateMilestoneRequest {
    name?: string;
    description?: string;
    dueDate?: string;
    status?: MilestoneStatus;
}
