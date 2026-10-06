"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreVertical, Eye, Pencil, Stethoscope, X, Plus } from "lucide-react";
import { Dropdown } from "@/components/ui/select";

export default function DoctorAppointmentList({ appointments = [] }) {
  const [sidebar, setSidebar] = useState({
    isOpen: false,
    data: null,
  });

  const openSidebar = (appointmentData) => {
    setSidebar({ isOpen: true, data: appointmentData });
  };

  const closeSidebar = () => {
    setSidebar({ isOpen: false, data: null });
  };

  const getBadgeStyle = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
      case "pending":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
      case "cancelled":
        return "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400";
      case "confirmed":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400";
      default:
        return "bg-muted/10 text-muted border-border";
    }
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div className="p-8 text-center text-muted bg-card rounded-md border border-border shadow-sm">
        No appointments found.
      </div>
    );
  }
  

  return (
    <div className="w-full relative">
      <div className="w-full min-h-[220px] overflow-x-auto bg-card rounded-lg border border-border shadow-sm">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-border bg-hover/50 text-muted">
            <tr>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">
                Date & Time
              </th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">
                Patient
              </th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">
                Reason of Visit
              </th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">
                Status
              </th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">
                Prescription
              </th>
              <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {appointments.map((appointment, index) => {
              const uniqueKey = appointment?.id
                ? `app-${appointment.id}`
                : `app-idx-${index}`;

              return (
                <tr
                  key={uniqueKey}
                  className="hover:bg-hover/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">
                      {appointment.date || "N/A"}
                    </div>
                    <div className="text-xs text-muted">
                      {appointment.time || ""}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={
                            appointment.patientImage || "/default-avatar.png"
                          }
                          alt={appointment.patientName || "Patient"}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-10 h-10 rounded-full object-cover bg-hover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm leading-tight">
                          {appointment.patientName || "Unknown Patient"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div
                      className="max-w-[220px] truncate text-sm text-foreground"
                      title={appointment.reasonOfVisit || "Not provided"}
                    >
                      {appointment.reasonOfVisit || "Not provided"}
                    </div>
                  </td>

                  <td className="px-6 py-4 capitalize">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(appointment.status)}`}
                    >
                      {appointment.status || "Unknown"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {appointment.status?.toLowerCase() ===
                    "pending" ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Prescription Pending
                      </span>
                    ) : appointment.status?.toLowerCase() === "confirmed" ? (
                      <Link
                        href={`/doctor/prescriptions/create?appointmentId=${appointment.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2E37A4] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#252d89]"
                      >
                        <Stethoscope size={16} />
                        Consultation
                      </Link>
                    ) : appointment.status?.toLowerCase() === "completed" &&
                      appointment.prescriptionId ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/doctor/prescriptions/${appointment.prescriptionId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E37A4] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#252d89]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>

                        <Link
                          href={`/doctor/prescriptions/${appointment.prescriptionId}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-500"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Dropdown>
                      <Dropdown.Trigger className="cursor-pointer rounded-full p-2 text-muted transition hover:bg-hover">
                        <MoreVertical className="h-4 w-4" />
                      </Dropdown.Trigger>

                      <Dropdown.Content
                        align="right"
                        className="w-36 bg-card p-1 text-left"
                      >
                        <Dropdown.Item
                          onSelect={() => openSidebar(appointment)}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition hover:bg-[#2E37A4] hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </Dropdown.Item>
                      </Dropdown.Content>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sidebar.isOpen && sidebar.data && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closeSidebar}
          ></div>

          <div className="relative w-full max-w-xs bg-card h-full shadow-2xl flex flex-col z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
              <h2 className="text-base font-semibold text-foreground">
                Appointment Details
              </h2>
              <button
                onClick={closeSidebar}
                className="cursor-pointer p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-card">
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Patient Name
                  </label>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {sidebar.data.patientName || "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                      Date
                    </label>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {sidebar.data.date || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                      Time
                    </label>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {sidebar.data.time || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Status
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(sidebar.data.status)}`}
                    >
                      {sidebar.data.status || "Unknown"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Reason of Visit
                  </label>
                  <p className="text-sm font-medium text-foreground mt-0.5 leading-relaxed">
                    {sidebar.data.reason ? (
                      sidebar.data.reason
                    ) : (
                      <span className="text-muted font-normal italic text-xs">
                        No reason provided
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end bg-hover/30">
              <button
                onClick={closeSidebar}
                className="cursor-pointer px-3 py-1.5 text-xs font-medium text-muted bg-card border border-border rounded-md hover:bg-hover transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}