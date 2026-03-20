"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Conversions", href: "/admin/conversions" },
  { label: "API Logs", href: "/admin/api-logs" },
  { label: "Revenue", href: "/admin/revenue" },
];

export default function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="mx-auto max-w-7xl overflow-x-auto px-6">
      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
              isActive(tab.href)
                ? "border-[#c8a55c] text-[#c8a55c]"
                : "border-transparent text-zinc-500 hover:border-white/[0.06] hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
