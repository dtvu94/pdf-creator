"use client";

import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 80;

export interface HistoryControls<T> {
  state: T;
  set: (next: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface HistorySnapshot<T> {
  value: T;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * A lightweight undo/redo hook that tracks a linear history stack.
 * - `set()` pushes a new snapshot and clears redo history.
 * - `undo()` / `redo()` navigate the stack.
 * - History is capped at MAX_HISTORY entries for memory safety.
 */
export function useHistory<T>(initial: T): HistoryControls<T> {
  const [snapshot, setSnapshot] = useState<HistorySnapshot<T>>({
    value: initial,
    canUndo: false,
    canRedo: false,
  });
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setSnapshot((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev.value) : next;
      past.current = [...past.current.slice(-(MAX_HISTORY - 1)), prev.value];
      future.current = [];
      return { value: resolved, canUndo: true, canRedo: false };
    });
  }, []);

  const undo = useCallback(() => {
    setSnapshot((prev) => {
      if (past.current.length === 0) return prev;
      const previous = past.current[past.current.length - 1];
      past.current = past.current.slice(0, -1);
      future.current = [prev.value, ...future.current];
      return { value: previous, canUndo: past.current.length > 0, canRedo: true };
    });
  }, []);

  const redo = useCallback(() => {
    setSnapshot((prev) => {
      if (future.current.length === 0) return prev;
      const next = future.current[0];
      future.current = future.current.slice(1);
      past.current = [...past.current, prev.value];
      return { value: next, canUndo: true, canRedo: future.current.length > 0 };
    });
  }, []);

  return {
    state: snapshot.value,
    set,
    undo,
    redo,
    canUndo: snapshot.canUndo,
    canRedo: snapshot.canRedo,
  };
}
