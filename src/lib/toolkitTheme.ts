// Theme dérivé pour le Toolkit Playground
// Génère palette + pattern de fond cohérent par toolkit, sans nouvelle colonne DB.

export type ToolkitTheme = {
  accent: string;       // CSS color (hex / hsl) du pilier dominant
  accentSoft: string;   // version transparente
  pattern: "grid" | "dots" | "topo" | "weave";
  patternSvg: string;   // url(data:...)
  bgClass: string;      // classes tailwind pour la base
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickPattern(toolkit: { slug?: string | null; tags?: any }): ToolkitTheme["pattern"] {
  const tags: string[] = Array.isArray(toolkit.tags)
    ? toolkit.tags.map((t: any) => String(t).toLowerCase())
    : [];
  if (tags.some((t) => /strateg|vision|model/.test(t))) return "grid";
  if (tags.some((t) => /idea|innov|creat/.test(t))) return "dots";
  if (tags.some((t) => /transform|change|growth/.test(t))) return "topo";
  if (tags.some((t) => /team|collect|culture|peopl/.test(t))) return "weave";
  const variants: ToolkitTheme["pattern"][] = ["grid", "dots", "topo", "weave"];
  return variants[hashStr(toolkit.slug || "") % variants.length];
}

function patternToSvg(pattern: ToolkitTheme["pattern"], color: string): string {
  const c = encodeURIComponent(color);
  let svg = "";
  if (pattern === "grid") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M40 0H0V40' fill='none' stroke='${c}' stroke-width='0.5' opacity='0.18'/></svg>`;
  } else if (pattern === "dots") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='2' cy='2' r='1.2' fill='${c}' opacity='0.25'/></svg>`;
  } else if (pattern === "topo") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M0 40 Q20 10 40 40 T80 40' fill='none' stroke='${c}' stroke-width='0.6' opacity='0.2'/><path d='M0 60 Q20 30 40 60 T80 60' fill='none' stroke='${c}' stroke-width='0.6' opacity='0.15'/></svg>`;
  } else {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'><path d='M0 15 L15 0 L30 15 L15 30 Z' fill='none' stroke='${c}' stroke-width='0.5' opacity='0.18'/></svg>`;
  }
  return `url("data:image/svg+xml;utf8,${svg}")`;
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export function getToolkitTheme(
  toolkit: { slug?: string | null; tags?: any } | null | undefined,
  dominantPillarColor?: string | null
): ToolkitTheme {
  const accent = dominantPillarColor || "#4F6BED";
  const pattern = pickPattern(toolkit || {});
  return {
    accent,
    accentSoft: withAlpha(accent, 0.12),
    pattern,
    patternSvg: patternToSvg(pattern, accent),
    bgClass: "bg-background",
  };
}
