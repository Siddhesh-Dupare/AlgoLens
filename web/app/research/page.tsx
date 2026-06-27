import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Minus, ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Research — AlgoLens",
  description:
    "AlgoLens research: motivation, contributions, comparison with existing tools, and the user study for IEEE PuneCon 2026.",
};

const contributions = [
  "Real multi-language execution (Python, JavaScript, C++, Java) traced step by step — not pre-scripted animations.",
  "A unified visual model spanning arrays, strings, stacks, queues, linked lists, trees, graphs and hash maps.",
  "A scope-aware, picture-in-picture view that keeps a structure visible across function calls and recursion.",
  "A native (C++/OpenGL) renderer for smooth playback, seeking and adjustable speed.",
];

// Comparison rows: AlgoLens, VisuAlgo, Python Tutor, Algorithm Visualizer
const compare = [
  ["Run your own code", true, false, true, true],
  ["Multiple languages", true, false, true, false],
  ["Step-by-step execution", true, true, true, true],
  ["Native / GPU rendering", true, false, false, false],
  ["Scope picture-in-picture", true, false, false, false],
  ["Integrated editor + terminal", true, false, false, false],
  ["Open source", true, false, true, true],
] as const;

const tools = ["AlgoLens", "VisuAlgo", "Python Tutor", "Algo Viz"];

export default function Research() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <p className="mt-8 text-[12px] font-semibold uppercase tracking-widest text-sky-400">
          Research · IEEE PuneCon 2026
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Visualizing real code execution to teach data structures
        </h1>

        {/* Abstract */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-100">Abstract</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">
            Data structures and algorithms are often taught with static diagrams
            that hide how a structure actually changes as a program runs.
            AlgoLens is an open-source desktop tool that executes a learner&apos;s
            own code in Python, JavaScript, C++ or Java and renders the resulting
            data structures step by step. We describe its architecture and report
            a user study measuring learning gains, usability and cognitive load.
          </p>
        </section>

        {/* Problem */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-100">The problem</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">
            Existing visualizers either animate a fixed, built-in algorithm
            (you can&apos;t run your own code) or show execution without a clear
            picture of the data structures involved. Neither lets a student see
            <span className="text-zinc-200"> their own program</span> transform a
            structure in real time, across function calls and recursion.
          </p>
        </section>

        {/* Contributions */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-100">Contributions</h2>
          <ul className="mt-4 space-y-3">
            {contributions.map((c) => (
              <li key={c} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-sky-400" />
                <span className="text-[14px] leading-relaxed text-zinc-400">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Comparison */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-100">
            How AlgoLens compares
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white/[0.03] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Capability</th>
                  {tools.map((t) => (
                    <th
                      key={t}
                      className={`px-3 py-3 text-center font-medium ${
                        t === "AlgoLens" ? "text-sky-400" : ""
                      }`}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compare.map((row) => (
                  <tr
                    key={row[0] as string}
                    className="border-t border-white/[0.06]"
                  >
                    <td className="px-4 py-3 text-zinc-300">{row[0]}</td>
                    {(row.slice(1) as boolean[]).map((v, i) => (
                      <td key={i} className="px-3 py-3 text-center">
                        {v ? (
                          <Check className="mx-auto size-4 text-emerald-400" />
                        ) : (
                          <Minus className="mx-auto size-4 text-zinc-600" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Comparison reflects typical configurations at the time of writing.
          </p>
        </section>

        {/* Evaluation */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-100">Evaluation</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">
            We evaluate AlgoLens with a user study: a pre/post concept test
            (normalized learning gain), the System Usability Scale (SUS), and the
            NASA-TLX workload measure, supported by anonymous in-app usage
            telemetry.
          </p>
          <Link
            href="/participate"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400"
          >
            Participate in the study <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* Publication */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-100">Publication</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">
            The paper is in preparation for IEEE PuneCon 2026. A preprint and
            citation will be added here once available.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0c0d10] p-4 font-mono text-[12px] leading-relaxed text-zinc-400">
{`@inproceedings{algolens2026,
  title     = {AlgoLens: Visualizing Real Code Execution
               to Teach Data Structures},
  author    = {Dupare, Siddhesh and others},
  booktitle = {IEEE PuneCon},
  year      = {2026},
  note      = {To appear}
}`}
          </pre>
          <p className="mt-4 text-[13px] text-zinc-500">
            Questions:{" "}
            <a href={`mailto:${site.email}`} className="text-sky-400 underline">
              {site.email}
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
