export type VersionStatus = "PLANNING" | "ACTIVE" | "RELEASED" | "ARCHIVED";

export interface VersionResponse {
    id: string;
    projectId: string;
    versionName: string;
    description: string | null;
    status: VersionStatus;
    plannedReleaseDate: string | null;
    releasedAt: string | null;
}

export interface CreateVersionRequest {
    versionName: string;
    description?: string;
    plannedReleaseDate?: string;
}

export interface UpdateVersionRequest {
    versionName?: string;
    description?: string;
    plannedReleaseDate?: string;
}

export interface ReleaseNoteIssue {
    id: string;
    issueKey: string;
    title: string;
    issueTypeNm: string;
}

export interface ReleaseNoteGroup {
    category: string;
    issues: ReleaseNoteIssue[];
}

export interface ReleaseNotesResponse {
    versionName: string;
    groups: ReleaseNoteGroup[];
}
