"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { trimCanvas, type SignatureImage } from "./canvas";

interface Point {
  x: number;
  y: number;
  /** 0–1; mouse reports 0.5 so strokes stay even. */
  pressure: number;
}

interface Stroke {
  color: string;
  width: number;
  points: Point[];
}

export interface SignaturePadHandle {
  clear: () => void;
  undo: () => void;
  toImage: () => SignatureImage | null;
}

interface SignaturePadProps {
  ref?: React.Ref<SignaturePadHandle>;
  color: string;
  strokeWidth: number;
  onStrokeCountChange?: (count: number) => void;
}

const PAD_HEIGHT = 220;
const EXPORT_SCALE = 3;

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  scale: number,
) {
  const pts = stroke.points;
  if (pts.length === 0) return;

  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(
      pts[0].x * scale,
      pts[0].y * scale,
      (stroke.width * scale) / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }

  // Quadratic curves through segment midpoints give smooth ink; each segment
  // is stroked separately so pen pressure can vary the width.
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const startX = i === 1 ? prev.x : (pts[i - 2].x + prev.x) / 2;
    const startY = i === 1 ? prev.y : (pts[i - 2].y + prev.y) / 2;
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;

    ctx.lineWidth = stroke.width * scale * (0.6 + curr.pressure * 0.8);
    ctx.beginPath();
    ctx.moveTo(startX * scale, startY * scale);
    ctx.quadraticCurveTo(
      prev.x * scale,
      prev.y * scale,
      midX * scale,
      midY * scale,
    );
    if (i === pts.length - 1) ctx.lineTo(curr.x * scale, curr.y * scale);
    ctx.stroke();
  }
}

export default function SignaturePad({
  ref,
  color,
  strokeWidth,
  onStrokeCountChange,
}: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const sizeRef = useRef({ width: 0, height: PAD_HEIGHT });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke, dpr);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      const dpr = window.devicePixelRatio || 1;
      const width = entry.contentRect.width;
      sizeRef.current = { width, height: PAD_HEIGHT };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(PAD_HEIGHT * dpr);
      redraw();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [redraw]);

  const notify = useCallback(() => {
    onStrokeCountChange?.(strokesRef.current.length);
  }, [onStrokeCountChange]);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        strokesRef.current = [];
        redraw();
        notify();
      },
      undo: () => {
        strokesRef.current = strokesRef.current.slice(0, -1);
        redraw();
        notify();
      },
      toImage: () => {
        if (strokesRef.current.length === 0) return null;
        const { width, height } = sizeRef.current;
        const out = document.createElement("canvas");
        out.width = Math.round(width * EXPORT_SCALE);
        out.height = Math.round(height * EXPORT_SCALE);
        const ctx = out.getContext("2d");
        if (!ctx) return null;
        for (const stroke of strokesRef.current) {
          drawStroke(ctx, stroke, EXPORT_SCALE);
        }
        return trimCanvas(out, 6 * EXPORT_SCALE);
      },
    }),
    [redraw, notify],
  );

  const pointFromEvent = (e: React.PointerEvent | PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current = [
      ...strokesRef.current,
      { color, width: strokeWidth, points: [pointFromEvent(e)] },
    ];
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    // Coalesced events recover the samples the browser merged between frames.
    const events = e.nativeEvent.getCoalescedEvents?.();
    for (const ev of events?.length ? events : [e.nativeEvent]) {
      stroke.points.push(pointFromEvent(ev));
    }
    redraw();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    notify();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white dark:border-gray-600"
      style={{ height: PAD_HEIGHT }}
    >
      <div className="pointer-events-none absolute inset-x-8 bottom-12 border-b border-gray-300" />
      <span className="pointer-events-none absolute bottom-[3.25rem] left-8 select-none text-lg text-gray-300">
        ✕
      </span>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
