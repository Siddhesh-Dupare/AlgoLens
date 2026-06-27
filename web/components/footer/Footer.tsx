import Link from "next/link";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { site } from "@/lib/site";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Demo", href: "/#demo" },
      { label: "Download", href: "/#download" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: site.github, external: true },
      { label: "Research", href: "/research" },
      { label: "Participate", href: "/participate" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#08090b]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-sky-500/15">
              <span className="size-2 rounded-full bg-sky-400" />
            </span>
            <span className="text-[15px] font-semibold text-zinc-100">
              {site.name}
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-zinc-500">
            An open-source data-structure visualizer for learning algorithms by
            seeing your code run.
          </p>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-100"
          >
            <GithubIcon className="size-4" /> Star on GitHub
          </a>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {"external" in l && l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-zinc-400 hover:text-zinc-100"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-[13px] text-zinc-400 hover:text-zinc-100"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-[12px] text-zinc-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} AlgoLens · MIT License</span>
          <span>Built for IEEE PuneCon 2026</span>
        </div>
      </div>
    </footer>
  );
}
