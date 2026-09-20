export type ViewerSession = {
  renderingEngine: { destroy: () => void; resize: (immediate?: boolean, keepCamera?: boolean) => void };
  viewport: { resetCamera: () => void; render: () => void };
  resizeObserver?: ResizeObserver;
  element?: HTMLElement;
  wheelHandler?: (event: WheelEvent) => void;
};

export function destroyViewer(session: ViewerSession | null | undefined) {
  if (!session) {
    return;
  }
  session.resizeObserver?.disconnect();
  if (session.element && session.wheelHandler) {
    session.element.removeEventListener("wheel", session.wheelHandler);
  }
  try {
    session.renderingEngine.destroy();
  } catch {
    // Engine may already be destroyed if the element unmounted first.
  }
}
