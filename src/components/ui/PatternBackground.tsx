export function MeshGradient({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full bg-primary/8 blur-[100px]" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[60%] h-[60%] rounded-full bg-accent/6 blur-[80px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-pillar-impact/5 blur-[60px]" />
    </div>
  );
}

export function DotPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] ${className}`}>
      <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] ${className}`}>
      <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
