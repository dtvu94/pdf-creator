import { useEffect } from "react";

interface UseKeyboardShortcutsParams {
  undo: () => void;
  redo: () => void;
  copySelected: () => void;
  pasteElements: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
}

export function useKeyboardShortcuts(params: UseKeyboardShortcutsParams) {
  const {
    undo,
    redo,
    copySelected,
    pasteElements,
    duplicateSelected,
    deleteSelected,
    selectAll,
  } = params;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && e.key === "c") {
        e.preventDefault();
        copySelected();
      } else if (mod && e.key === "v") {
        e.preventDefault();
        pasteElements();
      } else if (mod && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (mod && e.key === "a") {
        e.preventDefault();
        selectAll();
      }
    };

    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
  });
}
