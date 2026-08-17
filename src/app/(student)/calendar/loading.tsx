import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="px-5 pb-6 pt-6">
      <Skeleton className="mb-2 h-5 w-40" />
      <Skeleton className="mb-4 h-4 w-64" />
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
