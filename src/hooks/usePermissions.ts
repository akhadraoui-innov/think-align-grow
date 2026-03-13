import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/* ─────────────────────────────────────────────
 * GRANULAR PERMISSION SYSTEM
 * Every feature of the platform has its own
 * permission key. Easy to extend: just add a
 * new entry in PERMISSION_REGISTRY and assign
 * it to the relevant roles in ROLE_PERMISSION_MAP.
 * ───────────────────────────────────────────── */

export interface PermissionDef {
  key: string;
  label: string;
  description: string;
  domain: string;
}

export interface PermissionDomain {
  key: string;
  label: string;
  icon: string; // lucide icon name
  permissions: PermissionDef[];
}

// ── PERMISSION REGISTRY ──────────────────────
// Organized by domain. Each permission is a dot-separated key.

export const PERMISSION_DOMAINS: PermissionDomain[] = [
  {
    key: "admin.dashboard",
    label: "Dashboard Admin",
    icon: "LayoutDashboard",
    permissions: [
      { key: "admin.dashboard.view", label: "Voir le dashboard", description: "Accès à la vue d'ensemble de la plateforme", domain: "admin.dashboard" },
      { key: "admin.dashboard.kpis", label: "Voir les KPIs", description: "Métriques clés : utilisateurs, toolkits, workshops…", domain: "admin.dashboard" },
      { key: "admin.dashboard.alerts", label: "Voir les alertes", description: "Alertes expiration abonnements, crédits faibles…", domain: "admin.dashboard" },
    ],
  },
  {
    key: "admin.organizations",
    label: "Organisations",
    icon: "Building2",
    permissions: [
      { key: "admin.orgs.view", label: "Voir les organisations", description: "Lister et consulter toutes les organisations", domain: "admin.organizations" },
      { key: "admin.orgs.create", label: "Créer une organisation", description: "Ajouter de nouvelles organisations à la plateforme", domain: "admin.organizations" },
      { key: "admin.orgs.edit", label: "Modifier une organisation", description: "Éditer les infos, logo, couleur, contacts", domain: "admin.organizations" },
      { key: "admin.orgs.delete", label: "Supprimer une organisation", description: "Supprimer définitivement une organisation", domain: "admin.organizations" },
      { key: "admin.orgs.members", label: "Gérer les membres", description: "Ajouter/retirer des membres, changer leurs rôles org", domain: "admin.organizations" },
      { key: "admin.orgs.teams", label: "Gérer les équipes", description: "Créer/modifier les équipes et affecter des membres", domain: "admin.organizations" },
      { key: "admin.orgs.toolkits", label: "Gérer l'accès toolkits", description: "Activer/désactiver des toolkits pour une organisation", domain: "admin.organizations" },
      { key: "admin.orgs.subscriptions", label: "Gérer les abonnements", description: "Créer et modifier les abonnements d'une organisation", domain: "admin.organizations" },
    ],
  },
  {
    key: "admin.users",
    label: "Utilisateurs",
    icon: "Users",
    permissions: [
      { key: "admin.users.view", label: "Voir les utilisateurs", description: "Lister et consulter tous les profils utilisateurs", domain: "admin.users" },
      { key: "admin.users.edit", label: "Modifier un profil", description: "Éditer les informations de profil d'un utilisateur", domain: "admin.users" },
      { key: "admin.users.roles", label: "Gérer les rôles", description: "Attribuer ou retirer des rôles plateforme", domain: "admin.users" },
      { key: "admin.users.credits", label: "Gérer les crédits", description: "Ajouter/retirer des crédits à un utilisateur", domain: "admin.users" },
      { key: "admin.users.activity", label: "Voir l'activité", description: "Consulter les logs d'activité d'un utilisateur", domain: "admin.users" },
      { key: "admin.users.orgs", label: "Gérer les organisations", description: "Ajouter/retirer un utilisateur d'organisations", domain: "admin.users" },
    ],
  },
  {
    key: "admin.toolkits",
    label: "Toolkits",
    icon: "Layers",
    permissions: [
      { key: "admin.toolkits.view", label: "Voir les toolkits", description: "Lister et consulter tous les toolkits (drafts inclus)", domain: "admin.toolkits" },
      { key: "admin.toolkits.create", label: "Créer un toolkit", description: "Ajouter un nouveau toolkit à la plateforme", domain: "admin.toolkits" },
      { key: "admin.toolkits.edit", label: "Modifier un toolkit", description: "Éditer les infos, tags, pricing, nomenclature", domain: "admin.toolkits" },
      { key: "admin.toolkits.publish", label: "Publier / Archiver", description: "Changer le statut d'un toolkit (draft → published → archived)", domain: "admin.toolkits" },
      { key: "admin.toolkits.delete", label: "Supprimer un toolkit", description: "Supprimer définitivement un toolkit et ses données", domain: "admin.toolkits" },
      { key: "admin.toolkits.pillars", label: "Gérer les piliers", description: "Créer, modifier, réorganiser les piliers d'un toolkit", domain: "admin.toolkits" },
      { key: "admin.toolkits.cards", label: "Gérer les cartes", description: "Créer, éditer, supprimer les cartes de chaque pilier", domain: "admin.toolkits" },
      { key: "admin.toolkits.challenges", label: "Gérer les challenges", description: "Créer et configurer les templates de challenges", domain: "admin.toolkits" },
      { key: "admin.toolkits.gameplans", label: "Gérer les game plans", description: "Configurer les parcours guidés et leurs étapes", domain: "admin.toolkits" },
      { key: "admin.toolkits.quiz", label: "Gérer les quiz", description: "Créer et éditer les questions de diagnostic", domain: "admin.toolkits" },
      { key: "admin.toolkits.import", label: "Importer des cartes", description: "Import en masse depuis un fichier CSV/JSON", domain: "admin.toolkits" },
      { key: "admin.toolkits.ai_generate", label: "Générer par IA", description: "Utiliser l'IA pour générer/raffiner un toolkit", domain: "admin.toolkits" },
    ],
  },
  {
    key: "admin.workshops",
    label: "Workshops",
    icon: "Presentation",
    permissions: [
      { key: "admin.workshops.view", label: "Voir les workshops", description: "Lister tous les workshops de la plateforme", domain: "admin.workshops" },
      { key: "admin.workshops.manage", label: "Gérer les workshops", description: "Modifier, supprimer ou forcer le statut d'un workshop", domain: "admin.workshops" },
      { key: "admin.workshops.participants", label: "Voir les participants", description: "Consulter les participants de chaque workshop", domain: "admin.workshops" },
      { key: "admin.workshops.canvas", label: "Voir les canvas", description: "Consulter le contenu des canvas de workshop", domain: "admin.workshops" },
    ],
  },
  {
    key: "admin.design_innovation",
    label: "Design Innovation",
    icon: "Lightbulb",
    permissions: [
      { key: "admin.challenges.view", label: "Voir les challenges", description: "Lister toutes les sessions de Design Innovation", domain: "admin.design_innovation" },
      { key: "admin.challenges.manage", label: "Gérer les challenges", description: "Modifier ou supprimer des sessions de challenge", domain: "admin.design_innovation" },
      { key: "admin.challenges.analyze", label: "Déclencher une analyse", description: "Lancer l'analyse IA d'une session de challenge", domain: "admin.design_innovation" },
    ],
  },
  {
    key: "admin.billing",
    label: "Crédits & Abonnements",
    icon: "CreditCard",
    permissions: [
      { key: "admin.billing.view", label: "Voir la facturation", description: "Consulter les plans, abonnements et transactions", domain: "admin.billing" },
      { key: "admin.billing.plans", label: "Gérer les plans", description: "Créer et modifier les plans d'abonnement", domain: "admin.billing" },
      { key: "admin.billing.subscriptions", label: "Gérer les abonnements", description: "Attribuer et modifier les abonnements des organisations", domain: "admin.billing" },
      { key: "admin.billing.credits", label: "Gérer les crédits", description: "Ajuster les balances de crédits globalement", domain: "admin.billing" },
    ],
  },
  {
    key: "admin.logs",
    label: "Logs d'activité",
    icon: "ScrollText",
    permissions: [
      { key: "admin.logs.view", label: "Voir les logs", description: "Consulter tous les logs d'activité de la plateforme", domain: "admin.logs" },
      { key: "admin.logs.export", label: "Exporter les logs", description: "Télécharger les logs en CSV/JSON", domain: "admin.logs" },
    ],
  },
  {
    key: "admin.settings",
    label: "Paramètres",
    icon: "Settings",
    permissions: [
      { key: "admin.settings.ai", label: "Configuration IA", description: "Configurer le fournisseur, modèles, température, tokens", domain: "admin.settings" },
      { key: "admin.settings.providers", label: "Fournisseurs IA", description: "Ajouter et configurer les fournisseurs d'IA", domain: "admin.settings" },
      { key: "admin.settings.prompts", label: "Prompts par défaut", description: "Consulter et surcharger les prompts système", domain: "admin.settings" },
      { key: "admin.settings.roles", label: "Gestion des rôles", description: "Voir la matrice rôles/permissions et les attributions", domain: "admin.settings" },
      { key: "admin.settings.platform", label: "Paramètres plateforme", description: "Configuration générale de la plateforme", domain: "admin.settings" },
    ],
  },
  {
    key: "app.explore",
    label: "Explorer",
    icon: "Compass",
    permissions: [
      { key: "app.explore.view", label: "Voir les toolkits", description: "Accéder aux toolkits publiés et consulter les cartes", domain: "app.explore" },
      { key: "app.explore.bookmark", label: "Marquer des favoris", description: "Ajouter des cartes aux favoris", domain: "app.explore" },
    ],
  },
  {
    key: "app.plans",
    label: "Plans de jeu",
    icon: "Map",
    permissions: [
      { key: "app.plans.view", label: "Voir les plans", description: "Accéder aux parcours guidés des toolkits", domain: "app.plans" },
      { key: "app.plans.progress", label: "Suivre la progression", description: "Marquer les étapes comme complétées", domain: "app.plans" },
    ],
  },
  {
    key: "app.lab",
    label: "Lab / Quiz",
    icon: "Gamepad2",
    permissions: [
      { key: "app.lab.quiz", label: "Passer un quiz", description: "Réaliser un diagnostic de maturité", domain: "app.lab" },
      { key: "app.lab.results", label: "Voir ses résultats", description: "Consulter l'historique de ses diagnostics", domain: "app.lab" },
    ],
  },
  {
    key: "app.ai",
    label: "Assistant IA",
    icon: "Sparkles",
    permissions: [
      { key: "app.ai.coach", label: "Coach IA", description: "Discuter avec le coach stratégique IA", domain: "app.ai" },
      { key: "app.ai.deliverables", label: "Générer des livrables", description: "Générer SWOT, BMC, Pitch Deck, Action Plan", domain: "app.ai" },
      { key: "app.ai.reflection", label: "Réflexion IA", description: "Utiliser l'outil de réflexion guidée IA", domain: "app.ai" },
    ],
  },
  {
    key: "app.workshop",
    label: "Workshop",
    icon: "Presentation",
    permissions: [
      { key: "app.workshop.create", label: "Créer un workshop", description: "Initier une session de workshop collaborative", domain: "app.workshop" },
      { key: "app.workshop.join", label: "Rejoindre un workshop", description: "Participer à un workshop via code d'invitation", domain: "app.workshop" },
      { key: "app.workshop.facilitate", label: "Faciliter un workshop", description: "Contrôler le déroulement (timer, étapes, cartes)", domain: "app.workshop" },
      { key: "app.workshop.deliverables", label: "Générer les livrables", description: "Lancer la génération IA des livrables du workshop", domain: "app.workshop" },
    ],
  },
  {
    key: "app.challenge",
    label: "Design Innovation",
    icon: "Lightbulb",
    permissions: [
      { key: "app.challenge.participate", label: "Participer", description: "Jouer une session de Design Innovation", domain: "app.challenge" },
      { key: "app.challenge.analyze", label: "Voir l'analyse", description: "Consulter l'analyse IA d'une session", domain: "app.challenge" },
    ],
  },
  {
    key: "app.profile",
    label: "Profil",
    icon: "User",
    permissions: [
      { key: "app.profile.edit", label: "Modifier son profil", description: "Éditer ses informations personnelles", domain: "app.profile" },
      { key: "app.profile.org", label: "Gérer ses organisations", description: "Voir et switcher entre ses organisations", domain: "app.profile" },
    ],
  },
];

// Flat lookups
export const PERMISSION_REGISTRY: Record<string, PermissionDef> = {};
PERMISSION_DOMAINS.forEach(d => d.permissions.forEach(p => { PERMISSION_REGISTRY[p.key] = p; }));

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_REGISTRY);

export const PERMISSION_LABELS: Record<string, string> = {};
Object.entries(PERMISSION_REGISTRY).forEach(([key, def]) => { PERMISSION_LABELS[key] = def.label; });

// ── ROLE → PERMISSION MAPPING ─────────────────
// Each role gets an explicit list of granular permission keys.
// To add a new permission: 1) add it to PERMISSION_DOMAINS above
// 2) assign it to the relevant roles below.

const ALL_ADMIN_PERMS = ALL_PERMISSION_KEYS.filter(k => k.startsWith("admin."));
const ALL_APP_PERMS = ALL_PERMISSION_KEYS.filter(k => k.startsWith("app."));
const ALL_PERMS = [...ALL_ADMIN_PERMS, ...ALL_APP_PERMS];

export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  // ── SaaS Team ──
  super_admin: [...ALL_PERMS],

  customer_lead: [
    // Dashboard
    "admin.dashboard.view", "admin.dashboard.kpis", "admin.dashboard.alerts",
    // Organizations — full
    ...ALL_PERMISSION_KEYS.filter(k => k.startsWith("admin.orgs.")),
    // Users — full
    ...ALL_PERMISSION_KEYS.filter(k => k.startsWith("admin.users.")),
    // Workshops — view + participants
    "admin.workshops.view", "admin.workshops.participants",
    // Billing — view + subscriptions
    "admin.billing.view", "admin.billing.subscriptions",
    // All app perms
    ...ALL_APP_PERMS,
  ],

  innovation_lead: [
    // Dashboard
    "admin.dashboard.view", "admin.dashboard.kpis",
    // Organizations — view + toolkits
    "admin.orgs.view", "admin.orgs.toolkits",
    // Toolkits — full
    ...ALL_PERMISSION_KEYS.filter(k => k.startsWith("admin.toolkits.")),
    // Workshops — view + canvas
    "admin.workshops.view", "admin.workshops.canvas",
    // Design Innovation — full
    ...ALL_PERMISSION_KEYS.filter(k => k.startsWith("admin.challenges.")),
    // Settings — AI + prompts
    "admin.settings.ai", "admin.settings.providers", "admin.settings.prompts",
    // All app perms
    ...ALL_APP_PERMS,
  ],

  performance_lead: [
    // Dashboard
    "admin.dashboard.view", "admin.dashboard.kpis", "admin.dashboard.alerts",
    // Organizations — view
    "admin.orgs.view", "admin.orgs.subscriptions",
    // Workshops — view
    "admin.workshops.view", "admin.workshops.participants",
    // Billing — full
    ...ALL_PERMISSION_KEYS.filter(k => k.startsWith("admin.billing.")),
    // Logs — view
    "admin.logs.view",
    // All app perms
    ...ALL_APP_PERMS,
  ],

  product_actor: [
    // Dashboard
    "admin.dashboard.view", "admin.dashboard.kpis",
    // Organizations — view
    "admin.orgs.view",
    // Toolkits — view + edit + cards + pillars (no delete/publish)
    "admin.toolkits.view", "admin.toolkits.edit", "admin.toolkits.pillars",
    "admin.toolkits.cards", "admin.toolkits.quiz", "admin.toolkits.gameplans",
    // Workshops — view + canvas
    "admin.workshops.view", "admin.workshops.canvas",
    // All app perms
    ...ALL_APP_PERMS,
  ],

  // ── Client Roles ──
  owner: [
    ...ALL_APP_PERMS,
    "app.workshop.create", "app.workshop.facilitate", "app.workshop.deliverables",
  ],

  admin: [
    ...ALL_APP_PERMS,
    "app.workshop.create", "app.workshop.facilitate",
  ],

  lead: [
    ...ALL_APP_PERMS,
    "app.workshop.create", "app.workshop.facilitate",
  ],

  facilitator: [
    ...ALL_APP_PERMS,
    "app.workshop.facilitate",
  ],

  manager: [
    "app.explore.view", "app.explore.bookmark",
    "app.plans.view", "app.plans.progress",
    "app.lab.quiz", "app.lab.results",
    "app.ai.coach",
    "app.workshop.create", "app.workshop.join",
    "app.challenge.participate", "app.challenge.analyze",
    "app.profile.edit", "app.profile.org",
  ],

  member: [
    "app.explore.view", "app.explore.bookmark",
    "app.plans.view", "app.plans.progress",
    "app.lab.quiz", "app.lab.results",
    "app.ai.coach",
    "app.workshop.join",
    "app.challenge.participate",
    "app.profile.edit", "app.profile.org",
  ],

  guest: [
    "app.explore.view",
    "app.workshop.join",
    "app.challenge.participate",
    "app.profile.edit",
  ],
};

// Deduplicate permissions per role
Object.keys(ROLE_PERMISSION_MAP).forEach(role => {
  ROLE_PERMISSION_MAP[role] = [...new Set(ROLE_PERMISSION_MAP[role])];
});

// ── HELPERS ──────────────────────────────────

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSION_MAP[role] || [];
}

export function getPermissionsForRoles(roles: string[]): string[] {
  const perms = new Set<string>();
  roles.forEach(r => getPermissionsForRole(r).forEach(p => perms.add(p)));
  return Array.from(perms);
}

export function hasPermission(userPerms: string[], perm: string): boolean {
  return userPerms.includes(perm);
}

export function hasAnyPermission(userPerms: string[], perms: string[]): boolean {
  return perms.some(p => userPerms.includes(p));
}

export function getDomainCoverage(role: string, domainKey: string): { granted: number; total: number } {
  const domain = PERMISSION_DOMAINS.find(d => d.key === domainKey);
  if (!domain) return { granted: 0, total: 0 };
  const rolePerms = getPermissionsForRole(role);
  const granted = domain.permissions.filter(p => rolePerms.includes(p.key)).length;
  return { granted, total: domain.permissions.length };
}

// ── SAAS ROLE LIST ──
const SAAS_ROLES = ["super_admin", "customer_lead", "innovation_lead", "performance_lead", "product_actor"];

// ── HOOK: DB-backed role permissions ─────────

/**
 * Fetches all role_permissions rows from the DB.
 * Used by usePermissions for the current user and by the admin UI.
 */
export function useRolePermissionsFromDB() {
  return useQuery({
    queryKey: ["role-permissions-db"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, permission_key");
      if (error) throw error;
      // Build map role → permission_key[]
      const map: Record<string, string[]> = {};
      (data || []).forEach((row: any) => {
        if (!map[row.role]) map[row.role] = [];
        map[row.role].push(row.permission_key);
      });
      return map;
    },
  });
}

function getPermsFromMap(
  dbMap: Record<string, string[]> | undefined,
  roles: string[],
): string[] {
  const source = dbMap && Object.keys(dbMap).length > 0 ? dbMap : ROLE_PERMISSION_MAP;
  const perms = new Set<string>();
  roles.forEach(r => (source[r] || []).forEach(p => perms.add(p)));
  return Array.from(perms);
}

export function getPermissionsForRoleFromDB(
  dbMap: Record<string, string[]> | undefined,
  role: string,
): string[] {
  const source = dbMap && Object.keys(dbMap).length > 0 ? dbMap : ROLE_PERMISSION_MAP;
  return source[role] || [];
}

// ── HOOK ─────────────────────────────────────

export interface Permissions {
  isSuperAdmin: boolean;
  isSaasTeam: boolean;
  canAccessAdmin: boolean;
  roles: string[];
  permissions: string[];
  has: (perm: string) => boolean;
  hasAny: (...perms: string[]) => boolean;
  loading: boolean;
  // Legacy compat — derived from granular
  canManageOrgs: boolean;
  canManageUsers: boolean;
  canManageToolkits: boolean;
  canManageWorkshops: boolean;
  canViewBilling: boolean;
  canViewLogs: boolean;
  canManageSettings: boolean;
  canManageDesignInnovation: boolean;
  canEditPlatformOwner: boolean;
}

export function usePermissions(): Permissions {
  const { user, loading: authLoading } = useAuth();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });

  const { data: dbMap, isLoading: dbLoading } = useRolePermissionsFromDB();

  const allPerms = getPermsFromMap(dbMap, roles as string[]);
  const has = (perm: string) => allPerms.includes(perm);
  const hasAnyFn = (...perms: string[]) => perms.some(p => allPerms.includes(p));

  const isSuperAdmin = roles.includes("super_admin" as any);
  const isSaasTeam = roles.some(r => SAAS_ROLES.includes(r as string));

  return {
    isSuperAdmin,
    isSaasTeam,
    canAccessAdmin: isSaasTeam,
    roles: roles as string[],
    permissions: allPerms,
    has,
    hasAny: hasAnyFn,
    loading: authLoading || rolesLoading || dbLoading,
    // Legacy compat
    canManageOrgs: has("admin.orgs.view"),
    canManageUsers: has("admin.users.view"),
    canManageToolkits: has("admin.toolkits.view"),
    canManageWorkshops: has("admin.workshops.view"),
    canViewBilling: has("admin.billing.view"),
    canViewLogs: has("admin.logs.view"),
    canManageSettings: has("admin.settings.roles") || has("admin.settings.ai"),
    canManageDesignInnovation: has("admin.challenges.view"),
    canEditPlatformOwner: isSuperAdmin,
  };
}