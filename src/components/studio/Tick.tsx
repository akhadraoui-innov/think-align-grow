import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TickProps {
  value: number;
  duration?: number;
  className?: string;
}

/**
 * Rolling number ticker — anime la transition entre deux valeurs
 * en interpolant rapidement (280ms) avec courbe ease-out-quart.
 */
export function Tick({ value, duration = 280, className }: TickProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;

    const startTime = performance.now();
    const delta = value - prev;

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      // ease-out-quart
      const eased = 1 - Math.pow(1 - t, 4);
      const next = prev + delta * eased;
      setDisplay(Math.round(next));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(value);
        prevRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      prevRef.current = value;
    };
  }, [value, duration]);

  return <span className={cn("studio-tnum tabular-nums", className)}>{display}</span>;
}
