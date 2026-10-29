export default function LoadingSkeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

export function JobCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <LoadingSkeleton className="h-5 w-3/4" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
        <LoadingSkeleton className="h-8 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-5/6" />
    </div>
  );
}

export function PageSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

