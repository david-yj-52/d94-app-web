export interface BurndownPoint {
    date: string;
    remainingPoints: number;
}

export interface BurndownResponse {
    sprintName: string;
    startDate: string;
    endDate: string;
    totalPoints: number;
    idealBurndown: BurndownPoint[];
    actualBurndown: BurndownPoint[];
}

export interface VelocityEntry {
    sprintName: string;
    committed: number;
    completed: number;
    velocity: number;
}

export interface CfdResponse {
    dates: string[];
    statuses: string[];
    data: Record<string, number[]>;
}

export interface DashboardIssue {
    id: string;
    issueKey: string;
    title: string;
    status: string;
    statusNm?: string;
    priority: string;
    dueDate?: string;
    projectName?: string;
    assignee?: { name: string; email: string };
}

export interface ActivityItem {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    issueKey?: string;
    issueTitle?: string;
}

export interface SprintProgress {
    sprintName?: string;
    totalIssues: number;
    completedIssues: number;
    inProgressIssues: number;
}

export interface DashboardResponse {
    assignedIssues: DashboardIssue[];
    recentActivity: ActivityItem[];
    upcomingDeadlines: DashboardIssue[];
    sprintProgress: SprintProgress;
}
