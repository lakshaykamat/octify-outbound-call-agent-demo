"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { TeamSection } from "@/components/settings/TeamSection";
import { BillingSection } from "@/components/settings/BillingSection";
import { ApiKeysSection } from "@/components/settings/ApiKeysSection";
import { IntegrationsSection } from "@/components/settings/IntegrationsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";

const TABS = [
  { value: "profile", label: "Profile" },
  { value: "team", label: "Team" },
  { value: "billing", label: "Billing" },
  { value: "api-keys", label: "API keys" },
  { value: "integrations", label: "Integrations" },
  { value: "notifications", label: "Notifications" },
] as const;

export default function SettingsPage() {
  const [tab, setTab] = useState<string>("profile");

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <ProfileSection />
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            <TeamSection />
          </TabsContent>
          <TabsContent value="billing" className="mt-4">
            <BillingSection />
          </TabsContent>
          <TabsContent value="api-keys" className="mt-4">
            <ApiKeysSection />
          </TabsContent>
          <TabsContent value="integrations" className="mt-4">
            <IntegrationsSection />
          </TabsContent>
          <TabsContent value="notifications" className="mt-4">
            <NotificationsSection />
          </TabsContent>
        </Tabs>
    </div>
  );
}
