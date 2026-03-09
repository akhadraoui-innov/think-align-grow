import { useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { CanvasItem } from "@/hooks/useCanvasItems";
import { CanvasCard } from "./CanvasCard";
import { StickyNote } from "./StickyNote";
import { CanvasGroup } from "./CanvasGroup";
import { CanvasArrow } from "./CanvasArrow";
import { ArrowToolbar } from "./ArrowToolbar";
import { CanvasIcon } from "./CanvasIcon";
import { CanvasText } from "./CanvasText";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";

interface WorkshopCanvasProps {
  items: CanvasItem[];
  cards: DbCard[];
  pillars: DbPillar[];
  selectedItemId: string | null;
  mode: string;
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
  onAddIcon: (x: number, y: number) => void;
  onAddText: (x: number, y: number) => void;
  onArrowClick: (itemId: string) => void;
  viewport: { x: number; y: number; scale: number };
  onViewportChange: (vp: { x: number; y: number; scale: number }) => void;
  profiles: Record<string, { display_name: string; avatar_url: string | null }>;
}

export function WorkshopCanvas({
  items, cards, pillars,
  selectedItemId, mode, arrowStart,
  onSelectItem, onUpdatePosition, onUpdateContent, onUpdateSize, onUpdateColor,
  onBringToFront, onDeleteItem,
  onAddSticky, onAddGroup, onAddIcon, onAddText,
  onArrowClick, viewport, onViewportChange, profiles,
}: WorkshopCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Compute which items are inside which groups
  const groupChildCounts = useMemo(() => {
    const groups = items.filter(i => i.type === "group");
    const nonGroups = items.filter(i => i.type !== "group" && i.type !== "arrow");
    const counts: Record<string, number> = {};
    
    groups.forEach(g => {
      const gw = g.width || 300;
      const gh = g.height || 200;
      let count = 0;
      nonGroups.forEach(item => {
        if (item.x >= g.x && item.y >= g.y && item.x <= g.x + gw && item.y <= g.y + gh) {
          count++;
        }
      });
      counts[g.id] = count;
    });
    return counts;
  }, [items]);

  // Ensure groups render below items by adjusting z-index sorting
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      // Groups always render below non-groups at same z level
      if (a.type === "group" && b.type !== "group" && b.type !== "arrow") return -1;
      if (b.type === "group" && a.type !== "group" && a.type !== "arrow") return 1;
      return a.z_index - b.z_index;
    });
    return sorted;
  }, [items]);

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
      onViewportChange({
        x: mouseX - (mouseX - viewport.x) * scaleRatio,
        y: mouseY - (mouseY - viewport.y) * scaleRatio,
        scale: newScale,
      });
    }
  }, [viewport, onViewportChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvas === "true") {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale;
      const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale;

      if (mode === "sticky") { onAddSticky(canvasX, canvasY); return; }
      if (mode === "group") { onAddGroup(canvasX, canvasY); return; }
      if (mode === "icon") { onAddIcon(canvasX, canvasY); return; }
      if (mode === "text") { onAddText(canvasX, canvasY); return; }

      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      onSelectItem(null);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [mode, viewport, onAddSticky, onAddGroup, onAddIcon, onAddText, onSelectItem]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      onViewportChange({ ...viewport, x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingItem) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - viewport.x) / viewport.scale - dragOffset.x;
      const canvasY = (e.clientY - rect.top - viewport.y) / viewport.scale - dragOffset.y;
      onUpdatePosition(draggingItem, canvasX, canvasY);
    }
  }, [isPanning, panStart, viewport, onViewportChange, draggingItem, dragOffset, onUpdatePosition]);

  const handlePointerUp = useCallback(() => {
    // When dropping an item, check if it's over a group
    if (draggingItem) {
      const draggedItem = items.find(i => i.id === draggingItem);
      if (draggedItem && draggedItem.type !== "group" && draggedItem.type !== "arrow") {
        const groups = items.filter(i => i.type === "group");
        for (const g of groups) {
          const gw = g.width || 300;
          const gh = g.height || 200;
          if (draggedItem.x >= g.x && draggedItem.y >= g.y && 
              draggedItem.x <= g.x + gw && draggedItem.y <= g.y + gh) {
            onUpdateContent(draggingItem, { parent_group_id: g.id });
            break;
          }
        }
      }
    }
    setIsPanning(false);
    setDraggingItem(null);
  }, [draggingItem, items, onUpdateContent]);

  const handleItemDragStart = useCallback((itemId: string, e: React.PointerEvent, item: CanvasItem) => {
    if (mode === "arrow") { onArrowClick(itemId); return; }
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

  const getCardData = (cardId: string | null) => cardId ? cards.find(c => c.id === cardId) || null : null;
  const getPillarData = (pillarId: string) => pillars.find(p => p.id === pillarId) || null;

  const arrows = sortedItems.filter(item => item.type === "arrow");
  const nonArrows = sortedItems.filter(item => item.type !== "arrow");

  const cursorStyle = isPanning ? "grabbing" : ["sticky", "group", "icon", "text"].includes(mode) ? "crosshair" : "grab";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-muted/30"
      style={{ cursor: cursorStyle }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      data-canvas="true"
    >
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: `${20 * viewport.scale}px ${20 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          opacity: 0.5,
        }}
        data-canvas="true"
      />

      <div
        className="absolute origin-top-left"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
        data-canvas="true"
      >
        {/* Arrows */}
        <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: "10000px", height: "10000px", overflow: "visible" }}>
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
                style={(arrow.content?.arrow_style as string) || "solid"}
                color={(arrow.content?.arrow_color as string) || "default"}
              />
            );
          })}
        </svg>

        {/* Items */}
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
                key={item.id} item={item} card={card} pillar={pillar}
                isSelected={isSelected} isDragging={isDragging}
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
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
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
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
                childCount={groupChildCounts[item.id] || 0}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onUpdateSize={(w, h) => onUpdateSize(item.id, w, h)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          if (item.type === "icon") {
            return (
              <CanvasIcon
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          if (item.type === "text") {
            return (
              <CanvasText
                key={item.id} item={item}
                isSelected={isSelected} isDragging={isDragging}
                onPointerDown={(e) => handleItemDragStart(item.id, e, item)}
                onUpdateContent={(content) => onUpdateContent(item.id, content)}
                onDelete={() => onDeleteItem(item.id)}
              />
            );
          }

          return null;
        })}

        {arrowStart && mode === "arrow" && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-bold z-50 pointer-events-none">
            Cliquez sur un autre élément pour créer la flèche
          </div>
        )}
      </div>
    </div>
  );
}
