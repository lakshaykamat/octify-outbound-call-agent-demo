"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useDemo } from "./DemoContext";
import { useLeads, useCampaigns, useCalls } from "@/hooks/queries";
import {
  Calendar, Users, Megaphone, Phone, Plus, Upload, Activity,
  Settings, Building2, BookOpen, MessageSquare, Moon, Sun, Sparkles,
  Search, ArrowRight, LayoutDashboard,
} from "lucide-react";

type Action = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  keywords?: string;
};

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, scenarios, switchScenario } = useDemo();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Light data probes for search hits, only top items.
  const leads = useLeads({ limit: 6 });
  const campaigns = useCampaigns();
  const calls = useCalls({ page: 1, limit: 6 });

  useEffect(() => {
    if (paletteOpen) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  function go(href: string) {
    router.push(href);
    setPaletteOpen(false);
  }

  const actions = useMemo<Action[]>(() => {
    const list: Action[] = [
      { id: "nav-dashboard", group: "Navigate", label: "Dashboard", icon: <LayoutDashboard className="size-4" />, run: () => go("/") },
      { id: "nav-leads", group: "Navigate", label: "Leads", icon: <Users className="size-4" />, run: () => go("/leads") },
      { id: "nav-campaigns", group: "Navigate", label: "Campaigns", icon: <Megaphone className="size-4" />, run: () => go("/campaigns") },
      { id: "nav-calls", group: "Navigate", label: "Calls", icon: <Phone className="size-4" />, run: () => go("/calls") },
      { id: "nav-live", group: "Navigate", label: "Live", icon: <Activity className="size-4" />, run: () => go("/live") },
      { id: "nav-agent", group: "Navigate", label: "Agent Studio", icon: <Sparkles className="size-4" />, run: () => go("/agent") },
      { id: "nav-kb", group: "Navigate", label: "Knowledge Base", icon: <BookOpen className="size-4" />, run: () => go("/knowledge-base") },
      { id: "nav-inbox", group: "Navigate", label: "Inbox", icon: <MessageSquare className="size-4" />, run: () => go("/inbox") },
      { id: "nav-org", group: "Navigate", label: "Organisation", icon: <Building2 className="size-4" />, run: () => go("/organization") },
      { id: "nav-settings", group: "Navigate", label: "Settings", icon: <Settings className="size-4" />, run: () => go("/settings") },

      { id: "act-new-campaign", group: "Actions", label: "New campaign", icon: <Plus className="size-4" />, run: () => go("/campaigns/new") },
      { id: "act-import", group: "Actions", label: "Import leads", icon: <Upload className="size-4" />, run: () => go("/leads/import") },

      { id: "th-light", group: "Appearance", label: "Theme: Light", icon: <Sun className="size-4" />, run: () => { setTheme("light"); setPaletteOpen(false); } },
      { id: "th-dark", group: "Appearance", label: "Theme: Dark", icon: <Moon className="size-4" />, run: () => { setTheme("dark"); setPaletteOpen(false); } },
    ];

    for (const s of scenarios) {
      list.push({
        id: `scn-${s.value}`,
        group: "Demo persona",
        label: s.label,
        hint: s.description,
        icon: <Sparkles className="size-4" />,
        run: () => { switchScenario(s.value); setPaletteOpen(false); },
        keywords: "persona scenario demo",
      });
    }

    for (const l of leads.data?.items ?? []) {
      list.push({
        id: `lead-${l.id}`,
        group: "Leads",
        label: l.fullName,
        hint: l.company,
        icon: <Users className="size-4" />,
        run: () => go(`/leads?lead=${l.id}`),
        keywords: `${l.email} ${l.phone} ${l.company}`,
      });
    }
    for (const c of campaigns.data ?? []) {
      list.push({
        id: `camp-${c.id}`,
        group: "Campaigns",
        label: c.name,
        hint: c.status,
        icon: <Megaphone className="size-4" />,
        run: () => go(`/campaigns/${c.id}`),
      });
    }
    for (const c of calls.data?.calls ?? []) {
      list.push({
        id: `call-${c._id}`,
        group: "Calls",
        label: c.prospectName || c.phone,
        hint: c.company,
        icon: <Phone className="size-4" />,
        run: () => go(`/calls?call=${c._id}`),
        keywords: `${c.phone}`,
      });
    }

    return list;
  }, [scenarios, switchScenario, leads.data, campaigns.data, calls.data, router, setTheme, setPaletteOpen]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter((a) =>
      `${a.label} ${a.hint ?? ""} ${a.keywords ?? ""} ${a.group}`.toLowerCase().includes(term),
    );
  }, [q, actions]);

  const grouped = useMemo(() => {
    const m = new Map<string, Action[]>();
    for (const a of filtered.slice(0, 50)) {
      const arr = m.get(a.group) ?? [];
      arr.push(a);
      m.set(a.group, arr);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => setActiveIdx(0), [q]);
  const flat = filtered.slice(0, 50);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[activeIdx]?.run();
    }
  }

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">Search and run commands</DialogDescription>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search leads, calls, campaigns, or run an action…"
            className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">No matches.</div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="py-1">
                <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {group}
                </div>
                <ul>
                  {items.map((a) => {
                    const idx = flat.indexOf(a);
                    const active = idx === activeIdx;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => a.run()}
                          className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                            active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                          }`}
                        >
                          <span className="text-muted-foreground">{a.icon}</span>
                          <span className="flex-1 truncate">{a.label}</span>
                          {a.hint ? (
                            <span className="truncate text-xs text-muted-foreground">{a.hint}</span>
                          ) : null}
                          <ArrowRight className={`size-3 text-muted-foreground transition ${active ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>↑↓ to navigate · ↵ to run</span>
          <span>⌘K to open · ⌘⇧D for persona</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
