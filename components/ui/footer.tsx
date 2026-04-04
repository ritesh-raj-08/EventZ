"use client";

import { FaInstagram, FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left - Logo + Tagline */}
        <div className="text-center md:text-left">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Eventz
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Find Your Vibe
          </p>
        </div>

        {/* Center - Links */}
        <div className="flex gap-6 text-sm text-neutral-600 dark:text-neutral-400">
          <a href="#" className="hover:text-purple-500 transition">Explore</a>
          <a href="#" className="hover:text-purple-500 transition">Create Event</a>
          <a href="#" className="hover:text-purple-500 transition">About</a>
          <a href="#" className="hover:text-purple-500 transition">Contact</a>
        </div>

        {/* Right - Social Icons */}
        <div className="flex gap-4 text-lg text-neutral-600 dark:text-neutral-400">
          <a href="#" className="hover:text-pink-500 transition">
            <FaInstagram />
          </a>
          <a href="#" className="hover:text-blue-500 transition">
            <FaLinkedin />
          </a>
          <a href="#" className="hover:text-sky-500 transition">
            <FaTwitter />
          </a>
          <a href="#" className="hover:text-white transition">
            <FaGithub />
          </a>
        </div>
      </div>


      {/* Bottom line */}
      <div className="text-center text-xs text-neutral-400 pb-4">
        © {new Date().getFullYear()} Eventz. All rights reserved.
      </div>
      <div className="text-center text-xs text-neutral-600 pb-4">
        Developed by Siddhant Raj & Ritesh Raj
      </div>

    </footer>
  );
}