"use client";

import * as React from "react";
import {
  LayoutDashboardIcon,
  PhoneCallIcon,
  BotIcon,
  BookOpenIcon,
  Building2Icon,
  Settings2Icon,
  AudioWaveformIcon,
  UsersIcon,
  MegaphoneIcon,
  RadioIcon,
  InboxIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { useInboxCounts, useSession } from "@/hooks/queries";

type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function UnreadBadge() {
  const counts = useInboxCounts();
  const unread = counts.data?.unread ?? 0;
  if (unread <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
      {unread}
    </span>
  );
}

function useNavSections(): NavSection[] {
  return [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
      ],
    },
    {
      label: "Engagement",
      items: [
        { title: "Inbox", url: "/inbox", icon: <InboxIcon />, trailing: <UnreadBadge /> },
        { title: "Leads", url: "/leads", icon: <UsersIcon /> },
        { title: "Campaigns", url: "/campaigns", icon: <MegaphoneIcon /> },
        { title: "Live", url: "/live", icon: <RadioIcon /> },
      ],
    },
    {
      label: "Operations",
      items: [
        { title: "Calls", url: "/calls", icon: <PhoneCallIcon /> },
        { title: "Agent", url: "/agent", icon: <BotIcon /> },
        { title: "Knowledge Base", url: "/knowledge-base", icon: <BookOpenIcon /> },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "Organisation", url: "/organization", icon: <Building2Icon /> },
        { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
      ],
    },
  ];
}

function isActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession();
  const user = session.data?.user;
  const orgName = user?.organization?.name ?? "Motornexo";
  const pathname = usePathname() ?? "/";
  const sections = useNavSections();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <AudioWaveformIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">{orgName}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const active = isActive(pathname, item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      render={<Link href={item.url} />}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      {item.trailing}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
