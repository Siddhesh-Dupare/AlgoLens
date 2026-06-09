"use client";

import { useState, useEffect } from "react";
import type { MenuItem } from "./menubar.types";
import MenuBarSeparator from "./MenuBarSeparator";
import { useTelemetryStore } from "@/store/useTelemetryStore";

function handleMenuAction(id: string): void {
  switch (id) {
    case "file-new":
      window.dispatchEvent(new CustomEvent("algolens:file-new"));
      console.log("New File");
      break;
    case "edit-undo":
      console.log("Undo");
      break;
    case "edit-redo":
      console.log("Redo");
      break;
    case "edit-find":
      window.dispatchEvent(new CustomEvent("algolens:find"));
      break;
    case "edit-replace":
      window.dispatchEvent(new CustomEvent("algolens:replace"));
      break;
    case "view-command-palette":
      window.dispatchEvent(new CustomEvent("algolens:command-palette"));
      break;
    case "view-zoom-in":
      window.dispatchEvent(
        new CustomEvent("algolens:zoom", { detail: { direction: "in" } }),
      );
      break;
    case "view-zoom-out":
      window.dispatchEvent(
        new CustomEvent("algolens:zoom", { detail: { direction: "out" } }),
      );
      break;
    case "view-zoom-reset":
      window.dispatchEvent(
        new CustomEvent("algolens:zoom", { detail: { direction: "reset" } }),
      );
      break;
    case "view-explorer":
      window.dispatchEvent(new CustomEvent("algolens:toggle-explorer"));
      break;
    case "view-terminal":
      window.dispatchEvent(new CustomEvent("algolens:toggle-terminal"));
      break;
    case "view-toggle-minimap":
      window.dispatchEvent(new CustomEvent("algolens:toggle-minimap"));
      break;
    case "view-toggle-wordwrap":
      window.dispatchEvent(new CustomEvent("algolens:toggle-wordwrap"));
      break;
    case "lang-python":
      window.dispatchEvent(
        new CustomEvent("algolens:set-language", {
          detail: { language: "python" },
        }),
      );
      break;
    case "lang-javascript":
      window.dispatchEvent(
        new CustomEvent("algolens:set-language", {
          detail: { language: "javascript" },
        }),
      );
      break;
    case "lang-cpp":
      window.dispatchEvent(
        new CustomEvent("algolens:set-language", {
          detail: { language: "cpp" },
        }),
      );
      break;
    case "lang-c":
      window.dispatchEvent(
        new CustomEvent("algolens:set-language", { detail: { language: "c" } }),
      );
      break;
    case "lang-java":
      window.dispatchEvent(
        new CustomEvent("algolens:set-language", {
          detail: { language: "java" },
        }),
      );
      break;
    case "help-about":
      window.dispatchEvent(new CustomEvent("algolens:show-about"));
      break;
    case "help-shortcuts":
      window.dispatchEvent(new CustomEvent("algolens:show-shortcuts"));
      break;
    case "help-benchmark":
      window.dispatchEvent(new CustomEvent("algolens:run-benchmark"));
      break;
    case "help-performance":
      window.dispatchEvent(new CustomEvent("algolens:show-performance"));
      break;
    case "help-export-study":
      useTelemetryStore.getState().exportData();
      break;
    case "file-open-folder":
      window.dispatchEvent(new CustomEvent("algolens:open-folder"));
      break;
    default:
      console.log("Menu action:", id);
  }
}

interface MenuBarDropdownProps {
  items: MenuItem[];
  onClose: () => void;
}

interface ActionRowProps {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  onClose: () => void;
}

function ActionRow({
  id,
  label,
  shortcut,
  disabled,
  checked,
  onClose,
}: ActionRowProps) {
  const [hovered, setHovered] = useState(false);
  const isHovered = hovered && !disabled;

  return (
    <div
      role="menuitemcheckbox"
      aria-disabled={disabled ? true : undefined}
      aria-checked={checked ? true : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (disabled) return;
        handleMenuAction(id);
        onClose();
      }}
      className={`flex pl-1 pr-1 my-1 text-base rounded-0.75 items-center justify-between gap-6
        ${disabled ? "cursor-default" : "cursor-pointer"}
        ${disabled ? "text-neutral-500" : isHovered ? "text-white" : "text-neutral-300"}
        ${isHovered ? "bg-sky-900" : "bg-transparent"}`}
    >
      <span className="flex items-center gap-4">
        <span className="w-3.5 shrink-0 items-center text-blue-400">
          {checked ? "✓" : ""}
        </span>
        {label}
      </span>
      {shortcut ? (
        <span
          className={`text-sm whitespace-nowrap text-${
            disabled ? "neutral-700" : "neutral-400"
          }`}
        >
          {shortcut}
        </span>
      ) : null}
    </div>
  );
}

export default function MenuBarDropdown({
  items,
  onClose,
}: MenuBarDropdownProps) {
  const [wordWrapEnabled, setWordWrapEnabled] = useState(false);
  const [minimapEnabled, setMinimapEnabled] = useState(false);

  useEffect(() => {
    const onWrap = (e: Event) =>
      setWordWrapEnabled((e as CustomEvent).detail.enabled);
    const onMinimap = (e: Event) =>
      setMinimapEnabled((e as CustomEvent).detail.enabled);
    window.addEventListener("algolens:wordwrap-state", onWrap);
    window.addEventListener("algolens:minimap-state", onMinimap);
    // Ask the editor for the current toggle state (this menu mounts fresh each
    // time it opens, so it would otherwise miss earlier state-change events).
    window.dispatchEvent(new CustomEvent("algolens:request-toggle-state"));
    return () => {
      window.removeEventListener("algolens:wordwrap-state", onWrap);
      window.removeEventListener("algolens:minimap-state", onMinimap);
    };
  }, []);

  const checkedFor = (id: string): boolean | undefined => {
    if (id === "view-toggle-wordwrap") return wordWrapEnabled;
    if (id === "view-toggle-minimap") return minimapEnabled;
    return undefined;
  };

  return (
    <div
      role="menu"
      className="absolute top-full left-0 min-w-60 bg-neutral-800 border border-neutral-700 rounded-1.25 z-200 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
    >
      {items.map((item) =>
        item.type === "separator" ? (
          <MenuBarSeparator key={item.id} />
        ) : (
          <ActionRow
            key={item.id}
            id={item.id}
            label={item.label}
            shortcut={item.shortcut}
            disabled={item.disabled}
            checked={checkedFor(item.id)}
            onClose={onClose}
          />
        ),
      )}
    </div>
  );
}
