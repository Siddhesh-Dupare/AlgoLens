import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";

export default function ResearchCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/[0.08] to-violet-500/[0.06] p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-300">
              <FlaskConical className="size-3.5 text-sky-400" />
              Research
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">
              Help shape AlgoLens — join our study
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
              AlgoLens is being evaluated for a paper at IEEE PuneCon 2026. Take
              part in a short, anonymous study and help us measure how
              visualization improves DSA learning.
            </p>
          </div>
          <Link
            href="/participate"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Participate <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
