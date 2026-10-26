"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

import type { PDFDocumentProxy } from "./pdfjs";
import { clampBox, resizeBox, type Box, type Placement } from "./utils";

interface PdfPageViewProps {
  pdf: PDFDocumentProxy;
  pageIndex: number;
  placements: Placement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, box: Box) => void;
  onRemove: (id: string) => void;
}

interface DragState {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  startBox: Box;
  aspect: number;
  rect: DOMRect;
}

const NUDGE = 0.005;

export default function PdfPageView({
  pdf,
  pageIndex,
  placements,
  selectedId,
  onSelect,
  onChange,
  onRemove,
}: PdfPageViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerWidth === 0) return;
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null =
      null;

    setRendering(true);
    setError(null);

    pdf
      .getPage(pageIndex + 1)
      .then((page) => {
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        setPageSize({ width: base.width, height: base.height });

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({
          scale: (containerWidth / base.width) * dpr,
        });
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        renderTask = page.render({ canvasContext: ctx, viewport });
        return renderTask.promise;
      })
      .then(() => {
        if (!cancelled) setRendering(false);
      })
      .catch((err: Error) => {
        if (cancelled || err?.name === "RenderingCancelledException") return;
        console.error(err);
        setError("Could not render this page");
        setRendering(false);
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageIndex, containerWidth]);

  const startDrag = (
    e: React.PointerEvent,
    placement: Placement,
    mode: DragState["mode"],
  ) => {
    if (e.button !== 0 || !pageRef.current) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSelect(placement.id);
    dragRef.current = {
      id: placement.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startBox: placement,
      aspect: placement.aspect,
      rect: pageRef.current.getBoundingClientRect(),
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / drag.rect.width;
    const dy = (e.clientY - drag.startY) / drag.rect.height;

    if (drag.mode === "move") {
      onChange(
        drag.id,
        clampBox({
          ...drag.startBox,
          x: drag.startBox.x + dx,
          y: drag.startBox.y + dy,
        }),
      );
    } else {
      onChange(
        drag.id,
        resizeBox(
          drag.startBox,
          drag.startBox.width + dx,
          drag.aspect,
          drag.rect.width,
          drag.rect.height,
        ),
      );
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    // The release point may differ from the last move event; apply it too.
    if (e.type === "pointerup") handlePointerMove(e);
    dragRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent, placement: Placement) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove(placement.id);
      return;
    }
    const step = e.shiftKey ? NUDGE * 5 : NUDGE;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[e.key];
    if (!move) return;
    e.preventDefault();
    onChange(
      placement.id,
      clampBox({
        ...placement,
        x: placement.x + move[0],
        y: placement.y + move[1],
      }),
    );
  };

  return (
    <div ref={containerRef} className="w-full">
      <div
        ref={pageRef}
        className="relative w-full select-none overflow-hidden bg-white shadow-lg ring-1 ring-black/10"
        style={{
          aspectRatio: pageSize
            ? `${pageSize.width} / ${pageSize.height}`
            : "1 / 1.414",
        }}
        onPointerDown={() => onSelect(null)}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {(rendering || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-gray-600">
            {error ?? <Loader2 className="h-6 w-6 animate-spin" />}
          </div>
        )}

        {placements.map((p) => {
          const selected = p.id === selectedId;
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              aria-label={`${p.label} — drag to move, arrow keys to nudge, Delete to remove`}
              className={`group absolute cursor-move touch-none outline-none ${
                selected
                  ? "ring-2 ring-blue-500"
                  : "ring-1 ring-transparent hover:ring-blue-300"
              }`}
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                width: `${p.width * 100}%`,
                height: `${p.height * 100}%`,
              }}
              onPointerDown={(e) => startDrag(e, p, "move")}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onFocus={() => onSelect(p.id)}
              onKeyDown={(e) => handleKeyDown(e, p)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt={p.label}
                draggable={false}
                className="pointer-events-none h-full w-full"
              />
              {selected && (
                <>
                  <button
                    type="button"
                    aria-label={`Remove ${p.label}`}
                    className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(p.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div
                    aria-hidden
                    className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-blue-500 shadow"
                    onPointerDown={(e) => startDrag(e, p, "resize")}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
