"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/features/Features";
import { Screenshot } from "@/components/ui/Screenshot";

const tabs = [
  { label: "Array", slug: "array" },
  { label: "Stack", slug: "stack" },
  { label: "Binary Tree", slug: "tree" },
  { label: "Graph", slug: "graph" },
] as const;
type Tab = (typeof tabs)[number]["label"];

export default function Demo() {
  const [tab, setTab] = useState<Tab>("Array");
  const active = tabs.find((t) => t.label === tab)!;

  return (
    <section id="demo" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Showcase"
        title="One tool, every structure"
        subtitle="Switch between structures and watch how AlgoLens renders each one."
      />

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.slug}
            onClick={() => setTab(t.label)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
              tab === t.label
                ? "bg-sky-500 text-white"
                : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Drop /public/screenshots/{array,stack,tree,graph}.png to replace mocks. */}
      <div className="mx-auto mt-8 max-w-4xl">
        <Screenshot
          src={`/screenshots/${active.slug}.png`}
          alt={`AlgoLens visualizing a ${tab}`}
          title={`Visualizer — ${tab}`}
        >
          <div className="grid h-full place-items-center [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px]">
            {tab === "Array" && <ArrayView />}
            {tab === "Stack" && <StackView />}
            {tab === "Binary Tree" && <TreeView />}
            {tab === "Graph" && <GraphView />}
          </div>
        </Screenshot>
      </div>
    </section>
  );
}

function Box({ children, color = "bg-[#2d3748]" }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className={`grid size-12 place-items-center rounded-lg ${color} text-sm font-medium text-zinc-100 ring-1 ring-inset ring-white/10`}
    >
      {children}
    </div>
  );
}

function ArrayView() {
  const data = [
    { v: 3, c: "bg-emerald-600" },
    { v: 5, c: "bg-emerald-600" },
    { v: 8, c: "bg-rose-600" },
    { v: 4, c: "bg-rose-600" },
    { v: 9, c: "bg-[#2d3748]" },
    { v: 1, c: "bg-[#2d3748]" },
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {data.map((d, i) => (
          <Box key={i} color={d.c}>
            {d.v}
          </Box>
        ))}
      </div>
      <div className="flex gap-2 text-[11px] text-sky-400">
        <span className="w-12 text-center">i</span>
        <span className="w-12 text-center opacity-0">.</span>
        <span className="w-12 text-center">j</span>
      </div>
    </div>
  );
}

function StackView() {
  const data = [40, 30, 20, 10];
  return (
    <div className="flex flex-col items-center gap-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`grid h-10 w-28 place-items-center rounded-md text-sm font-medium text-zinc-100 ring-1 ring-inset ring-white/10 ${
              i === 0 ? "bg-sky-600" : "bg-[#2d3748]"
            }`}
          >
            {d}
          </div>
          {i === 0 && <span className="text-[11px] text-sky-400">← top</span>}
        </div>
      ))}
      <div className="mt-1 h-1 w-28 rounded bg-white/10" />
    </div>
  );
}

function Node({ v, accent }: { v: number; accent?: boolean }) {
  return (
    <div
      className={`grid size-10 place-items-center rounded-full text-sm font-medium text-white ring-1 ring-inset ring-white/10 ${
        accent ? "bg-sky-600" : "bg-[#2d3748]"
      }`}
    >
      {v}
    </div>
  );
}

function TreeView() {
  return (
    <div className="flex flex-col items-center gap-5">
      <Node v={8} accent />
      <div className="flex gap-16">
        <div className="flex flex-col items-center gap-5">
          <Node v={3} />
          <div className="flex gap-6">
            <Node v={1} />
            <Node v={6} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-5">
          <Node v={10} />
          <div className="flex gap-6 opacity-60">
            <span className="size-10" />
            <Node v={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function GraphView() {
  // simple circular layout with 5 nodes
  const nodes = [0, 1, 2, 3, 4];
  const R = 90;
  const cx = 110;
  const cy = 110;
  const pos = nodes.map((_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / nodes.length;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [3, 4],
  ];
  return (
    <svg width={220} height={220} className="overflow-visible">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={pos[a].x}
          y1={pos[a].y}
          x2={pos[b].x}
          y2={pos[b].y}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.5}
        />
      ))}
      {pos.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={16}
            className={i === 0 ? "fill-sky-600" : "fill-[#2d3748]"}
            stroke="rgba(255,255,255,0.12)"
          />
          <text
            x={p.x}
            y={p.y + 4}
            textAnchor="middle"
            className="fill-white text-[12px] font-medium"
          >
            {i}
          </text>
        </g>
      ))}
    </svg>
  );
}
