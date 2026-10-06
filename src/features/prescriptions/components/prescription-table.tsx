"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { IoChevronDown } from "react-icons/io5";
import PaginationSearchBar from "@/components/ui/PaginationSearchBar";

import { deletePrescription } from "@/features/prescriptions/actions";

interface PrescriptionListItem {
  id: string;
  patientName: string;
  patientImage: string | null;
  prescribedOn: string; // formatted for display, e.g. "11/08/2026"
  prescribedOnRaw: string; // ISO date string, used for sorting/filtering
}

interface PrescriptionTableProps {
  prescriptions: PrescriptionListItem[];
}

type SortOption = "recent" | "oldest" | "name";

const MENU_WIDTH = 224; // matches w-56
const MENU_HEIGHT = 160;
const MENU_GAP = 8;

// ---------------------------------------
// Closes a dropdown when the user clicks outside it or presses Escape.
// Used by the Export / Filters / Sort menus, which stay in normal flow
// (no clipping risk, so no portal needed for these).
// ---------------------------------------
function useClickOutside<T extends HTMLElement>(
  active: boolean,
  onOutside: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;

    function handlePointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOutside();
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [active, onOutside]);

  return ref;
}

// ---------------------------------------
// Row actions menu. Rendered through a portal to document.body so it can
// never be clipped by the table's overflow-x-auto wrapper, and positioned
// with a fixed rect computed off the trigger button.
// ---------------------------------------
function RowActionsMenu({
  isOpen,
  onOpen,
  onClose,
  onView,
  onEdit,
  onDelete,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const placeAbove = MENU_HEIGHT > spaceBelow && spaceAbove > spaceBelow;
    const availableHeight = Math.max(placeAbove ? spaceAbove : spaceBelow, 0);
    const menuHeight = Math.min(MENU_HEIGHT, availableHeight);

    setPosition({
      top: placeAbove
        ? Math.max(MENU_GAP, rect.top - MENU_GAP - menuHeight)
        : Math.min(
            rect.bottom + MENU_GAP,
            window.innerHeight - menuHeight - MENU_GAP,
          ),
      left: Math.max(
        MENU_GAP,
        Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - MENU_GAP),
      ),
      maxHeight: availableHeight,
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    // Closing on scroll/resize is simpler and more robust than tracking a
    // repositioning loop, and matches how most dropdown libraries behave.
    function handleDismiss() {
      onClose();
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Prescription actions"
        onClick={() => (isOpen ? onClose() : onOpen())}
        className="rounded-lg border border-border bg-background p-2 text-foreground transition hover:bg-hover focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <FiMoreVertical size={18} />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              top: position.top,
              left: position.left,
              maxHeight: position.maxHeight,
            }}
            className="fixed z-9999 w-56 overflow-y-auto rounded-xl border border-border bg-background py-2 shadow-lg ring-1 ring-black/5"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-foreground transition hover:bg-hover"
              onClick={() => {
                onView();
                onClose();
              }}
            >
              <FiEye size={17} />
              View
            </button>

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-foreground transition hover:bg-hover"
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              <FiEdit2 size={17} />
              Edit
            </button>

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <FiTrash2 size={17} />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default function PrescriptionTable({
  prescriptions,
}: PrescriptionTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const exportRef = useClickOutside<HTMLDivElement>(showExportMenu, () =>
    setShowExportMenu(false),
  );
  const filterRef = useClickOutside<HTMLDivElement>(showFilterMenu, () =>
    setShowFilterMenu(false),
  );
  const sortRef = useClickOutside<HTMLDivElement>(showSortMenu, () =>
    setShowSortMenu(false),
  );

  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<PrescriptionListItem | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortLabels: Record<SortOption, string> = {
    recent: "Recent",
    oldest: "Oldest",
    name: "Patient Name (A-Z)",
  };

  // ---------------------------------------
  // Filter + Sort (derived, no extra state needed)
  // ---------------------------------------
  const visiblePrescriptions = useMemo(() => {
    let result = [...prescriptions];

    if (appliedDateFrom) {
      const from = new Date(appliedDateFrom).getTime();
      result = result.filter(
        (p) => new Date(p.prescribedOnRaw).getTime() >= from,
      );
    }

    if (appliedDateTo) {
      // include the whole "to" day
      const to = new Date(appliedDateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      result = result.filter(
        (p) => new Date(p.prescribedOnRaw).getTime() <= to,
      );
    }

    result = [...result].sort((a, b) => {
      if (sortOption === "name") {
        return a.patientName.localeCompare(b.patientName);
      }
      const aTime = new Date(a.prescribedOnRaw).getTime();
      const bTime = new Date(b.prescribedOnRaw).getTime();
      return sortOption === "recent" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [prescriptions, appliedDateFrom, appliedDateTo, sortOption]);

  const hasActiveFilter = Boolean(appliedDateFrom || appliedDateTo);

  // ---------------------------------------
  // Export
  // ---------------------------------------
  function exportToCSV() {
    const headers = ["Prescription ID", "Patient", "Prescribed On"];
    const rows = visiblePrescriptions.map((p) => [
      p.id,
      p.patientName,
      p.prescribedOn,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `prescriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }

  function exportToPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = visiblePrescriptions
      .map(
        (p) =>
          `<tr><td>${p.id}</td><td>${p.patientName}</td><td>${p.prescribedOn}</td></tr>`,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescriptions</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 14px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Prescriptions</h2>
          <table>
            <thead><tr><th>Prescription ID</th><th>Patient</th><th>Prescribed On</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setShowExportMenu(false);
  }

  // ---------------------------------------
  // Filter apply/clear
  // ---------------------------------------
  function applyFilters() {
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setShowFilterMenu(false);
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setShowFilterMenu(false);
  }

  // ---------------------------------------
  // Delete
  // ---------------------------------------
  function confirmDelete() {
    if (!deleteTarget) return;

    setDeleteError(null);

    startTransition(async () => {
      const result = await deletePrescription(deleteTarget.id);

      if (!result?.success) {
        setDeleteError(result?.message ?? "Failed to delete prescription.");
        return;
      }

      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 rounded-xl border border-border bg-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">Prescriptions</h2>

        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setShowExportMenu((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-hover focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            Export
            <IoChevronDown
              size={16}
              className={`transition-transform ${
                showExportMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg ring-1 ring-black/5">
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-hover"
                onClick={exportToPDF}
              >
                Download As PDF
              </button>

              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-hover"
                onClick={exportToCSV}
              >
                Download As Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <PaginationSearchBar placeholder="Search prescriptions" />
        </div>

        <div className="flex flex-wrap gap-3 md:justify-end">
          {/* Filters */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setShowFilterMenu((v) => !v)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-hover focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                hasActiveFilter
                  ? "border-indigo-500 text-indigo-600"
                  : "border-border bg-background text-foreground"
              }`}
            >
              <FiFilter size={15} />
              Filters
              {hasActiveFilter && (
                <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  1
                </span>
              )}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-border bg-background p-4 shadow-lg ring-1 ring-black/5">
                <p className="mb-3 text-sm font-medium text-foreground">Prescribed On</p>

                <label className="mb-1 block text-xs text-muted">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

                <label className="mb-1 block text-xs text-muted">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />

                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-hover"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setShowSortMenu((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-hover focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              Sort By : {sortLabels[sortOption]}
              <IoChevronDown
                size={16}
                className={`transition-transform ${
                  showSortMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg ring-1 ring-black/5">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-hover ${
                      sortOption === option ? "font-medium text-indigo-600" : "text-foreground"
                    }`}
                    onClick={() => {
                      setSortOption(option);
                      setShowSortMenu(false);
                    }}
                  >
                    {sortLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-y border-border bg-hover">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Prescription ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Patient</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Prescribed On</th>
              <th className="w-20"></th>
            </tr>
          </thead>

          <tbody>
            {visiblePrescriptions.map((prescription) => (
              <tr key={prescription.id} className="border-b border-border transition hover:bg-hover/60">
                <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-foreground">#{prescription.id}</td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    {prescription.patientImage ? (
                      <img
                        src={prescription.patientImage}
                        alt={prescription.patientName}
                        width={42}
                        height={42}
                        className="h-10.5 w-10.5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10.5 w-10.5 items-center justify-center rounded-full bg-hover text-sm font-semibold text-muted">
                        ?
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/doctor/prescriptions/${prescription.id}`)
                      }
                      className="cursor-pointer text-sm font-medium text-foreground transition hover:text-indigo-600"
                    >
                      {prescription.patientName}
                    </button>
                  </div>
                </td>

                <td className="whitespace-nowrap px-6 py-5 text-sm text-muted">{prescription.prescribedOn}</td>

                <td className="px-6 py-5 text-center">
                  <RowActionsMenu
                    isOpen={openMenuId === prescription.id}
                    onOpen={() => setOpenMenuId(prescription.id)}
                    onClose={() => setOpenMenuId(null)}
                    onView={() =>
                      router.push(`/doctor/prescriptions/${prescription.id}`)
                    }
                    onEdit={() =>
                      router.push(
                        `/doctor/prescriptions/${prescription.id}/edit`,
                      )
                    }
                    onDelete={() => {
                      setDeleteTarget(prescription);
                      setDeleteError(null);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visiblePrescriptions.length === 0 && (
          <div className="p-8 text-center text-sm text-muted">No prescriptions found.</div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-background p-4 shadow-xl sm:p-6">
            <h3 className="text-lg font-semibold text-foreground">Delete prescription?</h3>
            <p className="mt-2 text-sm text-muted">
              This will permanently delete prescription{" "}
              <span className="font-medium text-foreground">#{deleteTarget.id}</span>{" "}
              for {deleteTarget.patientName}. This action can&apos;t be undone.
            </p>

            {deleteError && (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="rounded-lg px-4 py-2 text-sm text-foreground transition hover:bg-hover disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
