"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Brain,
  Workflow,
  Settings,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Sessions", href: "/sessions", icon: MessageSquare },
  { label: "Peers", href: "/peers", icon: Users },
  { label: "Memory", href: "/memory", icon: Brain },
  { label: "Pipeline", href: "/pipeline", icon: Workflow },
  { label: "AI", href: "/ai", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r bg-white flex flex-col">
      <div className="h-14 flex items-center px-6 border-b">
        <span className="text-lg font-bold tracking-tight">Honcho</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
