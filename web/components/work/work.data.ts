type Step = {
  id: string;
  title: string;
  description: string;
};

export const steps: Step[] = [
  {
    id: "01",
    title: "Write C++ Code",
    description: "Create or paste your algorithm into the editor.",
  },
  {
    id: "02",
    title: "Analyze",
    description: "LibClang parses your code and builds its structure.",
  },
  {
    id: "03",
    title: "Generate Trace",
    description: "Track variables, memory, and control flow.",
  },
  {
    id: "04",
    title: "Visualize",
    description: "Watch algorithms and data structures come to life.",
  },
  {
    id: "05",
    title: "Understand & Optimize",
    description: "Discover patterns and improve your solutions.",
  },
];
