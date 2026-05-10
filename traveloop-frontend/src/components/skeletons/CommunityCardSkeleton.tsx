import Skeleton from "react-loading-skeleton";

export default function CommunityCardSkeleton() {
  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
      <Skeleton height={150} borderRadius={0} />
      <div className="p-4 space-y-3">
        <Skeleton height={20} width="80%" />
        <div className="flex items-center gap-2">
          <Skeleton circle width={28} height={28} />
          <Skeleton height={14} width={100} />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={22} width={65} borderRadius={999} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Skeleton height={14} width={70} />
          <Skeleton height={32} width={90} borderRadius={8} />
        </div>
      </div>
    </div>
  );
}
