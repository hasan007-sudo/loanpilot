"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Megaphone, Mic, Sparkles } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-20 border-b border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[24px_0_80px_-60px_rgba(12,18,24,0.95)] lg:fixed lg:left-0 lg:h-screen lg:w-72 lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col px-4 py-4 sm:px-5 sm:py-5">
        <div className="rounded-[18px] border border-white/8 bg-white/4 px-4 py-3 text-white">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-[var(--sidebar-primary)] ring-1 ring-white/10">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/36">
                  Voice Lending Ops
                </span>
                <span className="mt-1 block font-heading text-[2rem] leading-none font-medium text-white/92">
                  LoanPilot
                </span>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/4 p-1.5 text-[var(--sidebar-primary)]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="max-w-[15rem] text-[0.84rem] leading-6 text-white/52">
            Outreach desk for qualification review and campaign orchestration.
          </p>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-5 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={label}
                href={href}
                className={`group flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:min-w-0 ${
                  active
                    ? "bg-white/12 text-white ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-white/62 hover:bg-white/7 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    active
                      ? "bg-[var(--sidebar-primary)]/18 text-[var(--sidebar-primary)]"
                      : "bg-white/6 text-white/55 group-hover:bg-white/10 group-hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </span>
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--sidebar-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
