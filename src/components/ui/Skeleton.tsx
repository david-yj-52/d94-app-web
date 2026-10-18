export function Skeleton({className = ""}: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-slate-200 rounded ${className}`}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <Skeleton className="h-5 w-1/3"/>
            <Skeleton className="h-4 w-1/5"/>
            <Skeleton className="h-4 w-2/3"/>
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
            <Skeleton className="h-4 w-20"/>
            <Skeleton className="h-4 flex-1"/>
            <Skeleton className="h-5 w-16 rounded-full"/>
            <Skeleton className="h-4 w-12"/>
            <Skeleton className="h-4 w-24"/>
        </div>
    );
}
