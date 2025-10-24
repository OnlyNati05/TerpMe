"use client";
import { IoLogoGithub } from "react-icons/io";
import ThemeToggle from "./ui/theme-toggle";

export default function IconBar() {
  return (
    <div>
      <IoLogoGithub
        size={31}
        className="fixed right-10 top-5 text-gray-500 hover:text-black transition-colors duration-300 cursor-pointer dark:hover:text-white dark:text-neutral-400"
        onClick={() =>
          window.open("https://github.com/OnlyNati05/TerpMe.git", "_blank")
        }
      ></IoLogoGithub>
      <div className="fixed border-l border-r-[0.1] border-gray-200 h-7 right-20 top-6 dark:border-neutral-600" />
      <div className="fixed right-23 top-[26] z-50">
        <ThemeToggle></ThemeToggle>
      </div>
    </div>
  );
}
