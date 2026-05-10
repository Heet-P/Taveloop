import Skeleton from "react-loading-skeleton";

export default function ItinerarySkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton circle width={36} height={36} />
            <Skeleton height={22} width={180} />
          </div>
          <div className="ml-9 space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-[var(--radius-md)]">
                <Skeleton width={40} height={40} borderRadius={8} />
                <div className="flex-1">
                  <Skeleton height={16} width="60%" />
                  <Skeleton height={13} width="40%" className="mt-1" />
                </div>
                <Skeleton height={16} width={60} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
