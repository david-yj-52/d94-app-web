import type {ProjectResponse} from "@/types/project";
import Link from "next/link";

interface Props {
    project: ProjectResponse;
}

const TYPE_COLORS: Record<string, string> = {
    SCRUM: "bg-blue-100 text-blue-700",
    KANBAN: "bg-purple-100 text-purple-700",
};

export default function ProjectCard({project}: Props) {
    return (
        <Link href={`/projects/${project.id}/issues`}>
            <div
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest">
            {project.key}
          </span>
                    <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[project.projectType] ?? "bg-slate-100 text-slate-600"}`}
                    >
            {project.projectType}
          </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 mb-1">
                    {project.name}
                </h3>
                {project.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">
                        {project.description}
                    </p>
                )}
                <div className="mt-4 text-xs text-slate-400">
                    이슈 {project.issueSequence ?? 0}개
                </div>
            </div>
        </Link>
    );
}
