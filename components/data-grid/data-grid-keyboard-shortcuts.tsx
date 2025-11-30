"use client";

import { Keyboard } from "lucide-react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DataGridKeyboardShortcutsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DataGridKeyboardShortcuts({
  open = false,
  onOpenChange,
}: DataGridKeyboardShortcutsProps) {
  const shortcuts = [
    {
      category: "Navigation",
      items: [
        { keys: ["Arrow Keys"], description: "Move between cells" },
        { keys: ["Tab"], description: "Move to next cell" },
        { keys: ["Shift", "Tab"], description: "Move to previous cell" },
        { keys: ["Home"], description: "Move to first cell in row" },
        { keys: ["End"], description: "Move to last cell in row" },
        { keys: ["Ctrl", "Home"], description: "Move to first cell" },
        { keys: ["Ctrl", "End"], description: "Move to last cell" },
        { keys: ["Page Up"], description: "Move up one page" },
        { keys: ["Page Down"], description: "Move down one page" },
      ],
    },
    {
      category: "Selection",
      items: [
        { keys: ["Ctrl", "A"], description: "Select all cells" },
        { keys: ["Shift", "Arrow Keys"], description: "Extend selection" },
        { keys: ["Escape"], description: "Clear selection" },
      ],
    },
    {
      category: "Editing",
      items: [
        { keys: ["Enter"], description: "Start editing cell" },
        { keys: ["F2"], description: "Start editing cell" },
        { keys: ["Escape"], description: "Cancel editing" },
        { keys: ["Delete"], description: "Clear selected cells" },
        { keys: ["Backspace"], description: "Clear selected cells" },
      ],
    },
    {
      category: "Clipboard",
      items: [
        { keys: ["Ctrl", "C"], description: "Copy selected cells" },
        { keys: ["Ctrl", "X"], description: "Cut selected cells" },
        { keys: ["Ctrl", "V"], description: "Paste from clipboard" },
      ],
    },
    {
      category: "Search",
      items: [
        { keys: ["Ctrl", "F"], description: "Open search" },
        { keys: ["Enter"], description: "Navigate to next match" },
        { keys: ["Shift", "Enter"], description: "Navigate to previous match" },
        { keys: ["Escape"], description: "Close search" },
      ],
    },
  ];

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => {
      const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
      const displayKey = key === "Ctrl" && isMac ? "⌘" : key;
      
      return (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-1">+</span>}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {displayKey}
          </kbd>
        </React.Fragment>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-grid-popover="" className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Keyboard shortcuts for navigating and editing the data grid
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="mb-3 text-sm font-semibold">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-1">
                      {formatKeys(item.keys)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

