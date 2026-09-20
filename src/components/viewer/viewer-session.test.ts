import { describe, expect, it, vi } from "vitest";
import { destroyViewer, type ViewerSession } from "./viewer-session";

describe("destroyViewer", () => {
  it("disconnects observers, removes handlers, and destroys the engine", () => {
    const disconnect = vi.fn();
    const destroy = vi.fn();
    const removeEventListener = vi.fn();
    const session: ViewerSession = {
      renderingEngine: { destroy, resize: vi.fn() },
      viewport: { resetCamera: vi.fn(), render: vi.fn() },
      resizeObserver: { disconnect } as unknown as ResizeObserver,
      element: { removeEventListener } as unknown as HTMLElement,
      wheelHandler: vi.fn() as unknown as (event: WheelEvent) => void,
    };

    destroyViewer(session);

    expect(disconnect).toHaveBeenCalledOnce();
    expect(removeEventListener).toHaveBeenCalledWith("wheel", session.wheelHandler);
    expect(destroy).toHaveBeenCalledOnce();
  });
});
