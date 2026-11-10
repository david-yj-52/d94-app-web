import {SkeletonRow} from "@/components/ui/Skeleton";

export default function CiraLoading() {
    return (
        <div className="space-y-2 px-4 md:px-6">
            {Array.from({length: 6}, (_, i) => <SkeletonRow key={i}/>)}
        </div>
    );
}
