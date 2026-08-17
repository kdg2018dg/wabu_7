import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-24 w-full" />
      <SkeletonList rows={3} rowHeight={56} />
    </div>
  );
}
