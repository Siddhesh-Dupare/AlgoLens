"use client";

import { useEffect, useRef, useState } from "react";
import { File, Folder } from "lucide-react";

interface FileExplorerNewInputProps {
  depth: number;
  type: "file" | "folder";
  initialValue?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function FileExplorerNewInput({
  depth,
  type,
  initialValue = "",
  onConfirm,
  onCancel,
}: FileExplorerNewInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  // Guard so onBlur doesn't double-fire after Enter/Escape already resolved.
  const settledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const confirm = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    if (value.trim()) onConfirm(value.trim());
    else onCancel();
  };

  const cancel = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    onCancel();
  };

  const Icon = type === "folder" ? Folder : File;

  return (
    <div className={`flex items-center h-6 gap-6 pr-2 pl-${depth * 16 + 8}`}>
      <Icon size={14} color="#8a8a8a" style={{ flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && value.trim()) confirm();
          if (e.key === "Escape") cancel();
        }}
        onBlur={confirm}
        onClick={(e) => e.stopPropagation()}
        className="w-full px-py px-1.5 border border-sky-600 rounded-sm text-xs text-neutral-300 bg-neutral-700"
      />
    </div>
  );
}
