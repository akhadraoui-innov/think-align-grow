import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

export function Logo({ size = "md", animate = false, className = "" }: LogoProps) {
  const sizes = {
    sm: { w: 28, h: 28, text: "text-xs" },
    md: { w: 40, h: 40, text: "text-sm" },
    lg: { w: 64, h: 64, text: "text-xl" },
  };

  const s = sizes[size];

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", stiffness: 300, damping: 20 } }
    : {};

  return (
    <Wrapper {...(wrapperProps as any)} className={className}>
      <svg width={s.w} height={s.h} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background shape */}
        <rect width="64" height="64" rx="16" fill="url(#logo-gradient)" />
        
        {/* H letter */}
        <path
          d="M14 16V48M14 32H28M28 16V48"
          stroke="hsl(60 10% 95%)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* S letter */}
        <path
          d="M38 22C38 22 40 16 46 16C52 16 54 20 54 22C54 28 38 26 38 34C38 34 36 42 46 42C50 42 54 40 54 40"
          stroke="hsl(60 10% 95%)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Spark accent */}
        <circle cx="54" cy="12" r="3" fill="hsl(48 92% 52%)" />
        
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(14 90% 58%)" />
            <stop offset="1" stopColor="hsl(350 85% 58%)" />
          </linearGradient>
        </defs>
      </svg>
    </Wrapper>
  );
}

export function LogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo size="sm" />
      <div className="flex flex-col leading-none">
        <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          GROWTHINNOV
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          AI Acceleration
        </span>
      </div>
    </div>
  );
}
