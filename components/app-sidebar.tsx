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
  WorkflowIcon,
} from "lucide-react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useInboxCounts, useSession } from "@/hooks/queries";

function UnreadBadge() {
  const counts = useInboxCounts();
  const unread = counts.data?.unread ?? 0;
  if (unread <= 0) return null;
  return (
    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
      {unread}
    </span>
  );
}

function useNav() {
  return [
    { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
    { title: "Inbox", url: "/inbox", icon: <InboxIcon />, trailing: <UnreadBadge /> },
    { title: "Leads", url: "/leads", icon: <UsersIcon /> },
    { title: "Campaigns", url: "/campaigns", icon: <MegaphoneIcon /> },
    { title: "Live", url: "/live", icon: <RadioIcon /> },
    { title: "Calls", url: "/calls", icon: <PhoneCallIcon /> },
    { title: "Agent", url: "/agent", icon: <BotIcon /> },
    { title: "Knowledge Base", url: "/knowledge-base", icon: <BookOpenIcon /> },
    { title: "Workflows", url: "/workflows", icon: <WorkflowIcon /> },
    { title: "Organisation", url: "/organization", icon: <Building2Icon /> },
    { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
  ];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession();
  const user = session.data?.user;
  const orgName = user?.organization?.name ?? "Motornexo";

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <AudioWaveformIcon className="size-5!" />
              <span className="text-base font-semibold">{orgName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={useNav()} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
