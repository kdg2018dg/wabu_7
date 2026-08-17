import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-5 pb-6 pt-6">
      <Skeleton className="mb-4 h-5 w-24" />
      <Skeleton className="mb-3 h-12 w-full" />
      <SkeletonList rows={4} rowHeight={96} />
    </div>
  );
}
