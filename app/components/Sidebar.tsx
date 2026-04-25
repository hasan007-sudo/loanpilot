"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Megaphone, Mic } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/leads", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white rounded-lg p-1.5">
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold text-gray-900">LoanPilot</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 ml-8">Voice AI for Banks</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Powered by Bolna AI</p>
      </div>
    </aside>
  );
}
