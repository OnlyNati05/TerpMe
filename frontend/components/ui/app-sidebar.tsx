"use client";

import * as React from "react";
import {
  AudioWaveform,
  Blocks,
  Calendar,
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  MessageCirclePlus,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { NavChats } from "@/components/ui/nav-chats";
import { NavMain } from "@/components/ui/nav-main";
import { NavSecondary } from "@/components/ui/nav-secondary";
import { NavWorkspaces } from "@/components/ui/nav-workspaces";
import { TeamSwitcher } from "@/components/ui/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import api from "@/lib/axios";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";

const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "New Chat",
      url: "/",
      icon: MessageCirclePlus,
    },
  ],
  navSecondary: [
    {
      title: "New Chat",
      url: "#",
      icon: Calendar,
    },
  ],
  user: {
    name: "You",
    email: "guest",
    avatar: "pfp/default.jpeg",
  },
};

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: chatsData, mutate } = useSWR("/conversations", fetcher, {
    revalidateOnFocus: true,
  });

  const chats =
    chatsData?.map((chat: any) => ({
      name: chat.title || "Untitled Conversation",
      url: `/chat/${chat.id}`,
      preview: chat.preview,
    })) ?? [];

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavChats chats={chats} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
