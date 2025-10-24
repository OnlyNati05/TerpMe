"use client";

import { useTheme } from "next-themes";
import { Button } from "./button";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        aria-label="Theme toggle placeholder"
        className="relative inline-flex h-6 w-[45px] items-center rounded-full
                   bg-gray-300 dark:bg-neutral-700 shadow-lg transition-colors duration-75 cursor-pointer"
      >
        <span
          className="absolute h-[23px] w-6 transform rounded-full bg-gray-100
                     transition-all duration-300 flex items-center justify-center"
          style={{ transform: "translateX(1px)" }}
        >
          <Sun className="h-4 w-4 text-gray-500" />
        </span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative inline-flex h-6 w-[45] items-center rounded-full shadow-lg
        transition-colors duration-75 cursor-pointer
        ${isDark ? "bg-neutral-700" : "bg-gray-300"}
      `}
    >
      <span
        className={`
          absolute h-[23px] w-6 transform rounded-full bg-white dark:bg-black
          transition-all duration-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-800
          ${isDark ? "translate-x-[19px]" : "translate-x-[1px]"}
        `}
      >
        {isDark ? (
          <Moon strokeWidth={2} className="h-4 w-4 text-neutral-300" />
        ) : (
          <Sun className="h-4 w-4 text-black" />
        )}
      </span>
    </button>
  );
}
