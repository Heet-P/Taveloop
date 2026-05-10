import Skeleton from "react-loading-skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton height={220} borderRadius={20} />
      <div>
        <Skeleton height={24} width={160} className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton height={140} borderRadius={14} />
              <Skeleton height={16} width="60%" />
              <Skeleton height={13} width="40%" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton height={24} width={180} className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={100} borderRadius={14} />
          ))}
        </div>
      </div>
    </div>
  );
}
