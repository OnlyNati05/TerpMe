// components/sidebar-layout.tsx
"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BsLayoutSidebar } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          title="Open sidebar"
          aria-label="Open sidebar"
          className="fixed left-3 top-3 z-40 rounded-xl border border-gray-200 bg-background p-2.5 shadow-sm md:hidden"
        >
          <BsLayoutSidebar className="h-5 w-5" />
        </button>
      )}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
        />
      )}
      {/* Left column */}

      <div
        className={`fixed inset-y-3 left-3 z-50 flex h-[calc(100dvh-1.5rem)] w-[min(85vw,320px)] flex-none flex-col overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none md:static md:z-auto md:m-7 md:h-[calc(100vh-3.5rem)] md:transition-[width] ${
          sidebarOpen
            ? "translate-x-0 md:w-[clamp(200px,21vw,600px)]"
            : "-translate-x-[calc(100%+1rem)] md:w-[70px] md:translate-x-0"
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
        className="min-w-0 flex-1 overflow-y-auto"
      >
        <div className="min-h-full min-w-0">{children}</div>
      </motion.div>
    </div>
  );
}
