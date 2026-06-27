import { PenLine, Bug, Eye, GraduationCap } from "lucide-react";
import { SectionHeading } from "@/components/features/Features";

const steps = [
  {
    icon: PenLine,
    title: "Write your code",
    text: "Open the editor and write (or paste) an algorithm in Python, JavaScript, C++ or Java.",
  },
  {
    icon: Bug,
    title: "Run or Debug",
    text: "Hit Run to execute, or Debug to capture every step of the program's execution.",
  },
  {
    icon: Eye,
    title: "Watch it visualize",
    text: "Step, play, seek and adjust speed as your structures animate exactly how your code changes them.",
  },
  {
    icon: GraduationCap,
    title: "Understand",
    text: "See the why behind each operation — pointers, swaps, traversals and recursion, made concrete.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-white/[0.06] bg-[#08090b]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From code to insight in four steps"
        />

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="relative">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-sky-400">
                    <Icon className="size-4.5" />
                  </div>
                  <span className="font-mono text-[13px] text-zinc-600">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-zinc-100">
                  {s.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                  {s.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
