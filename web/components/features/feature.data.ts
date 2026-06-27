import {
  Boxes,
  StepForward,
  Layers,
  Code2,
  Cpu,
  TerminalSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const features: Feature[] = [
  {
    title: "Every data structure",
    description:
      "Arrays, strings, stacks, queues, linked lists, binary trees, graphs and hash maps — each with a purpose-built, animated view.",
    icon: Boxes,
  },
  {
    title: "Step-by-step debugging",
    description:
      "Run or debug your real code and watch it execute line by line, with pointers, highlights and the current line tracked.",
    icon: StepForward,
  },
  {
    title: "Scope-aware picture-in-picture",
    description:
      "Enter a function and its structures stay visible. Other structures park into thumbnails and pop back when they change.",
    icon: Layers,
  },
  {
    title: "Multi-language",
    description:
      "Write in Python, JavaScript, C++ or Java. AlgoLens traces real execution — not a hard-coded animation.",
    icon: Code2,
  },
  {
    title: "Native performance",
    description:
      "A native C++/OpenGL renderer draws smooth, GPU-accelerated visuals with playback, seek and adjustable speed.",
    icon: Cpu,
  },
  {
    title: "Editor + terminal built in",
    description:
      "A full code editor with syntax highlighting and an integrated terminal (PowerShell or Git Bash) — all in one window.",
    icon: TerminalSquare,
  },
];
