"use client";

import {
  ArrowUpRight,
  Link,
  MoreHorizontal,
  StarOff,
  Trash2,
  Pencil,
  MessageCircleDashed,
  MessageCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { mutate } from "swr";
import { toast } from "sonner";
import api from "@/lib/axios";

export function NavChats({
  chats,
}: {
  chats: {
    name: string;
    url: string;
    preview: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [chatsOpen, setChatsOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  async function saveRename(chatId: string) {
    if (!tempName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await api.patch(`/conversations/${chatId}`, { title: tempName });
      mutate("/conversations");
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setEditingId(null);
      setTempName("");
    }
  }

  async function handleDelete(chatId: string) {
    try {
      await api.delete(`/conversations/${chatId}`);
      mutate("/conversations");
      if (pathname === `/chat/${chatId}`) router.push("/");
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteId(null);
    }
  }

  async function handleCopyLink(url: string) {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      toast.success("Link copied!");
    } catch {
      console.error("Clipboard error");
    }
  }

  function handleOpenInNewTab(url: string) {
    window.open(url, "_blank");
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-sm my-2 flex items-center justify-between">
        Chats
        <button
          onClick={() => setChatsOpen((prev) => !prev)}
          className="p-1 rounded bg-primary-foreground hover:bg-accent transition cursor-pointer"
          aria-label={chatsOpen ? "Collapse chats" : "Expand chats"}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              chatsOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
      </SidebarGroupLabel>

      <motion.div
        initial={false}
        animate={{
          height: chatsOpen ? "auto" : 0,
          opacity: chatsOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 h-82 text-gray-500 text-sm font-medium">
            <MessageCircleDashed />
            No Chat History
          </div>
        ) : (
          <SidebarMenu>
            <AnimatePresence>
              {chats.map((item, index) => {
                const chatId = item.url.split("/").pop()!;
                const isEditing = editingId === chatId;

                return (
                  <motion.div
                    key={item.url}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      duration: 0.25,
                      ease: "easeOut",
                      delay: index * 0.05,
                    }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={(e) => {
                          if (isEditing) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          router.push(item.url);
                        }}
                        className={cn(
                          "flex flex-col justify-center items-start py-10 transition-colors w-full text-left cursor-pointer",
                          pathname === item.url
                            ? "bg-blue-100 text-blue-600 hover:!bg-blue-100 hover:!text-blue-600"
                            : isEditing
                            ? "bg-primary-foreground"
                            : "bg-primary-foreground hover:bg-accent"
                        )}
                      >
                        <div className="flex flex-row items-center p-2 gap-4 w-full">
                          <div className="shrink-0">
                            <MessageCircle className="h-5 w-5" />
                          </div>

                          <div className="flex flex-col w-full">
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={() => saveRename(chatId)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveRename(chatId);
                                  if (e.key === "Escape") {
                                    setEditingId(null);
                                    setTempName("");
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium truncate max-w-[180px] bg-transparent border-b border-blue-500 focus:outline-none"
                              />
                            ) : (
                              <span className="font-medium truncate max-w-[180px]">
                                {item.name}
                              </span>
                            )}

                            <span className="font-light text-xs text-gray-500 truncate max-w-[200px]">
                              {item.preview}
                            </span>
                          </div>
                        </div>
                      </SidebarMenuButton>

                      {/* Dropdown actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            className={cn(
                              "cursor-pointer",
                              pathname === item.url
                                ? "hover:bg-blue-200"
                                : "hover:bg-accent"
                            )}
                          >
                            <MoreHorizontal />
                            <span className="sr-only">More</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          className="w-45 rounded-lg ml-0.5"
                          side={isMobile ? "bottom" : "right"}
                          align={isMobile ? "end" : "start"}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(chatId);
                              setTempName(item.name);
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="text-muted-foreground" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(item.url);
                            }}
                            className="cursor-pointer"
                          >
                            <Link className="text-muted-foreground" />
                            <span>Copy Link</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInNewTab(item.url);
                            }}
                            className="cursor-pointer"
                          >
                            <ArrowUpRight className="text-muted-foreground" />
                            <span>Open in New Tab</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(chatId);
                            }}
                            className="cursor-pointer"
                          >
                            <Trash2 />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </SidebarMenu>
        )}
      </motion.div>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this conversation? This action
            cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer hover:bg-red-800"
              variant="destructive"
              onClick={() => handleDelete(deleteId!)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
}
