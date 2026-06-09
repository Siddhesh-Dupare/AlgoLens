"use client";

import { useEffect, useRef, useState } from "react";
import { MENU_DATA } from "./menubar.data";
import MenuBarItem from "./MenuBarItem";

import { Button } from "@/components/ui/button";

// Ask the native shell (CEF) to act on the window. No-op in a normal browser.
function nativeWindow(method: string) {
  if (typeof window !== "undefined" && typeof window.cefQuery === "function") {
    window.cefQuery({
      request: JSON.stringify({ method }),
      onSuccess: () => {},
      onFailure: () => {},
    });
  }
}

type WindowControl = {
  id: string;
  label: string;
  symbol: string;
  method: string;
};

const WINDOW_CONTROLS: WindowControl[] = [
  {
    id: "min",
    label: "Minimize",
    symbol: "─",
    method: "minimizeWindow",
  },
  {
    id: "max",
    label: "Maximize",
    symbol: "□",
    method: "toggleMaximizeWindow",
  },
  {
    id: "close",
    label: "Close",
    symbol: "✕",
    method: "closeWindow",
  },
];

function WindowButton({ control }: { control: WindowControl }) {
  return (
    <Button
      className={`flex w-10.5 h-7.5 text-neutral-400 items-center justify-center text-md cursor-pointer ${
        control.id === "close"
          ? "hover:bg-red-600 hover:text-white"
          : "hover:bg-neutral-700 hover:text-neutral-400"
      }`}
      variant="ghost"
    >
      {control.symbol}
    </Button>
  );
}

export default function MenuBar() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-7.5 text-3.25 relative z-100 flex-row items-center shrink-0 pl-2.5 overflow-visible font-sans bg-neutral-800 border border-b-neutral-800"
    >
      {MENU_DATA.map((menu) => (
        <MenuBarItem
          key={menu.id}
          menu={menu}
          isOpen={openMenuId === menu.id}
          onOpen={() => setOpenMenuId(menu.id)}
          onClose={() => setOpenMenuId(null)}
          onHover={() => {
            if (openMenuId !== null) setOpenMenuId(menu.id);
          }}
        />
      ))}

      {/* Draggable region — the empty space acts like a native title bar:
          drag to move the window, double-click to maximize/restore. (Native
          shell only; no-op in a browser.) */}
      <div
        onMouseDown={(e) => {
          if (e.button === 0) nativeWindow("startWindowDrag");
        }}
        onDoubleClick={() => nativeWindow("toggleMaximizeWindow")}
        className="flex flex-1 self-stretch"
      />

      <div className="flex">
        {WINDOW_CONTROLS.map((control) => (
          <WindowButton key={control.id} control={control} />
        ))}
      </div>
    </div>
  );
}
