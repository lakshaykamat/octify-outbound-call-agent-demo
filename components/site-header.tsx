"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/calls": "Calls",
  "/agent": "Agent",
  "/knowledge-base": "Knowledge Base",
  "/organization": "Organisation",
  "/settings": "Settings",
};

function pickTitle(path: string) {
  for (const key of Object.keys(TITLES).sort((a, b) => b.length - a.length)) {
    if (key === "/" ? path === "/" : path.startsWith(key)) return TITLES[key];
  }
  return "Motornexo";
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-medium">{pickTitle(pathname)}</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
