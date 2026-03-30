/** @jest-environment jsdom */

import { renderHook, act } from "@testing-library/react";
import { useHistory } from "../useHistory";

describe("useHistory", () => {
  // ─── Initial state ───────────────────────────────────────────────────────────

  it("returns the initial value", () => {
    const { result } = renderHook(() => useHistory("init"));
    expect(result.current.state).toBe("init");
  });

  it("starts with canUndo and canRedo both false", () => {
    const { result } = renderHook(() => useHistory(0));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  // ─── set() ────────────────────────────────────────────────────────────────────

  it("updates state when set() is called with a value", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    expect(result.current.state).toBe("b");
  });

  it("sets canUndo to true after set()", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("supports functional updater form", () => {
    const { result } = renderHook(() => useHistory(10));
    act(() => result.current.set((prev) => prev + 5));
    expect(result.current.state).toBe(15);

    act(() => result.current.set((prev) => prev * 2));
    expect(result.current.state).toBe(30);
  });

  // ─── undo() ───────────────────────────────────────────────────────────────────

  it("undoes to the previous state", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.undo());
    expect(result.current.state).toBe("a");
  });

  it("does nothing when undo is called with no history", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.undo());
    expect(result.current.state).toBe("a");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("sets canUndo to false when past is exhausted", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
  });

  it("sets canRedo to true after undo", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
  });

  // ─── redo() ───────────────────────────────────────────────────────────────────

  it("redoes to the next state", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.state).toBe("b");
  });

  it("does nothing when redo is called with no future", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.redo());
    expect(result.current.state).toBe("a");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("sets canUndo to true after redo", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.canUndo).toBe(true);
  });

  it("sets canRedo to false when future is exhausted", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.canRedo).toBe(false);
  });

  // ─── Multi-step undo/redo ─────────────────────────────────────────────────────

  it("handles multiple undo/redo steps correctly", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.set("c"));
    act(() => result.current.set("d"));

    // undo back to "a"
    act(() => result.current.undo()); // d -> c
    expect(result.current.state).toBe("c");
    act(() => result.current.undo()); // c -> b
    expect(result.current.state).toBe("b");
    act(() => result.current.undo()); // b -> a
    expect(result.current.state).toBe("a");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // redo back to "d"
    act(() => result.current.redo()); // a -> b
    expect(result.current.state).toBe("b");
    act(() => result.current.redo()); // b -> c
    expect(result.current.state).toBe("c");
    act(() => result.current.redo()); // c -> d
    expect(result.current.state).toBe("d");
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  // ─── set() clears redo history ────────────────────────────────────────────────

  it("clears redo history when set() is called after undo", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b"));
    act(() => result.current.set("c"));
    act(() => result.current.undo()); // c -> b
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.set("x")); // new branch from "b"
    expect(result.current.state).toBe("x");
    expect(result.current.canRedo).toBe(false);

    // undo should go back to "b", not "c"
    act(() => result.current.undo());
    expect(result.current.state).toBe("b");
  });

  // ─── History cap at MAX_HISTORY (80) ──────────────────────────────────────────

  it("caps past history at 80 entries", () => {
    const { result } = renderHook(() => useHistory(0));

    // Push 85 values (0 is initial, then 1..85)
    for (let i = 1; i <= 85; i++) {
      act(() => result.current.set(i));
    }
    expect(result.current.state).toBe(85);

    // Undo 80 times (the max) — should reach value 5
    // Past stores at most 79 entries (MAX_HISTORY - 1 = 79 sliced, but we
    // keep pushing the prev.value each time, so we have 80 entries total
    // including the one being pushed). Let's just undo until canUndo is false.
    let undoCount = 0;
    while (result.current.canUndo) {
      act(() => result.current.undo());
      undoCount++;
    }
    // Should have been able to undo at most 80 times
    expect(undoCount).toBeLessThanOrEqual(80);
    expect(result.current.canUndo).toBe(false);
  });

  // ─── Works with object types ──────────────────────────────────────────────────

  it("works with object state values", () => {
    const { result } = renderHook(() =>
      useHistory({ count: 0, name: "test" })
    );

    act(() => result.current.set({ count: 1, name: "test" }));
    expect(result.current.state).toEqual({ count: 1, name: "test" });

    act(() => result.current.set((prev) => ({ ...prev, count: prev.count + 1 })));
    expect(result.current.state).toEqual({ count: 2, name: "test" });

    act(() => result.current.undo());
    expect(result.current.state).toEqual({ count: 1, name: "test" });
  });
});
