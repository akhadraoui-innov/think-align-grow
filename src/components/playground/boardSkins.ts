// Skins de plateau "serious-game corporate" — épurés, alignés au thème du toolkit.
// Aucune surcharge visuelle : 1 emblème central + 4 marqueurs d'angle + pattern thématique très léger.

import type { ToolkitTheme } from "@/lib/toolkitTheme";

export type BoardSkin = {
  surfaceStyle: React.CSSProperties;
  emblem: { kind: "emoji" | "rings" | "compass" | "grid"; value?: string };
  cornerColor: string;
  accent: string;
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function isLight(hex: string): boolean {
  const m = hex.replace("#", "");
  if (m.length < 6) return true;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // Perceived luminance
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

export function getBoardSkin(
  toolkit: { slug?: string | null; icon_emoji?: string | null } | null | undefined,
  theme: ToolkitTheme
): BoardSkin {
  const accent = theme.accent;
  // Toile claire/teintée, jamais sombre (corporate)
  const surfaceTone = isLight(accent) ? "#FAFAF7" : "#F6F7FB";

  const slug = toolkit?.slug || "default";
  const emblems: BoardSkin["emblem"]["kind"][] = ["emoji", "rings", "compass", "grid"];
  const kind = toolkit?.icon_emoji
    ? "emoji"
    : emblems[hashStr(slug) % emblems.length];

  return {
    accent,
    cornerColor: accent,
    emblem: { kind, value: toolkit?.icon_emoji || undefined },
    surfaceStyle: {
      background: `
        radial-gradient(ellipse at 50% 0%, ${accent}0F, transparent 60%),
        radial-gradient(ellipse at 50% 100%, ${accent}08, transparent 55%),
        ${surfaceTone}
      `,
      backgroundImage: theme.patternSvg,
      backgroundRepeat: "repeat",
      backgroundBlendMode: "normal",
    },
  };
}
