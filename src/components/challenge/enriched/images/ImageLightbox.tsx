import { useEffect, useState, useRef, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ url, alt, open, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setZoom(1); setPan({ x: 0, y: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(6, z + 0.2));
      if (e.key === "-") setZoom(z => Math.max(0.3, z - 0.2));
      if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(6, Math.max(0.3, z - e.deltaY * 0.002)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.px + e.clientX - dragRef.current.x, y: dragRef.current.py + e.clientY - dragRef.current.y });
  };
  const onPointerUp = () => { dragRef.current = null; };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex flex-col" onClick={onClose}>
      <div className="flex items-center gap-1 p-3 border-b border-border" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-bold uppercase tracking-wider truncate flex-1">{alt || "Image"}</span>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
        <span className="text-xs tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.min(6, z + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><RotateCw className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div
        className="flex-1 overflow-hidden grid place-items-center cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={alt || ""}
          draggable={false}
          className="max-w-none select-none transition-transform will-change-transform"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        />
      </div>
      <div className="px-3 py-2 text-[10px] text-muted-foreground text-center border-t border-border">
        Molette pour zoomer · Glisser pour déplacer · <kbd className="px-1 rounded bg-muted">0</kbd> reset · <kbd className="px-1 rounded bg-muted">Esc</kbd> fermer
      </div>
    </div>
  );
}
