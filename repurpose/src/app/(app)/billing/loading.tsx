import { Topbar } from "@/components/layout/topbar";
import { Shimmer } from "@/components/motion/shimmer";

export default function BillingLoading() {
  return (
    <>
      <Topbar title="Billing" />
      <main className="flex-1 p-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <Shimmer className="h-12 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Shimmer className="h-72 rounded-lg" />
            <Shimmer className="h-72 rounded-lg" />
          </div>
        </div>
      </main>
    </>
  );
}
