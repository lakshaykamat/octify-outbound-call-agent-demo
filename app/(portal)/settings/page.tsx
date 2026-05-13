"use client";

import { useState } from "react";
import {
  UserIcon, UsersIcon, CreditCardIcon, KeyIcon, BellIcon,
  type LucideIcon,
} from "lucide-react";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { TeamSection } from "@/components/settings/TeamSection";
import { BillingSection } from "@/components/settings/BillingSection";
import { ApiKeysSection } from "@/components/settings/ApiKeysSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { cn } from "@/lib/utils";

type SectionKey = "profile" | "team" | "billing" | "api-keys" | "notifications";

const SECTIONS: Array<{ value: SectionKey; label: string; icon: LucideIcon }> = [
  { value: "profile", label: "Profile", icon: UserIcon },
  { value: "team", label: "Team", icon: UsersIcon },
  { value: "billing", label: "Billing", icon: CreditCardIcon },
  { value: "api-keys", label: "API keys", icon: KeyIcon },
  { value: "notifications", label: "Notifications", icon: BellIcon },
];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionKey>("profile");

  return (
    <div className="grid gap-6 px-4 lg:grid-cols-[200px_1fr] lg:px-6">
      <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = s.value === section;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSection(s.value)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        {section === "profile" && <ProfileSection />}
        {section === "team" && <TeamSection />}
        {section === "billing" && <BillingSection />}
        {section === "api-keys" && <ApiKeysSection />}
        {section === "notifications" && <NotificationsSection />}
      </div>
    </div>
  );
}
