import Link from "next/link";
import type {ReactNode} from "react";

export default function PageHeader({breadcrumbs = [], title, actions}: {
    breadcrumbs?: { label: string; href?: string }[];
    title: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
                {breadcrumbs.length > 0 && (
                    <nav className="mb-1 flex flex-wrap items-center gap-1 text-xs text-cira-muted">
                        {breadcrumbs.map((b, i) => (
                            <span key={i} className="flex items-center gap-1">
                                {i > 0 && <span>/</span>}
                                {b.href ? <Link href={b.href} className="hover:underline">{b.label}</Link> : b.label}
                            </span>
                        ))}
                    </nav>
                )}
                <h1 className="truncate text-xl font-semibold text-cira-text">{title}</h1>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
