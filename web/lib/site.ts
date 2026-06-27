// Central site config — update these links in one place.
export const site = {
  name: "AlgoLens",
  tagline: "See your data structures come alive.",
  description:
    "AlgoLens is an open-source desktop tool that runs your real code and visualizes data structures — arrays, stacks, queues, linked lists, trees, graphs and more — step by step.",
  github: "https://github.com/Siddhesh-Dupare/AlgoLens",
  download: "https://github.com/Siddhesh-Dupare/AlgoLens/releases",
  paper: "#",
  email: "siddheshdupare92@gmail.com",
} as const;

// The study's Google Forms, in the order participants complete them.
export const forms = {
  consent: "https://forms.gle/snYzS3x1XmfgYv9r8",
  demographics: "https://forms.gle/o6Q2mFs1pTSAwB5X6",
  preTest: "https://forms.gle/XM8ZzC9yrKu2eEX69",
  postTest: "https://forms.gle/nVrrUPoKdswQPoUW9",
  sus: "https://forms.gle/vFntdNLLVoNDUdxu9",
  nasaTlx: "https://forms.gle/2R2TFrJVe8QcJSaA9",
} as const;

export const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Demo", href: "#demo" },
  { label: "Download", href: "#download" },
] as const;
