"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { destroyViewer, type ViewerSession } from "./viewer-session";

type Props = {
  imageUrl: string;
  onReady?: () => void;
  onError?: (message: string) => void;
};

let cornerstoneInit: Promise<void> | null = null;

async function ensureCornerstone() {
  if (!cornerstoneInit) {
    cornerstoneInit = (async () => {
      const cs = await import("@cornerstonejs/core");
      const loader = await import("@cornerstonejs/dicom-image-loader");
      if (!cs.isCornerstoneInitialized()) {
        await cs.init();
      }
      loader.init({ maxWebWorkers: 1 });
    })().catch((error) => {
      cornerstoneInit = null;
      throw error;
    });
  }
  return cornerstoneInit;
}

export function DicomViewport({ imageUrl, onReady, onError }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<ViewerSession | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fitReset = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    session.viewport.resetCamera();
    session.viewport.render();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const element = elementRef.current;
      if (!element) {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        await ensureCornerstone();
        if (cancelled) {
          return;
        }
        const cs = await import("@cornerstonejs/core");
        const engineId = `clinic-engine-${crypto.randomUUID()}`;
        const viewportId = `clinic-vp-${crypto.randomUUID()}`;
        const renderingEngine = new cs.RenderingEngine(engineId);
        renderingEngine.enableElement({
          viewportId,
          type: cs.Enums.ViewportType.STACK,
          element,
          defaultOptions: {
            background: [0.04, 0.05, 0.07],
          },
        });
        const viewport = renderingEngine.getViewport(viewportId) as {
          setStack: (imageIds: string[]) => Promise<void>;
          resetCamera: () => void;
          render: () => void;
          setZoom?: (zoom: number) => void;
          getZoom?: () => number;
        };
        await viewport.setStack([`wadouri:${window.location.origin}${imageUrl}`]);
        if (cancelled) {
          renderingEngine.destroy();
          return;
        }
        viewport.resetCamera();
        viewport.render();

        const resizeObserver = new ResizeObserver(() => {
          renderingEngine.resize(true, true);
          viewport.render();
        });
        resizeObserver.observe(element);

        const wheelHandler = (event: WheelEvent) => {
          event.preventDefault();
          if (!viewport.getZoom || !viewport.setZoom) {
            return;
          }
          const next = viewport.getZoom() * (event.deltaY > 0 ? 0.9 : 1.1);
          viewport.setZoom(Math.min(8, Math.max(0.25, next)));
          viewport.render();
        };
        element.addEventListener("wheel", wheelHandler, { passive: false });

        sessionRef.current = {
          renderingEngine,
          viewport,
          resizeObserver,
          element,
          wheelHandler,
        };
        setEngineReady(true);
        setLoading(false);
        onReady?.();
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "The DICOM image could not be displayed.";
        setError(
          "This file could not be displayed. It may be unsupported or corrupt.",
        );
        setLoading(false);
        onError?.(message);
      }
    }

    void start();
    return () => {
      cancelled = true;
      setEngineReady(false);
      destroyViewer(sessionRef.current);
      sessionRef.current = null;
    };
  }, [imageUrl, onError, onReady]);

  return (
    <div className="relative h-[min(70vh,520px)] w-full overflow-hidden rounded-lg bg-slate-950">
      <div
        ref={elementRef}
        className="h-full w-full"
        data-testid="dicom-viewport"
        onContextMenu={(event) => event.preventDefault()}
      />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-sm text-slate-200" role="status">
          Rendering DICOM image…
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 px-6 text-center text-sm text-red-200" role="alert">
          {error}
        </div>
      ) : null}
      {engineReady ? (
        <button
          type="button"
          onClick={fitReset}
          className="absolute bottom-3 right-3 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-900 shadow hover:bg-white"
        >
          Fit / Reset
        </button>
      ) : null}
    </div>
  );
}
