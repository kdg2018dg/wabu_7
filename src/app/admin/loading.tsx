import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-24" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
