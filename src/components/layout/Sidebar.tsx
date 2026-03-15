"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  FlaskConical,
  Settings,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    label: "Diluições",
    href: "/diluicoes",
    icon: FlaskConical,
  },
  {
    label: "Estoque",
    href: "/estoque",
    icon: Warehouse,
  },
  {
    label: "Compras",
    href: "/compras",
    icon: ShoppingCart,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white shrink-0">
      {/* Logo / Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-500">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Dona Help</p>
          <p className="text-xs text-gray-400 leading-tight">Hub de Suprimentos</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Menu
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-700">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Configurações
        </Link>
        <div className="mt-3 px-3">
          <p className="text-[11px] text-gray-600">v0.1.0 — Dona Help</p>
        </div>
      </div>
    </aside>
  );
}
