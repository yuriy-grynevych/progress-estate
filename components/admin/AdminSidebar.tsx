"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Star,
  Settings,
  LogOut,
  PlusCircle,
  X,
  Users,
  UserCircle,
  BookUser,
  MapPin,
  Bell,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Нерухомість", icon: Building2 },
  { href: "/admin/map", label: "Карта", icon: MapPin },
  { href: "/admin/inquiries", label: "Запити", icon: MessageSquare },
  { href: "/admin/contacts", label: "Контакти", icon: BookUser },
  { href: "/admin/reminders", label: "Нагадування", icon: Bell },
  { href: "/admin/testimonials", label: "Відгуки", icon: Star },
  { href: "/admin/users", label: "Працівники", icon: Users },
  { href: "/admin/settings", label: "Налаштування", icon: Settings },
  { href: "/admin/profile", label: "Мій профіль", icon: UserCircle },
];

const employeeNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Нерухомість", icon: Building2 },
  { href: "/admin/map", label: "Карта", icon: MapPin },
  { href: "/admin/inquiries", label: "Мої запити", icon: MessageSquare },
  { href: "/admin/contacts", label: "Контакти", icon: BookUser },
  { href: "/admin/reminders", label: "Нагадування", icon: Bell },
  { href: "/admin/profile", label: "Мій профіль", icon: UserCircle },
];

interface AdminSidebarProps {
  onClose?: () => void;
  role?: "ADMIN" | "EMPLOYEE";
}

export default function AdminSidebar({ onClose, role = "EMPLOYEE" }: AdminSidebarProps) {
  const pathname = usePathname();
  const navItems = role === "ADMIN" ? adminNavItems : employeeNavItems;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div>
          <p className="font-bold text-lg leading-none">Житлова компанія Progress</p>
          <p className="text-white/50 text-xs mt-0.5">
            {role === "ADMIN" ? "Адмін панель" : "Панель працівника"}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick action */}
      <div className="px-4 py-4">
        <Link
          href="/admin/properties/new"
          onClick={onClose}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold text-sm px-4 py-2.5 rounded-xl w-full transition"
        >
          <PlusCircle className="w-4 h-4" />
          Додати нерухомість
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition w-full"
        >
          <LogOut className="w-5 h-5" />
          Вийти
        </button>
      </div>
    </div>
  );
}
