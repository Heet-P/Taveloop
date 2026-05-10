import Skeleton from "react-loading-skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        <Skeleton circle width={80} height={80} />
        <div className="space-y-2">
          <Skeleton height={22} width={200} />
          <Skeleton height={14} width={140} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton height={60} borderRadius={14} />
        <Skeleton height={60} borderRadius={14} />
      </div>
      <div>
        <Skeleton height={20} width={160} className="mb-3" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width={180} height={140} borderRadius={14} />
          ))}
        </div>
      </div>
    </div>
  );
}
