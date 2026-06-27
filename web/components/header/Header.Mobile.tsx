import { useState, useRef, useEffect } from "react";

import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => setIsOpen((s) => !s);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (isOpen && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative md:hidden">
      <Button
        variant="outline"
        size="icon-lg"
        onClick={toggle}
        aria-expanded={isOpen}
        arial-label={isOpen ? "Close menu" : "Open menu"}
        className="p-2 rounded-md hover:bg-gray-100"
      >
        {isOpen ? <X /> : <Menu />}
      </Button>
    </div>
  );
}
