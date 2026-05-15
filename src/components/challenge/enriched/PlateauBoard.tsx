import { useEffect, useRef, useState, useCallback } from "react";
import { CRITICALITY_META } from "./constants";
import { cn } from "@/lib/utils";
import type { ChallengeArtifact } from "@/hooks/useChallengeArtifacts";
import { Mic, HelpCircle, StickyNote, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageLibrary } from "./images/ImageLibrary";
import { ImageTile } from "./images/ImageTile";

interface Props {
  artifacts: ChallengeArtifact[];
  canEdit: boolean;
  selectedId: string | null;
  onSelect: (a: ChallengeArtifact) => void;
  onUpdate: (id: string, patch: Partial<ChallengeArtifact>) => Promise<void>;
  sessionId?: string;
  onCreate?: (input: any) => Promise<any>;
}

const CARD_W = 220;
const KIND_ICON = { postit: StickyNote, voice: Mic, question: HelpCircle, image: ImageIcon } as const;

function defaultPos(idx: number) {
  // grid fallback for artifacts without position
  const cols = 5;
  return { x: 40 + (idx % cols) * (CARD_W + 24), y: 40 + Math.floor(idx / cols) * 180 };
}

export function PlateauBoard({ artifacts, canEdit, selectedId, onSelect, onUpdate, sessionId, onCreate }: Props) {
  const [imageOpen, setImageOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [tick, setTick] = useState(0);

  const top = artifacts.filter(a => !a.parent_artifact_id && a.status !== "archived");

  const onPointerDownCard = (e: React.PointerEvent, a: ChallengeArtifact) => {
    if (!canEdit) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const idx = top.indexOf(a);
    const pos = (a.position as any) || defaultPos(idx);
    dragRef.current = {
      id: a.id,
      offsetX: e.clientX / zoom - pos.x,
      offsetY: e.clientY / zoom - pos.y,
      moved: false,
    };
  };

  const onPointerMoveCard = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    d.moved = true;
    const x = e.clientX / zoom - d.offsetX;
    const y = e.clientY / zoom - d.offsetY;
    // optimistic mutation in-memory via dataset position + force render
    const node = document.querySelector<HTMLElement>(`[data-art-id="${d.id}"]`);
    if (node) {
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
    }
  }, [zoom]);

  const onPointerUpCard = useCallback((e: React.PointerEvent, a: ChallengeArtifact) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (!d.moved) { onSelect(a); return; }
    const node = document.querySelector<HTMLElement>(`[data-art-id="${d.id}"]`);
    if (!node) return;
    const x = parseFloat(node.style.left);
    const y = parseFloat(node.style.top);
    onUpdate(a.id, { position: { x: Math.round(x), y: Math.round(y) } as any });
  }, [onSelect, onUpdate]);

  // Background pan
  const onPointerDownBg = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).dataset.bg !== "1") return;
    panRef.current = { startX: e.clientX, startY: e.clientY, ox: pan.x, oy: pan.y };
  };
  const onPointerMoveBg = (e: React.PointerEvent) => {
    if (!panRef.current) return;
    setPan({ x: panRef.current.ox + (e.clientX - panRef.current.startX), y: panRef.current.oy + (e.clientY - panRef.current.startY) });
  };
  const onPointerUpBg = () => { panRef.current = null; };

  useEffect(() => { setTick(t => t + 1); }, [artifacts.length]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[radial-gradient(circle,_hsl(var(--muted-foreground)/0.15)_1px,_transparent_1px)] [background-size:24px_24px]"
      ref={containerRef}
      onPointerDown={onPointerDownBg}
      onPointerMove={onPointerMoveBg}
      onPointerUp={onPointerUpBg}
      data-bg="1"
    >
      <div className="absolute top-3 right-3 z-10 flex gap-1 bg-background/90 backdrop-blur rounded-md border border-border p-1 shadow-sm">
        {canEdit && sessionId && onCreate && (
          <>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] font-bold uppercase tracking-wider gap-1" onClick={() => setImageOpen(true)}>
              <ImagePlus className="h-3.5 w-3.5" /> Image
            </Button>
            <div className="w-px bg-border mx-0.5 my-1" />
          </>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}><ZoomOut className="h-3.5 w-3.5" /></Button>
        <span className="text-[10px] font-bold tabular-nums w-10 text-center self-center">{Math.round(zoom * 100)}%</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 className="h-3.5 w-3.5" /></Button>
      </div>

      <div
        className="absolute origin-top-left will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: 8000, height: 6000 }}
        data-bg="1"
      >
        {top.map((a, idx) => {
          const pos = (a.position as any) || defaultPos(idx);
          const meta = a.criticality ? CRITICALITY_META[a.criticality] : CRITICALITY_META.low;
          const Icon = (KIND_ICON as any)[a.kind] ?? StickyNote;
          const isSelected = selectedId === a.id;
          return (
            <div
              key={a.id + ":" + tick}
              data-art-id={a.id}
              onPointerDown={(e) => onPointerDownCard(e, a)}
              onPointerMove={onPointerMoveCard}
              onPointerUp={(e) => onPointerUpCard(e, a)}
              className={cn(
                "absolute rounded-lg ring-1 shadow-sm p-3 select-none transition-shadow",
                meta.bg, meta.ring, meta.text,
                canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                isSelected && "ring-2 shadow-xl z-10",
              )}
              style={{ left: pos.x, top: pos.y, width: CARD_W }}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold opacity-80 mb-1">
                <Icon className="h-3 w-3" />
                {a.kind === "postit" ? "Post-it" : a.kind === "voice" ? "Vocal" : a.kind === "question" ? "Question" : a.kind === "image" ? "Image" : a.kind}
                <span className={cn("ml-auto h-1.5 w-1.5 rounded-full", meta.dot)} />
              </div>
              {a.kind === "image" ? (
                <ImageTile artifact={a} compact />
              ) : (
                <div className="flex items-start gap-1.5">
                  {a.emoji && <span className="text-base leading-none">{a.emoji}</span>}
                  <p className="text-xs font-medium whitespace-pre-wrap break-words flex-1 line-clamp-5">
                    {a.kind === "voice" ? (a.transcription || "(transcription…)") : (a.content || <em className="opacity-60">(vide)</em>)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {top.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground italic">Le plateau est vide. Ajoute un post-it ou une image.</p>
        </div>
      )}

      {sessionId && onCreate && (
        <ImageLibrary
          open={imageOpen}
          onOpenChange={setImageOpen}
          sessionId={sessionId}
          onCreate={onCreate}
        />
      )}
    </div>
  );
}
