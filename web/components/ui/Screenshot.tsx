"use client";

import { useState } from "react";

// A framed "app window" slot. Drop a real image at `src` (in /public) and it
// replaces the `children` fallback automatically. Until the image exists, the
// fallback (a CSS mock) is shown — so the site always looks complete.
export function Screenshot({
  src,
  alt,
  title,
  ratio = "aspect-[16/10]",
  children,
}: {
  src: string;
  alt: string;
  title?: string;
  ratio?: string;
  children?: React.ReactNode;
}) {
  const [ok, setOk] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0e11] shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 border-b border-white/6 bg-[#1b1d22] px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        {title && (
          <span className="ml-3 text-[11px] text-zinc-500">{title}</span>
        )}
      </div>
      <div className={`relative w-full overflow-hidden bg-[#0a0a0c] ${ratio}`}>
        {children && <div className="absolute inset-0">{children}</div>}
        {ok && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
