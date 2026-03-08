import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  label: string;
  className?: string;
}

export function AnimatedCounter({ value, label, className = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const numericPart = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const isNumeric = !isNaN(numericPart);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || !isNumeric) return;
    const duration = 1200;
    const steps = 30;
    const increment = numericPart / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericPart) {
        setCount(numericPart);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, numericPart, isNumeric]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      className={`text-center ${className}`}
    >
      <div className="font-display text-3xl font-bold text-primary">
        {isNumeric ? `${count}${suffix}` : value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.15em] font-semibold">
        {label}
      </div>
    </motion.div>
  );
}
