import { Skeleton } from "@/components/ui/skeleton";

export default function PrescriptionsLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-zinc-200" />
        <Skeleton className="h-4 w-96 bg-zinc-200" />
      </div>

      {/* Cards List Skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col sm:flex-row h-auto sm:h-44 shadow-sm"
          >
            {/* Image Placeholder */}
            <div className="sm:w-48 h-32 sm:h-auto bg-zinc-100 shrink-0 border-r border-zinc-200" />

            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-40 bg-zinc-200" />
                    <Skeleton className="h-4 w-52 bg-zinc-100" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full bg-amber-100" />
                </div>
                <Skeleton className="h-4 w-3/4 mt-3 bg-zinc-100" />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <Skeleton className="h-4 w-28 bg-zinc-100" />
                <Skeleton className="h-9 w-36 rounded-md bg-zinc-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
