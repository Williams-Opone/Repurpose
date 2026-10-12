import { ExternalLink } from "lucide-react";

import { RelativeTime } from "@/components/relative-time";
import { cn } from "@/lib/utils";

import type { InvoiceSummary } from "../provider";

export function InvoiceList({ invoices }: { invoices: InvoiceSummary[] }) {
  if (invoices.length === 0) return <p className="text-sm text-fg-2">No invoices yet.</p>;

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <ul className="flex flex-col divide-y divide-line">
      {invoices.map((inv) => (
        <li key={inv.id} className="flex items-center gap-4 py-3 text-sm">
            <RelativeTime date={inv.created} className="text-fg-1" />
          <span className="ml-auto font-mono tabular-nums">{money(inv.amount, inv.currency)}</span>
          <span
            className={cn(
              "w-16 font-mono text-xs",
              inv.status === "paid"
                ? "text-success"
                : inv.status === "failed"
                  ? "text-danger"
                  : "text-fg-2",
            )}
          >
            {inv.status}
          </span>
          {inv.receiptUrl && (
            <a
              href={inv.receiptUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Receipt"
              className="text-fg-2 hover:text-fg-0"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
