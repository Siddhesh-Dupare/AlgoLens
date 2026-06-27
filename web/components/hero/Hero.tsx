import { Download, Sparkles } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { Screenshot } from "@/components/ui/Screenshot";
import { site } from "@/lib/site";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-400">
            <Sparkles className="size-3.5 text-sky-400" />
            Open source · MIT · IEEE PuneCon 2026
          </div>

          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-50 sm:text-6xl">
            See your data structures{" "}
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              come alive
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-zinc-400">
            {site.description}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href={site.download}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400"
            >
              <Download className="size-4" /> Download Beta
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07]"
            >
              <GithubIcon className="size-4" /> View on GitHub
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-zinc-500">
            <span>Python</span>
            <span className="text-zinc-700">•</span>
            <span>JavaScript</span>
            <span className="text-zinc-700">•</span>
            <span>C++</span>
            <span className="text-zinc-700">•</span>
            <span>Java</span>
          </div>
        </div>

        {/* Product shot — drop /public/screenshots/hero.png to replace the mock. */}
        <div className="mx-auto mt-14 max-w-4xl">
          <Screenshot
            src="/screenshots/hero.png"
            alt="AlgoLens visualizing bubble sort"
            title="AlgoLens — bubble_sort.py"
          >
            <HeroMock />
          </Screenshot>
        </div>
      </div>
    </section>
  );
}

// CSS fallback shown until a real hero screenshot is added.
function HeroMock() {
  return (
    <div className="grid h-full grid-cols-1 sm:grid-cols-2">
      <div className="border-b border-white/[0.06] p-4 font-mono text-[12px] leading-6 sm:border-b-0 sm:border-r">
        <Line n={1}>
          <span className="text-violet-400">def</span>{" "}
          <span className="text-sky-400">bubble_sort</span>
          <span className="text-zinc-400">(arr):</span>
        </Line>
        <Line n={2} active>
          {"  "}
          <span className="text-violet-400">for</span> i{" "}
          <span className="text-violet-400">in</span>{" "}
          <span className="text-sky-400">range</span>
          <span className="text-zinc-400">(len(arr)):</span>
        </Line>
        <Line n={3}>
          {"    "}
          <span className="text-violet-400">for</span> j{" "}
          <span className="text-violet-400">in</span> ...
        </Line>
        <Line n={4}>
          {"      "}
          <span className="text-violet-400">if</span> arr[j]{" "}
          <span className="text-zinc-400">&gt;</span> arr[j+
          <span className="text-amber-400">1</span>]:
        </Line>
        <Line n={5}>
          {"        "}arr[j], arr[j+<span className="text-amber-400">1</span>] = ...
        </Line>
      </div>

      <div className="relative bg-[#0a0a0c] p-5 [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:18px_18px]">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="flex items-end gap-1.5">
            {[
              { v: 5, c: "bg-zinc-700" },
              { v: 2, c: "bg-rose-500" },
              { v: 8, c: "bg-rose-500" },
              { v: 1, c: "bg-zinc-700" },
              { v: 9, c: "bg-zinc-700" },
              { v: 3, c: "bg-sky-500" },
            ].map((b, i) => (
              <div
                key={i}
                className={`grid w-7 place-items-center rounded-md ${b.c} text-[11px] font-medium text-white`}
                style={{ height: `${28 + b.v * 7}px` }}
              >
                {b.v}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-rose-500" /> compare
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-sky-500" /> active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({
  n,
  active,
  children,
}: {
  n: number;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex gap-3 whitespace-pre rounded px-1 ${
        active ? "bg-amber-500/10 shadow-[inset_2px_0_0_#f59e0b]" : ""
      }`}
    >
      <span className="select-none text-zinc-600">{n}</span>
      <span className="text-zinc-300">{children}</span>
    </div>
  );
}
