import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-5 pb-6 pt-6">
      <Skeleton className="mb-4 h-5 w-40" />
      <Skeleton className="mb-2 h-4 w-24" />
      <SkeletonList rows={2} rowHeight={72} />
      <Skeleton className="mb-2 mt-5 h-4 w-32" />
      <SkeletonList rows={4} rowHeight={56} />
    </div>
  );
}
