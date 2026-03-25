import type { Json } from "@/integrations/supabase/types";

export type ViewMode = "table" | "grid" | "timeline" | "kanban" | "treemap";

export const ASSET_TYPE_LABELS: Record<string, string> = {
  path: "Parcours", quiz: "Quiz", exercise: "Exercice",
  practice: "Pratique", persona: "Persona", campaign: "Campagne",
};

export const ASSET_TYPE_COLORS: Record<string, string> = {
  path: "hsl(var(--primary))", quiz: "hsl(262 80% 55%)",
  exercise: "hsl(174 70% 42%)", practice: "hsl(32 90% 55%)",
  persona: "hsl(340 75% 55%)", campaign: "hsl(210 80% 55%)",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon", published: "Publié", active: "Actif",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé",
};

export const GEN_MODE_LABELS: Record<string, string> = {
  manual: "Manuel", ai: "IA", hybrid: "Hybride",
};

export interface CatalogueAsset {
  id: string;
  asset_id: string;
  asset_type: string;
  name: string;
  organization_id: string | null;
  status: string | null;
  version_count: number;
  contributor_count: number;
  contributor_ids: string[];
  last_modified_at: string;
  last_modified_by: string | null;
  created_at: string;
  snapshot: Json;
}

export function getDisplayOrg(asset: CatalogueAsset, orgMap: Map<string, { name: string }>): string {
  if (asset.organization_id && orgMap.has(asset.organization_id)) {
    return orgMap.get(asset.organization_id)!.name;
  }
  return "Growthinnov";
}

export function getDisplayVersion(asset: CatalogueAsset): number {
  return Math.max(1, asset.version_count);
}

export function getDisplayContributors(asset: CatalogueAsset): number {
  return Math.max(1, asset.contributor_count);
}

export function getSnapshotField(asset: CatalogueAsset, field: string): string {
  return ((asset.snapshot as any)?.[field] as string) || "";
}
