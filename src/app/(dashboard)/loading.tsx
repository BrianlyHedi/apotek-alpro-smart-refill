import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-zinc-200" />
        <Skeleton className="h-4 w-96 bg-zinc-200" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-28 bg-zinc-200" />
          <Skeleton className="h-8 w-16 bg-zinc-200" />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-32 bg-zinc-200" />
          <Skeleton className="h-8 w-20 bg-zinc-200" />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-24 bg-zinc-200" />
          <Skeleton className="h-8 w-12 bg-zinc-200" />
        </div>
      </div>

      {/* Main Content Card Skeleton */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <Skeleton className="h-6 w-48 bg-zinc-200" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg bg-zinc-100" />
          <Skeleton className="h-16 w-full rounded-lg bg-zinc-100" />
          <Skeleton className="h-16 w-full rounded-lg bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
