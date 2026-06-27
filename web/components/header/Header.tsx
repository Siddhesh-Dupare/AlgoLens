"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { site, nav } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-sky-500/15 text-sky-400">
            <span className="size-2 rounded-full bg-sky-400" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
            {site.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
          >
            <GithubIcon className="size-4" /> GitHub
          </a>
          <a
            href={site.download}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-sky-500 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-sky-400"
          >
            Download Beta
          </a>
        </div>

        <button
          className="text-zinc-300 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#0a0b0d] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-white/[0.06]"
              >
                {item.label}
              </a>
            ))}
            <a
              href={site.download}
              target="_blank"
              rel="noreferrer"
              className="mt-2 rounded-md bg-sky-500 px-3 py-2 text-center text-sm font-medium text-white"
            >
              Download Beta
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
