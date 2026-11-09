import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PadPoint, SignaturePadState } from "@/components/features/admin/clearance/types";

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 200;
/** Same ink as the signature cards so drawn and typed marks match. */
const INK = "#1b2f9e";

type Options = {
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
};

/**
 * Draw-on signature pad.
 *
 * Strokes are stored in CSS pixels and the canvas buffer is scaled by
 * `devicePixelRatio`, so the export is a crisp transparent PNG on any display
 * and Undo can replay the ink without the baseline guide (that guide is a DOM
 * overlay, never part of the bitmap).
 */
export function useSignaturePad(options: Options = {}): SignaturePadState {
  const {
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    color = INK,
    lineWidth = 3.2,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<PadPoint[][]>([]);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const paintStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: PadPoint[], fromIndex = 0) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let index = fromIndex; index < stroke.length; index += 1) {
        const from = stroke[index - 1] ?? stroke[index];
        const to = stroke[index];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    },
    [color, lineWidth],
  );

  const replay = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (const stroke of strokes.current) paintStroke(ctx, stroke);
  }, [paintStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = canvas.clientWidth || width;
    const cssHeight = canvas.clientHeight || height;

    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    replay();
  }, [replay, width, height]);

  const pointFrom = (event: ReactPointerEvent<HTMLCanvasElement>): PadPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    strokes.current.push([pointFrom(event)]);
  }, []);

  const move = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const current = strokes.current[strokes.current.length - 1];
      if (!canvas || !ctx || !current) return;

      const point = pointFrom(event);
      current.push(point);
      paintStroke(ctx, current, current.length - 1);
      setHasInk(true);
    },
    [paintStroke],
  );

  const end = useCallback(() => {
    drawing.current = false;
  }, []);

  const undo = useCallback(() => {
    strokes.current.pop();
    replay();
    setHasInk(strokes.current.length > 0);
  }, [replay]);

  const clear = useCallback(() => {
    strokes.current = [];
    replay();
    setHasInk(false);
  }, [replay]);

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.current.length === 0) return "";
    return canvas.toDataURL("image/png");
  }, []);

  return {
    canvasRef,
    hasInk,
    undoDisabled: !hasInk,
    start,
    move,
    end,
    undo,
    clear,
    exportPng,
    width,
    height,
  };
}
