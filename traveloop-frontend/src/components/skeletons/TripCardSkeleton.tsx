import Skeleton from "react-loading-skeleton";

export default function TripCardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
      <Skeleton height={160} borderRadius={0} />
      <div className="p-4 space-y-3">
        <Skeleton height={20} width="70%" />
        <Skeleton height={14} width="50%" />
        <div className="flex gap-2">
          <Skeleton height={22} width={70} borderRadius={999} />
          <Skeleton height={22} width={80} borderRadius={999} />
        </div>
      </div>
    </div>
  );
}
