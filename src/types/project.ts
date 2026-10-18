export interface ProjectResponse {
    id: string;
    key: string;
    name: string;
    description: string;
    projectType: "SCRUM" | "KANBAN";
    ownerId: string;
    issueSequence: number;
}

export interface CreateProjectRequest {
    key: string;
    name: string;
    description?: string;
    projectType: "SCRUM" | "KANBAN";
}

export interface UpdateProjectRequest {
    name: string;
    description?: string;
    projectType: "SCRUM" | "KANBAN";
}
