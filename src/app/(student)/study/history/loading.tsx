import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-5 pb-6 pt-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <SkeletonList rows={5} rowHeight={88} />
    </div>
  );
}
