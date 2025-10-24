"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import useSWR, { mutate } from "swr";
import api from "@/lib/axios";
import { useState } from "react";

const fetcher = async (url: string) => {
  const res = await api.get(url);
  return res.data;
};

const avatars = [
  { src: "/pfp/chicken.jpeg", label: "Chicken" },
  { src: "/pfp/cow.jpeg", label: "Cow" },
  { src: "/pfp/default.jpeg", label: "Deer" },
  { src: "/pfp/sheep.jpeg", label: "Sheep" },
];

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: userData } = useSWR("/user", fetcher, {
    fallbackData: user,
  });

  async function handleAvatarChange(newAvatar: string) {
    try {
      setIsUpdating(true);

      mutate("/user", { avatar: newAvatar }, false);

      await api.patch("user/avatar", { avatar: newAvatar });

      mutate("/user");
    } catch (err) {
      console.error("Failed to update avatar: ", err);
      mutate("/user", userData, false);
    } finally {
      setIsUpdating(false);
    }
  }

  const currentAvatar = userData?.avatar ?? user.avatar;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=close]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground p-2 [box-shadow:0_0_3px_rgba(0,0,0,0.2)] dark:[box-shadow:0_0_3px_rgba(100,100,100,0.9)] cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg border-2 dark:border-neutral-300">
                <AvatarImage src={currentAvatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-2 text-sm font-medium">
              Choose your profile icon
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Avatar selection grid */}
            <div className="grid grid-cols-4 gap-2 p-3">
              {avatars.map((a) => (
                <DropdownMenuItem
                  key={a.src}
                  disabled={isUpdating}
                  onClick={() => handleAvatarChange(a.src)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all duration-100 cursor-pointer hover:bg-accent ${
                    currentAvatar === a.src ? "border-2 border-blue-500" : ""
                  }`}
                >
                  <img
                    src={a.src}
                    alt={a.label}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                  <span className="text-[11px] text-gray-600 dark:text-white">
                    {currentAvatar === a.src ? "You" : a.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
