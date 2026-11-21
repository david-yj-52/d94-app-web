export interface ProjectResponse {
    id: string;
    key: string;
    name: string;
    description: string;
    projectType: string;
    ownerId: string;
    issueSequence: number;
}

export interface CreateProjectRequest {
    key: string;
    name: string;
    description?: string;
    projectType: string;
}

export interface UpdateProjectRequest {
    name: string;
    description?: string;
    projectType: string;
}
