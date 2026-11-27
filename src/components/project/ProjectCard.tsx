import type {ProjectResponse} from "@/types/project";
import Link from "next/link";

interface Props {
    project: ProjectResponse;
}

export default function ProjectCard({project}: Props) {
    return (
        <Link href={`/cira/projects/${project.id}/issues`}>
            <div
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest">
            {project.key}
          </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-d94-brand mb-1">
                    {project.name}
                </h3>
                {project.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">
                        {project.description}
                    </p>
                )}
                <div className="mt-4 text-xs text-slate-400">
                    Task {project.issueSequence ?? 0}개
                </div>
            </div>
        </Link>
    );
}
