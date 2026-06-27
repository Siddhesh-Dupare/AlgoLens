import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { site } from "@/lib/site";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Privacy — AlgoLens",
  description:
    "How AlgoLens handles data: anonymous, opt-in telemetry and study participation.",
};

const sections = [
  {
    h: "Overview",
    p: "AlgoLens is an open-source desktop application. It runs locally on your machine. We collect as little data as possible, and only with your consent.",
  },
  {
    h: "Usage telemetry (opt-in)",
    p: "If you opt in, AlgoLens may record anonymous usage events — which data structures you visualize, whether you use Run or Debug, playback actions, and error counts. These are tied to a self-generated participant code, never to your name or email. Telemetry is off unless you enable it.",
  },
  {
    h: "What we do NOT collect",
    p: "We do not collect your name, email, IP address, or your source code (unless you explicitly choose to share it). We do not use third-party advertising or tracking.",
  },
  {
    h: "Research study data",
    p: "If you join our study, your responses (consent, demographics, tests, and surveys) are collected via Google Forms and linked only by an anonymous participant code. Aggregated, anonymized results may appear in an academic publication (IEEE PuneCon 2026).",
  },
  {
    h: "Your control",
    p: "Participation and telemetry are voluntary. You can decline, opt out, or stop at any time. Code runs locally; nothing is uploaded without your action.",
  },
  {
    h: "Contact",
    p: "Questions about privacy or the study can be sent to the contact email below.",
  },
];

export default function Privacy() {
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
          Privacy
        </h1>
        <p className="mt-3 text-[13px] text-zinc-500">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-zinc-100">{s.h}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
                {s.p}
              </p>
            </section>
          ))}
          <p className="text-[14px] text-zinc-400">
            <a href={`mailto:${site.email}`} className="text-sky-400 underline">
              {site.email}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
