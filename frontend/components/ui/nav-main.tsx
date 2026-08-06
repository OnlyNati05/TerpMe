"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            <Link
              prefetch={true}
              href={item.url}
              className="flex flex-row justify-center items-center p-6 !bg-blue-500 !text-white [box-shadow:0_0_8px_rgba(0,0,0,0.1)]
              hover:[box-shadow:0_0_7px_rgba(0,0,0,0.1)] hover:!bg-blue-600 hover:!text-white dark:hover:!bg-blue-600 transition-all duration-300"
            >
              <item.icon />
              <span className="text-base font-sans font-normal">
                {item.title}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
