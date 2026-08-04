// components/sidebar-layout.tsx
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BsLayoutSidebar } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left column */}

      <div
        className={`m-7 flex h-[calc(100vh-3.5rem)] flex-none flex-col overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none ${
          sidebarOpen ? "w-[clamp(200px,21vw,600px)]" : "w-[70px]"
        }`}
      >
        {/* Title + Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex h-[68px] shrink-0 items-center justify-between overflow-hidden rounded-2xl mb-2 border border-gray-200 dark:border-black/50 bg-sidebar px-4  dark:border-none"
        >
          <Link
            href="/"
            aria-hidden={!sidebarOpen}
            tabIndex={sidebarOpen ? 0 : -1}
            className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-200 motion-reduce:transition-none ${
              sidebarOpen ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <div className="flex w-full gap-2 items-center justify-center">
              <Image
                src="/logo/favicon.svg"
                alt="TerpMe logo"
                className="size-9 max-w-none"
                width={200}
                height={200}
              />
              <h1 className="font-chillax font-semibold text-[28px] text-blue-500">
                TerpMe
              </h1>
            </div>
          </Link>

          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700"
            aria-expanded={sidebarOpen}
          >
            <BsLayoutSidebar className="h-5 w-5 text-gray-800 dark:text-white cursor-pointer" />
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              key="sidebar-container"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.2, delay: 0.1, ease: "easeOut" },
              }}
              exit={{
                opacity: 0,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              className="min-h-0 flex-1 overflow-hidden"
            >
              <SidebarProvider className="h-full min-h-0">
                <AppSidebar
                  className="h-full min-h-0 w-full rounded-2xl border-1 border-gray-200 p-2  will-change-opacity dark:border-black/50"
                  variant="floating"
                  collapsible="none"
                />
              </SidebarProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Right column */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="flex-1 overflow-y-auto"
      >
        <div>{children}</div>
      </motion.div>
    </div>
  );
}
