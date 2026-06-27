import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  KeyRound,
  ExternalLink,
  Download,
} from "lucide-react";
import { site, forms } from "@/lib/site";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Participate in the AlgoLens study",
  description:
    "Join a short, anonymous study evaluating AlgoLens for learning data structures and algorithms (IEEE PuneCon 2026).",
};

type Step = {
  title: string;
  desc: string;
  cta: string;
  href: string;
  kind: "form" | "task";
};

const steps: Step[] = [
  {
    title: "Consent",
    desc: "Read the study information and give your consent. Takes a minute.",
    cta: "Open consent form",
    href: forms.consent,
    kind: "form",
  },
  {
    title: "Demographics",
    desc: "A few anonymous background questions (year, experience). No name or email.",
    cta: "Open demographics form",
    href: forms.demographics,
    kind: "form",
  },
  {
    title: "Pre-test",
    desc: "A short test of your current DSA knowledge — before using the tool. No lookups, please.",
    cta: "Open pre-test",
    href: forms.preTest,
    kind: "form",
  },
  {
    title: "Use AlgoLens",
    desc: "Install AlgoLens, then work through the guided tasks (e.g. bubble sort, BST insertion, BFS) using Run / Debug and the step controls.",
    cta: "Download AlgoLens",
    href: site.download,
    kind: "task",
  },
  {
    title: "Post-test",
    desc: "A short test of the same concepts — right after using AlgoLens.",
    cta: "Open post-test",
    href: forms.postTest,
    kind: "form",
  },
  {
    title: "Usability (SUS)",
    desc: "Rate how easy AlgoLens was to use — 10 quick questions.",
    cta: "Open usability survey",
    href: forms.sus,
    kind: "form",
  },
  {
    title: "Workload (NASA-TLX)",
    desc: "Rate the mental effort the tasks involved — 6 quick sliders.",
    cta: "Open workload survey",
    href: forms.nasaTlx,
    kind: "form",
  },
];

export default function Participate() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-50">
          Participate in the AlgoLens study
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
          AlgoLens is being evaluated for a paper at{" "}
          <span className="text-zinc-200">IEEE PuneCon 2026</span>. Complete the
          steps below in order. Your participation is anonymous and voluntary —
          you can stop at any time.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <InfoCard icon={Clock} title="~60 minutes" text="One short session." />
          <InfoCard
            icon={ShieldCheck}
            title="Anonymous"
            text="No name or email — only a code."
          />
        </div>

        {/* Participant code reminder */}
        <div className="mt-6 flex gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-4">
          <KeyRound className="mt-0.5 size-5 shrink-0 text-sky-400" />
          <div>
            <p className="text-[14px] font-medium text-zinc-100">
              Use the same participant code on every form
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
              Create it once and reuse it on all six forms — this links your
              responses while keeping you anonymous. Suggested scheme:{" "}
              <span className="text-zinc-200">
                first 2 letters of your mother&apos;s name + your 2-digit birth
                day
              </span>{" "}
              (e.g. <span className="font-mono text-sky-300">RA14</span>).
            </p>
          </div>
        </div>

        {/* Ordered steps */}
        <ol className="mt-10 space-y-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0c0d10] p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex gap-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-[12px] text-sky-400">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-zinc-100">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
                    {s.desc}
                  </p>
                </div>
              </div>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className={`flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors sm:ml-4 ${
                  s.kind === "task"
                    ? "bg-white text-zinc-900 hover:bg-zinc-200"
                    : "border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08]"
                }`}
              >
                {s.kind === "task" ? (
                  <Download className="size-4" />
                ) : (
                  <ExternalLink className="size-4" />
                )}
                {s.cta}
              </a>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-[12px] text-zinc-500">
          Questions? Contact{" "}
          <a href={`mailto:${site.email}`} className="text-zinc-400 underline">
            {site.email}
          </a>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c0d10] p-4">
      <Icon className="size-5 text-sky-400" />
      <p className="mt-2 text-[14px] font-medium text-zinc-100">{title}</p>
      <p className="text-[12px] text-zinc-500">{text}</p>
    </div>
  );
}
