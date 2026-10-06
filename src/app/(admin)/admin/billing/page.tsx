import Button from "@/components/ui/button";
import { getInvoicesAction } from "@/features/billing/actions";
import BillingTable from "@/features/billing/component/billing-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";

export default async function BillingPage() {
  await connection();
  const invoices = await getInvoicesAction();

  return (
    <div className="w-full text-foreground">
      {/* Header */}
      <div
        className="
          mb-6
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="min-w-0">
          {/* Back Link */}
          <Link
            href="/admin/billing"
            className="
              mb-3
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-foreground
              transition-colors
              hover:text-[#2E37A4]
              sm:text-base
            "
          >
            <ArrowLeft size={18} strokeWidth={2} />

            <span>Invoices</span>
          </Link>

          {/* Title + Total */}
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className="
                text-xl
                font-semibold
                text-foreground
                sm:text-2xl
              "
            >
              Invoices
            </h1>

            <span
              className="
                rounded-md
                border
                border-[#2E37A4]
                bg-[#EEF2FF]
                px-2.5
                py-1
                text-xs
                font-medium
                text-[#2E37A4]
                dark:border-[#6366F1]
                dark:bg-[#1E1B4B]
                dark:text-[#A5B4FC]
                sm:px-3
                sm:py-1.5
                sm:text-sm
              "
            >
              Total Invoices: {invoices.length}
            </span>
          </div>

          {/* Description */}
          <p className="mt-1 text-sm text-muted">
            Hospital invoices and financial records.
          </p>
        </div>

        {/* New Invoice Button */}
        <Link href="/admin/billing/new" className="w-full sm:w-auto">
          <Button variant="primary" text="+ New Invoice" />
        </Link>
      </div>

      {/* Invoice Table */}
      <BillingTable invoices={invoices} />
    </div>
  );
}
