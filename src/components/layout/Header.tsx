"use client";

import { usePathname } from "next/navigation";

const pageNames: Record<string, string> = {
  "/": "Overview",
  "/sessions": "Sessions",
  "/peers": "Peers",
  "/memory": "Memory",
  "/pipeline": "Pipeline",
};

export function Header() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] || "");
  const title = pageNames[base] || pageNames[pathname] || "Dashboard";

  return (
    <header className="h-14 shrink-0 border-b bg-white flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
          A
        </div>
        <span className="text-sm text-gray-600">Admin</span>
      </div>
    </header>
  );
}
