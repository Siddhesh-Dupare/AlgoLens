import { Download as DownloadIcon, ShieldAlert, Monitor } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { site } from "@/lib/site";
import { SectionHeading } from "@/components/features/Features";

const steps = [
  "Download the AlgoLens beta installer (.exe) from GitHub Releases.",
  "Run the installer. Windows may show “Windows protected your PC” — click More info → Run anyway (normal for unsigned beta builds).",
  "Launch AlgoLens, open a file or write code, and press Run or Debug.",
];

export default function Download() {
  return (
    <section id="download" className="border-t border-white/[0.06] bg-[#08090b]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Download"
          title="Try the AlgoLens beta"
          subtitle="A free, open-source desktop app. Windows beta available now."
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
          {/* CTA card */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-[#0c0d10] p-7">
            <div className="flex items-center gap-2 text-zinc-300">
              <Monitor className="size-5 text-sky-400" />
              <span className="text-sm font-medium">Windows 10 / 11 · 64-bit</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
              Includes the visualizer, code editor, integrated terminal and the
              execution engine. ~Beta v0.1 — expect rough edges.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={site.download}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-400"
              >
                <DownloadIcon className="size-4" /> Download for Windows
              </a>
              <a
                href={site.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07]"
              >
                <GithubIcon className="size-4" /> Build from source
              </a>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[12px] text-amber-300/90">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                The beta installer is not code-signed yet, so SmartScreen will
                warn you. It is safe — choose “Run anyway”.
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-white/10 bg-[#0c0d10] p-7">
            <h3 className="text-sm font-semibold text-zinc-100">Getting started</h3>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-[11px] text-sky-400">
                    {i + 1}
                  </span>
                  <span className="text-[13px] leading-relaxed text-zinc-400">
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
