import Skeleton from "react-loading-skeleton";

export default function ChecklistSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={10} borderRadius={999} />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={34} width={90} borderRadius={999} />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-[var(--radius-md)]">
            <Skeleton width={20} height={20} borderRadius={4} />
            <Skeleton height={16} width="60%" />
          </div>
        ))}
      </div>
    </div>
  );
}
