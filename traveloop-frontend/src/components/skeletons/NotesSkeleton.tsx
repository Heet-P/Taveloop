import Skeleton from "react-loading-skeleton";

export default function NotesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 border border-[var(--border)] rounded-[var(--radius-lg)] space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton height={22} width={80} borderRadius={999} />
            <Skeleton height={13} width={100} />
          </div>
          <Skeleton height={14} count={2} />
          <Skeleton height={14} width="60%" />
        </div>
      ))}
    </div>
  );
}
