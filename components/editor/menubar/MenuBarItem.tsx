"use client";

import type { TopLevelMenu } from "./menubar.types";
import MenuBarDropdown from "./MenuBarDropdown";

import { Button } from "@/components/ui/button";

interface MenuBarItemProps {
  menu: TopLevelMenu;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onHover: () => void;
}

export default function MenuBarItem({
  menu,
  isOpen,
  onOpen,
  onClose,
  onHover,
}: MenuBarItemProps) {
  return (
    <div className="relative h-7.5">
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${menu.label} menu`}
        onClick={() => (isOpen ? onClose() : onOpen())}
        onMouseEnter={onHover}
        className={`select-none cursor-pointer rounded-[3px] whitespace-nowrap text-neutral-300
          ${
            isOpen
              ? "bg-sky-900 text-white"
              : "hover:bg-neutral-700 hover:text-white"
          }
        `}
      >
        {menu.label}
      </Button>

      {isOpen && <MenuBarDropdown items={menu.items} onClose={onClose} />}
    </div>
  );
}
