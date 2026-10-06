"use client";

import Image from "next/image";
import type { Doctor } from "@/features/doctors/types";
import { useState } from "react";
import { deleteDoctorAction } from "../actions";
import { MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/select";

type DoctorCardProps = {
  doctor: Doctor;
};

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const result = await deleteDoctorAction(doctor.id, doctor.profile_id);

      if (!result.success) {
        toast.error(result.error || "Unable to delete doctor.");

        setTimeout(() => {
          setDeleteModalOpen(false);
        }, 1000);

        return;
      }

      toast.success("Doctor deleted successfully.");

      setDeleteModalOpen(false);

      router.refresh();
    } catch (error) {
      console.error("DELETE DOCTOR ERROR:", error);

      toast.error("Something went wrong while deleting the doctor.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="
        rounded border border-slate-200 bg-white p-3 shadow-sm
        dark:border-[#2A3850] dark:bg-[#0A162A]
        sm:p-4
      "
    >
      <div className="flex min-w-0 flex-row items-start gap-3">
        {/* Doctor Image */}
        <div
          className="
            relative h-20 w-20 shrink-0 overflow-hidden rounded
            bg-slate-100
            dark:bg-[#1E293B]
            sm:h-24 sm:w-24 lg:h-28 lg:w-28
          "
        >
          <Image
            src={doctor.profile.avatar_url ?? "/default-doctor.png"}
            alt={doctor.profile.full_name}
            fill
            loading="eager"
            sizes="112px"
            className="object-contain"
          />
        </div>

        {/* Doctor Details */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {/* Name + Menu */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="
                    truncate text-sm font-semibold text-slate-900
                    dark:text-[#F1F5F9]
                    sm:text-base
                  "
                >
                  {doctor.profile.full_name}
                </h3>

                <p
                  className="
                    mt-0.5 truncate text-xs text-slate-500
                    dark:text-[#94A3B8]
                  "
                >
                  {doctor.specialization}
                </p>
              </div>

              {/* Menu */}
              <Dropdown>
                <Dropdown.Trigger
                  aria-label="Doctor actions"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white p-0 text-black hover:bg-gray-100 dark:border-[#3A4A63] dark:bg-[#0A162A] dark:text-[#CBD5E1] dark:hover:bg-[#18243A]"
                >
                  <MoreVertical className="h-3.5 w-3.5 text-gray-600 dark:text-[#CBD5E1]" />
                </Dropdown.Trigger>

                <Dropdown.Content
                  align="right"
                  className="w-36 overflow-hidden rounded-lg border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-[#334155] dark:bg-[#0A162A] dark:ring-white/5"
                >
                  <Dropdown.Item
                    onSelect={() => router.push(`/admin/doctors/${doctor.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-[#CBD5E1] dark:hover:bg-[#18243A]"
                  >
                    <Eye className="h-3.5 w-3.5 text-gray-500 dark:text-[#94A3B8]" />
                    <span>View</span>
                  </Dropdown.Item>

                  <Dropdown.Item
                    onSelect={() =>
                      router.push(`/admin/doctors/${doctor.id}/edit`)
                    }
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-[#CBD5E1] dark:hover:bg-[#18243A]"
                  >
                    <Pencil className="h-3.5 w-3.5 text-gray-500 dark:text-[#94A3B8]" />
                    <span>Edit</span>
                  </Dropdown.Item>

                  <Dropdown.Item
                    onSelect={() => setDeleteModalOpen(true)}
                    destructive
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="mt-2 space-y-1.5">
            <p
              className="
                min-w-0 break-words text-[11px] text-slate-500
                dark:text-[#94A3B8]
                sm:text-xs
              "
            >
              Qualification:
              <span
                className="
                  ml-1 font-medium text-slate-700
                  dark:text-[#CBD5E1]
                "
              >
                {doctor.qualification}
              </span>
            </p>

            <p
              className="
                text-[11px] text-slate-500
                dark:text-[#94A3B8]
                sm:text-xs
              "
            >
              Starts From:
              <span className="ml-1 font-semibold text-[#2E37A4] dark:text-[#818CF8]">
                Rs {doctor.consultation_fee}
              </span>
            </p>

            <div className="flex items-center justify-between">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium sm:text-[10px]
                  ${
                    doctor.status === "available"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                  }
                `}
              >
                {doctor.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 dark:bg-black/60">
          <div
            className="
              w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl
              dark:border dark:border-[#334155]
              dark:bg-[#111318]
            "
          >
            {/* Icon */}
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-[#0A1B39] dark:text-[#F1F5F9]">
              Delete Doctor?
            </h2>

            {/* Description */}
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-[#94A3B8]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700 dark:text-[#E2E8F0]">
                {doctor.profile.full_name}
              </span>
              ? This action cannot be undone.
            </p>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
                className="
                  rounded-lg border border-gray-200 bg-white px-4 py-2
                  text-sm font-medium text-gray-700 transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed disabled:opacity-50
                  dark:border-[#334155]
                  dark:bg-[#0A162A]
                  dark:text-[#CBD5E1]
                  dark:hover:bg-[#22304A]
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="
                  rounded-lg bg-red-600 px-4 py-2 text-sm font-medium
                  text-white transition hover:bg-red-700
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {deleting ? "Deleting..." : "Delete Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
