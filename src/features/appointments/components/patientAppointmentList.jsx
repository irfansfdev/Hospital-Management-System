"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreVertical, Eye, Edit, X, FileText } from "lucide-react";
import { getDoctors } from "../appointmentActions/appointmentAction";
import { Dropdown } from "@/components/ui/select";

export default function PatientAppointmentList({
  appointments = [],
  doctorsList = [],
  onEdit,
}) {
  const [allDoctors, setAllDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [sidebar, setSidebar] = useState({
    isOpen: false,
    mode: "view",
    data: null,
  });

  const [editFormData, setEditFormData] = useState({});

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (doctorsList && doctorsList.length > 0) {
      setAllDoctors(doctorsList);
    } else if (allDoctors.length === 0) {
      setLoadingDoctors(true);
      getDoctors()
        .then((data) => {
          if (data && data.length > 0) setAllDoctors(data);
        })
        .catch((err) => console.error("Error fetching doctors:", err))
        .finally(() => setLoadingDoctors(false));
    }
  }, [doctorsList?.length]);

  const availableDoctors =
    allDoctors.length > 0
      ? allDoctors
      : Array.from(
          new Set(appointments.map((a) => a.doctorName).filter(Boolean)),
        );

  const openSidebar = (mode, appointmentData) => {
    const status = appointmentData?.status?.toLowerCase();

    if (mode === "edit" && status !== "pending") {
      alert("You can only edit pending appointments.");
      return;
    }

    setSidebar({ isOpen: true, mode: mode, data: appointmentData });
    if (mode === "edit") {
      setEditFormData(appointmentData);
    }
  };

  const closeSidebar = () => {
    setSidebar({ isOpen: false, mode: "view", data: null });
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "date" && value && value < todayStr) {
      return;
    }

    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(editFormData);
    }
    closeSidebar();
  };

  const getBadgeStyle = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "cancelled":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-background rounded-xl border border-border shadow-sm text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium text-sm">
          No appointments found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="w-full min-h-[220px] overflow-x-auto bg-background rounded-xl border border-border shadow-sm">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-border bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">Date & Time</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">Doctor</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
              <th className="px-6 py-4 font-semibold whitespace-nowrap">Prescription</th>
              <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {appointments.map((appointment, index) => {
              const uniqueKey = appointment?.id
                ? `app-${appointment.id}`
                : `app-idx-${index}`;
              const currentStatus = appointment.status?.toLowerCase();
              const isEditable = currentStatus === "pending";

              return (
                <tr
                  key={uniqueKey}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">
                      {appointment.date || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {appointment.time || ""}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={appointment.doctorImage || "/default-avatar.png"}
                          alt={appointment.doctorName || "Doctor"}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-10 h-10 rounded-full object-cover bg-muted"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">
                          {appointment.doctorName || "Unknown Doctor"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 capitalize whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(appointment.status)}`}
                    >
                      {appointment.status || "Unknown"}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentStatus === "completed" ? (
                      <Link
                        href={`/patient/prescriptions/${appointment.prescriptionId}`}
                         className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E37A4] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#252d89]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Dropdown>
                      <Dropdown.Trigger className="cursor-pointer rounded-full p-2 text-muted-foreground transition hover:bg-black/5 dark:hover:bg-white/10">
                        <MoreVertical className="h-4 w-4" />
                      </Dropdown.Trigger>

                      <Dropdown.Content
                        align="right"
                        className="w-36 text-left"
                      >
                        <Dropdown.Item
                          onSelect={() => openSidebar("view", appointment)}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span>View</span>
                        </Dropdown.Item>

                        {isEditable && (
                          <Dropdown.Item
                            onSelect={() => openSidebar("edit", appointment)}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <Edit className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Edit</span>
                          </Dropdown.Item>
                        )}
                      </Dropdown.Content>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sidebar.isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeSidebar}
          ></div>

          <div
            className={`relative w-full ${sidebar.mode === "view" ? "max-w-xs" : "max-w-sm"} bg-background h-full shadow-2xl flex flex-col z-10 border-l border-border`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
              <h2 className="text-base font-semibold text-foreground capitalize">
                {sidebar.mode} Appointment
              </h2>
              <button
                onClick={closeSidebar}
                className="cursor-pointer p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-background">
              {sidebar.data && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Doctor Name
                    </label>
                    {sidebar.mode === "edit" ? (
                      <div className="mt-1 [&>div]:w-full">
                        <Dropdown>
                          <Dropdown.Trigger className="cursor-pointer w-full flex items-center justify-between px-3 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-foreground bg-background text-left">
                            <span className="truncate">
                              {editFormData.doctorName ||
                                (loadingDoctors
                                  ? "Loading doctors..."
                                  : "Select a Doctor")}
                            </span>
                            <svg
                              className="w-4 h-4 text-muted-foreground shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              ></path>
                            </svg>
                          </Dropdown.Trigger>

                          <Dropdown.Content className="w-full max-h-40 overflow-y-auto z-50 border border-border bg-background">
                            {availableDoctors.map((doc, idx) => {
                              const docName =
                                typeof doc === "string"
                                  ? doc
                                  : doc.profile?.full_name ||
                                    doc.name ||
                                    doc.doctorName ||
                                    doc.fullName ||
                                    "";

                              const docId =
                                typeof doc === "string"
                                  ? null
                                  : doc.id ||
                                    doc.doctorId ||
                                    doc.doctor_id ||
                                    doc._id;

                              const handleDoctorSelect = () => {
                                setEditFormData((prev) => ({
                                  ...prev,
                                  doctorName: docName,
                                  doctorId: docId,
                                  doctor_id: docId,
                                }));
                              };

                              return (
                                <Dropdown.Item
                                  key={idx}
                                  onSelect={handleDoctorSelect}
                                  onClick={handleDoctorSelect}
                                  className="text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                                >
                                  {docName}
                                </Dropdown.Item>
                              );
                            })}
                          </Dropdown.Content>
                        </Dropdown>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {sidebar.data.doctorName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </label>
                      {sidebar.mode === "edit" ? (
                        <input
                          type="date"
                          name="date"
                          value={editFormData.date || ""}
                          onChange={handleInputChange}
                          onKeyDown={(e) => e.preventDefault()}
                          min={todayStr}
                          className="w-full mt-1 px-2.5 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-foreground bg-background"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {sidebar.data.date}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Time
                      </label>
                      {sidebar.mode === "edit" ? (
                        <input
                          type="time"
                          name="time"
                          value={editFormData.time || ""}
                          onChange={handleInputChange}
                          className="w-full mt-1 px-2.5 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-foreground bg-background"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {sidebar.data.time}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-black/[0.02] dark:bg-white/[0.02]">
              <button
                onClick={closeSidebar}
                className="cursor-pointer px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Close
              </button>
              {sidebar.mode === "edit" && (
                <button
                  onClick={handleSave}
                  className="cursor-pointer px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}