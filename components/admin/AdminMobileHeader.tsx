"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminMobileHeaderProps {
  role?: "ADMIN" | "EMPLOYEE";
}

export default function AdminMobileHeader({ role = "EMPLOYEE" }: AdminMobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile topbar */}
      <header className="lg:hidden bg-black text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="text-white">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold">Житлова компанія Progress Admin</span>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex-shrink-0">
            <AdminSidebar onClose={() => setOpen(false)} role={role} />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
