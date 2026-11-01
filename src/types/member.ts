export type ProjectRole = "ADMIN" | "MEMBER";

export interface ProjectMemberResponse {
    userId: string;
    email: string;
    userNm: string;
    avatarUrl?: string;
    role: ProjectRole;
}

export interface AddMemberRequest {
    email: string;
    role: ProjectRole;
}

export interface UpdateMemberRoleRequest {
    role: ProjectRole;
}
