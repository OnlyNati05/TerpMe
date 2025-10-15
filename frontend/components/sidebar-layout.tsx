// components/sidebar-layout.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BsLayoutSidebar } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const hasAnimatedOnce = useRef(false);

  useEffect(() => {
    if (sidebarOpen && !hasAnimatedOnce.current) {
      const timer = setTimeout(() => {
        hasAnimatedOnce.current = true;
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [sidebarOpen]);

  const entranceDuration = hasAnimatedOnce.current ? 0.3 : 0.6;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left column */}

      <div
        className={`flex m-7 flex-col transition-all duration-300 ${
          sidebarOpen ? "w-[21%] min-w-[200px] max-w-[600px]" : "w-[80px]"
        }`}
      >
        {/* Title + Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`flex items-center bg-sidebar scale-99 rounded-2xl shadow-md border border-gray-200
          transition-all duration-300
          ${
            sidebarOpen
              ? "px-4 py-4 justify-between"
              : "px-1 py-1 justify-center"
          }`}
        >
          {/* Title only when open */}
          {sidebarOpen && (
            <Image
              src="/logo/fullterp.png"
              alt="TerpMe banner"
              className="w-full max-w-[150px] ml-0"
              width={200}
              height={200}
            />
          )}

          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="p-2 rounded-full hover:bg-gray-200 transition"
            aria-expanded={sidebarOpen}
          >
            <BsLayoutSidebar className="h-5 w-5 text-gray-800 cursor-pointer" />
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              key="sidebar-container"
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { duration: entranceDuration, ease: "easeInOut" },
              }}
              exit={{
                opacity: 0,
                x: -10,
                transition: { duration: 0.3, ease: "easeInOut" },
              }}
              className="max-h-[calc(100vh-120px)] scale-97 min-h-[170px] w-full rounded-2xl shadow-md overflow-hidden"
            >
              <SidebarProvider>
                <AppSidebar
                  className="w-full !h-[calc(100vh-120px)] p-2"
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
