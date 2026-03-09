import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { CanvasItem } from "@/hooks/useCanvasItems";
import { CanvasCard } from "./CanvasCard";
import { StickyNote } from "./StickyNote";
import { CanvasGroup } from "./CanvasGroup";
import { CanvasArrow } from "./CanvasArrow";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";

interface WorkshopCanvasProps {
  items: CanvasItem[];
  cards: DbCard[];
  pillars: DbPillar[];
  selectedItemId: string | null;
  mode: "select" | "sticky" | "arrow" | "group";
  arrowStart: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateContent: (id: string, content: Record<string, any>) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  onUpdateColor: (id: string, color: string) => void;
  onBringToFront: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddSticky: (x: number, y: number) => void;
  onAddGroup: (x: number, y: number) => void;
  onArrowClick: (itemId: string) => void;
  viewport: { x: number; y: number; scale: number };
  onViewportChange: (vp: { x: number; y: number; scale: number }) => void;
  profiles: Record<string, { display_name: string; avatar_url: string | null }>;
}

export function WorkshopCanvas({
  items,
  cards,
  pillars,
  selectedItemId,
  mode,
  arrowStart,
  onSelectItem,
  onUpdatePosition,
  onUpdateContent,
  onUpdateSize,
  onUpdateColor,
  onBringToFront,
  onDeleteItem,
  onAddSticky,
  onAddGroup,
  onArrowClick,
  viewport,
  onViewportChange,
  profiles,
}: WorkshopCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY * 0.001;
      const newScale = Math.max(0.25, Math.min(2, viewport.scale + delta));
      const scaleRatio = newScale / viewport.scale;

      // Zoom toward mouse position
      const newX = mouseX - (mouseX - viewport.x) * scaleRatio;
      const newY = mouseY - (mouseY - viewport.y) * scaleRatio;

      onViewportChange({ x: newX, y: newY, scale: newScale });
    }
  }, [viewport, onViewportChange]);

  // Handle pan start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvas === "true") {
      if (mode === "sticky") {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale;
        const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale;
        onAddSticky(canvasX, canvasY);
        return;
      }
      if (mode === "group") {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale;
        const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale;
        onAddGroup(canvasX, canvasY);
        return;
      }

      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      onSelectItem(null);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [mode, viewport, onAddSticky, onAddGroup, onSelectItem]);

  // Handle pan move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      onViewportChange({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingItem) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale - dragOffset.x;
      const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale - dragOffset.y;
      onUpdatePosition(draggingItem, canvasX, canvasY);
    }
  }, [isPanning, panStart, viewport, onViewportChange, draggingItem, dragOffset, onUpdatePosition]);

  // Handle pan/drag end
  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    setDraggingItem(null);
  }, []);

  // Handle item drag start
  const handleItemDragStart = useCallback((itemId: string, e: React.PointerEvent, item: CanvasItem) => {
    if (mode === "arrow") {
      onArrowClick(itemId);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale;

    setDragOffset({ x: canvasX - item.x, y: canvasY - item.y });
    setDraggingItem(itemId);
    onBringToFront(itemId);
    onSelectItem(itemId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [mode, viewport, onBringToFront, onSelectItem, onArrowClick]);

  // Get card data for a card item
  const getCardData = (cardId: string | null) => {
    if (!cardId) return null;
    return cards.find(c => c.id === cardId) || null;
  };

  // Get pillar data for a card
  const getPillarData = (pillarId: string) => {
    return pillars.find(p => p.id === pillarId) || null;
  };

  // Render items sorted by z_index
  const sortedItems = [...items].sort((a, b) => a.z_index - b.z_index);

  // Get arrows
  const arrows = sortedItems.filter(item => item.type === "arrow");
  const nonArrows = sortedItems.filter(item => item.type !== "arrow");

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-muted/30"
      style={{ cursor: isPanning ? "grabbing" : mode === "sticky" || mode === "group" ? "crosshair" : "grab" }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      data-canvas="true"
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * viewport.scale}px ${20 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          opacity: 0.5,
        }}
        data-canvas="true"
      />

      {/* Canvas content */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
        }}
        data-canvas="true"
      >
        {/* Render arrows first (below other items) */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: "10000px", height: "10000px", overflow: "visible" }}
        >
          {arrows.map(arrow => {
            const fromItem = items.find(i => i.id === arrow.from_item_id);
            const toItem = items.find(i => i.id === arrow.to_item_id);
            if (!fromItem || !toItem) return null;
            return (
              <CanvasArrow
                key={arrow.id}
                fromX={fromItem.x + (fromItem.width || 240) / 2}
                fromY={fromItem.y + 60}
                toX={toItem.x + (toItem.width || 240) / 2}
                toY={toItem.y}
                isSelected={selectedItemId === arrow.id}
                onClick={() => onSelectItem(arrow.id)}
              />
            );
          })}
        </svg>

        {/* Render other items */}
        {nonArrows.map(item => {
          const isSelected = selectedItemId === item.id;
          const isDragging = draggingItem === item.id;
          const profile = profiles[item.created_by];

          if (item.type === "card") {
            const card = getCardData(item.card_id);
            if (!card) return null;
            const pillar = getPillarData(card.pillar_id);

            return (
              <CanvasCard
                key={item.id}
                item={item}
                card={card}
                pillar={pillar}
                isSelected={isSelected}
                isDragging={isDragging}
                creatorName={profile?.display_name || ""}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onDelete={() => onDeleteItem(item.id)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
              />
            );
          }

          if (item.type === "sticky") {
            return (
              <StickyNote
                key={item.id}
                item={item}
                isSelected={isSelected}
                isDragging={isDragging}
                creatorName={profile?.display_name || ""}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onUpdateColor={(color) => onUpdateColor(item.id, color)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          if (item.type === "group") {
            return (
              <CanvasGroup
                key={item.id}
                item={item}
                isSelected={isSelected}
                isDragging={isDragging}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onUpdateSize={(w, h) => onUpdateSize(item.id, w, h)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          return null;
        })}

        {/* Arrow preview when creating */}
        {arrowStart && mode === "arrow" && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-bold z-50 pointer-events-none">
            Cliquez sur un autre élément pour créer la flèche
          </div>
        )}
      </div>
    </div>
  );
}
