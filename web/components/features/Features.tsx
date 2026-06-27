import { features } from "./feature.data";

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need to understand an algorithm"
        subtitle="Not slides, not a fixed animation — AlgoLens visualizes the actual execution of your code."
      />

      <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group bg-[#0c0d10] p-6 transition-colors hover:bg-[#101216]"
            >
              <div className="grid size-10 place-items-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-zinc-100">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-semibold uppercase tracking-widest text-sky-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-pretty text-[15px] leading-relaxed text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
