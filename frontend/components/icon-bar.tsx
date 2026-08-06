"use client";
import { IoLogoGithub } from "react-icons/io";
import ThemeToggle from "./ui/theme-toggle";

export default function IconBar() {
  return (
    <div>
      <IoLogoGithub
        size={31}
        className="fixed right-3 top-4 z-30 cursor-pointer text-gray-500 transition-colors duration-300 hover:text-black sm:right-10 sm:top-5 dark:text-neutral-400 dark:hover:text-white"
        onClick={() =>
          window.open("https://github.com/OnlyNati05/TerpMe.git", "_blank")
        }
      ></IoLogoGithub>
      <div className="fixed right-12 top-5 z-30 h-7 border-l border-gray-200 sm:right-20 sm:top-6 dark:border-neutral-600" />
      <div className="fixed right-14 top-[21px] z-30 sm:right-23 sm:top-[26px]">
        <ThemeToggle></ThemeToggle>
      </div>
    </div>
  );
}
