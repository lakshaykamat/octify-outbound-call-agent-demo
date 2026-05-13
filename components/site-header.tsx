"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/demo/NotificationsBell";
import { useDemo } from "@/components/demo/DemoContext";
import { Search } from "lucide-react";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/campaigns": "Campaigns",
  "/calls": "Calls",
  "/live": "Live",
  "/agent": "Agent",
  "/knowledge-base": "Knowledge Base",
  "/inbox": "Inbox",
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
  const { setPaletteOpen } = useDemo();
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="text-base font-medium">{pickTitle(pathname)}</h1>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-8 gap-2 text-muted-foreground md:flex"
          >
            <Search className="size-3.5" />
            <span className="text-xs">Search or run…</span>
            <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaletteOpen(true)}
            className="md:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
          <NotificationsBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
