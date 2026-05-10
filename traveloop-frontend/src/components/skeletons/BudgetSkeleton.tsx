import Skeleton from "react-loading-skeleton";

export default function BudgetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton height={80} width={200} borderRadius={14} />
        <Skeleton height={80} width={200} borderRadius={14} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton height={220} borderRadius={14} />
        <Skeleton height={220} borderRadius={14} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border border-[var(--border)] rounded-[var(--radius-md)]">
            <Skeleton height={16} width={80} />
            <Skeleton height={16} width="40%" className="flex-1" />
            <Skeleton height={16} width={60} />
          </div>
        ))}
      </div>
    </div>
  );
}
