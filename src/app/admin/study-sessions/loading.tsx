import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-4 h-6 w-56" />
      <SkeletonList rows={5} rowHeight={110} />
    </div>
  );
}
