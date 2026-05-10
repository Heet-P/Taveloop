import Skeleton from "react-loading-skeleton";

export default function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-[var(--radius-md)]">
          <Skeleton width={44} height={44} borderRadius={10} />
          <div className="flex-1 space-y-1.5">
            <Skeleton height={16} width="65%" />
            <Skeleton height={13} width="40%" />
          </div>
          <Skeleton height={32} width={60} borderRadius={8} />
        </div>
      ))}
    </div>
  );
}
