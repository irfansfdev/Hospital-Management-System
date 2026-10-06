import { getPaymentsAction } from "@/features/billing/actions";
import PaymentsTable from "@/features/billing/component/payments-table";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";

export default async function PaymentsPage() {
  await connection();
  const payments = await getPaymentsAction();

  return (
    <div className="w-full px-3 sm:px-4 lg:px-0">
      {/* HEADER */}
      <div
        className="
          mb-5
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
            sm:gap-3
          "
        >
          <Link
            href="/admin"
            className="
              flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-md
              border border-[#E7E8EB]
              bg-white
              text-gray-500
              transition
              hover:bg-gray-50
              hover:text-[#2E37A4]
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-400
              dark:hover:bg-gray-700
              dark:hover:text-indigo-400
            "
          >
            <ArrowLeft size={16} />
          </Link>

          <div
            className="
              flex
              min-w-0
              flex-wrap
              items-center
              gap-2
            "
          >
            <h1
              className="
                text-lg
                font-semibold
                text-[#0A1B39]
                sm:text-[20px]
                dark:text-white
              "
            >
              Payments
            </h1>

            <span
              className="
                whitespace-nowrap
                rounded
                border border-[#2E37A4]
                bg-[#EEF2FF]
                px-2 py-0.5
                text-[10px]
                font-medium
                text-[#2E37A4]
                dark:border-indigo-500/40
                dark:bg-indigo-500/10
                dark:text-indigo-400
              "
            >
              Total Payments : {payments.length}
            </span>
          </div>
        </div>
      </div>

      {/* TABLE */}

      <div className="w-full">
        <PaymentsTable payments={payments} />
      </div>

      {/* FOOTER */}

      <div
        className="
          mt-4
          border-t border-[#E7E8EB]
          pt-3
          text-center
          dark:border-gray-700
        "
      >
        <p
          className="
            text-[10px]
            text-gray-400
            dark:text-gray-500
          "
        >
          2025 © Preclinic, All Rights Reserved
        </p>
      </div>
    </div>
  );
}
