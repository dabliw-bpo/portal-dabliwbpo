"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buttonSecondary } from "@/components/ui/styles";

/** Points are stored normalized (0..1) so a resize redraws faithfully. */
type Point = { x: number; y: number };

const INK = "#0f172a";

export function SignaturePad({
  name,
  onSignatureChange,
}: {
  name: string;
  onSignatureChange?: (hasSignature: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = Math.max(2, width * 0.004);

    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;

      if (stroke.length === 1) {
        // A single tap should still leave a mark.
        ctx.beginPath();
        ctx.arc(stroke[0].x * width, stroke[0].y * height, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(stroke[0].x * width, stroke[0].y * height);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x * width, stroke[i].y * height);
      }
      ctx.stroke();
    }
  }, []);

  // The pad may start hidden (inside a closed <dialog>), so size it from a
  // ResizeObserver rather than on mount, and redraw whenever it changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);
      if (width === 0 || height === 0) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        redraw();
      }
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  function pointFrom(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function commit() {
    const canvas = canvasRef.current;
    const input = inputRef.current;
    if (!canvas || !input) return;

    const filled = strokesRef.current.length > 0;
    input.value = filled ? canvas.toDataURL("image/png") : "";

    if (filled !== hasSignature) {
      setHasSignature(filled);
      onSignatureChange?.(filled);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([pointFrom(event)]);
    redraw();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    event.preventDefault();
    strokesRef.current[strokesRef.current.length - 1]?.push(pointFrom(event));
    redraw();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    commit();
  }

  function clear() {
    strokesRef.current = [];
    redraw();
    commit();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span id={`${name}-label`} className="text-sm font-medium text-slate-700">
          Assinatura manuscrita
        </span>
        <button type="button" onClick={clear} disabled={!hasSignature} className={buttonSecondary}>
          Limpar
        </button>
      </div>

      <canvas
        ref={canvasRef}
        aria-labelledby={`${name}-label`}
        aria-describedby={`${name}-hint`}
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="h-40 w-full touch-none rounded-md border-2 border-dashed border-slate-300 bg-white"
      />

      <p id={`${name}-hint`} className="text-xs text-slate-500">
        Desenhe sua assinatura no quadro acima usando o mouse, a caneta ou o dedo.
      </p>

      <input ref={inputRef} type="hidden" name={name} />
    </div>
  );
}
