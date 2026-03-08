

# Plan : Refonte Complete Hack & Show — Application Market-Grade

## Diagnostic de l'existant

L'app actuelle est un prototype mobile-only avec des animations decoratives. Il n'y a pas d'authentification, pas de vraie IA, pas de systeme de credits, pas de layout desktop, et seulement 54 cartes sur 200. Le chat IA renvoie des reponses hardcodees. Les politiques RLS sont encore en mode RESTRICTIVE (le fix precedent peut ne pas avoir pris effet).

---

## Architecture cible

```text
┌─────────────────────────────────────────────────────┐
│                    HACK & SHOW                       │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │  MAIN CONTENT                            │
│          │                                          │
│ Explorer │  ┌─────────────────────────────────┐    │
│ Plans    │  │  Breadcrumb / Context bar       │    │
│ Lab      │  ├─────────────────────────────────┤    │
│ IA       │  │                                 │    │
│ ───────  │  │  Page content                   │    │
│ Profil   │  │  (responsive grid/list)         │    │
│ Settings │  │                                 │    │
│          │  └─────────────────────────────────┘    │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
  Desktop: sidebar + main
  Mobile: bottom nav + full screen (comme maintenant)
```

---

## Phase 1 — Fondations (cette implementation)

### 1.1 Fix RLS + Seed complet (200 cartes)

Les politiques RLS sont encore `RESTRICTIVE`. Migration pour les recrer en `PERMISSIVE` explicitement. Seed des ~150 cartes manquantes pour couvrir les 10 piliers complets (les 54 existantes + 146 nouvelles couvrant toutes les phases).

### 1.2 Layout responsive Atlassian-style

- **Desktop** (>1024px) : Sidebar collapsible a gauche (logo, navigation, user) + zone de contenu principale avec max-width.
- **Tablet** : Sidebar en overlay.
- **Mobile** : Bottom nav preservee, sidebar accessible via hamburger.
- Composant `AppShell` qui gere le layout, remplace le pattern actuel page-par-page.
- Command palette (cmdk est deja installe) accessible via `Cmd+K` pour rechercher cartes, piliers, plans.

### 1.3 Authentification complete

- Page `/auth` avec login email/password + inscription.
- Auto-confirm desactive (verification email).
- Google OAuth via Lovable Cloud.
- Apres login : redirection vers `/explore`.
- Profil connecte : affiche display_name, avatar, XP, progression.
- Guard sur les pages qui necessitent auth (Plans saves, AI, progression).

### 1.4 Systeme de credits et monetisation

Tables supplementaires :
- `user_credits` : `user_id`, `balance`, `lifetime_earned`, `updated_at`
- `credit_transactions` : `user_id`, `amount`, `type` (earned/spent/purchased), `description`, `created_at`
- Trigger : 5 credits gratuits a l'inscription.

Logique :
- 40% gratuit : Explorer les cartes, voir les piliers, quiz basique (1 par jour), parcourir les plans.
- 30% credits : Coach IA (1 credit/message), generateur de livrables (3-5 credits), diagnostic avance.
- 30% abonnement : Acces illimite, dashboard manager, multi-toolkit, branding custom.

### 1.5 Pages refondees

**Explorer** (gratuit) :
- Vue grille/liste toggle (Atlassian-style).
- Filtres persistants : pilier, phase, recherche.
- Carte enrichie : bookmark, "vue", compteur de vues communautaire.
- Detail carte en side panel (pas nouvelle page).

**Plans de Jeu** (gratuit pour parcourir, credits pour sauvegarder) :
- Progression persistee en base (`user_plan_progress`).
- Reprise la ou on s'est arrete.
- Timer par etape.

**Lab / Diagnostic** (1 gratuit, puis credits) :
- Resultats sauvegardes en base (`quiz_results`).
- Historique des diagnostics avec comparaison dans le temps.
- Radar chart ameliore avec overlay des resultats precedents.

**IA** (credits) :
- Coach IA reel via Lovable AI (google/gemini-2.5-flash).
- Edge function qui recoit le message + contexte (cartes du toolkit, profil utilisateur) et renvoie une reponse structuree.
- Generateur de livrables : SWOT, BMC, Pitch Deck en markdown.

**Profil** :
- Dashboard de progression : cartes vues, quiz faits, plans completes.
- Historique des credits.
- Parametres du compte.

### 1.6 Design system upgrade

- Conserver le dark theme et les pillar colors (ils fonctionnent bien).
- Ajouter des composants Atlassian-style : tables, breadcrumbs, side panels, command palette, toggles vue grille/liste.
- Typographie plus dense pour le desktop.
- Spacing et padding adaptes responsive.

---

## Fichiers a creer/modifier

| Fichier | Action |
|---|---|
| `src/components/layout/AppShell.tsx` | Creer — layout responsive sidebar + main |
| `src/components/layout/Sidebar.tsx` | Creer — navigation desktop |
| `src/components/layout/CommandPalette.tsx` | Creer — recherche globale Cmd+K |
| `src/components/layout/Breadcrumb.tsx` | Creer — fil d'ariane contextuel |
| `src/components/auth/AuthPage.tsx` | Creer — login/signup |
| `src/components/auth/AuthGuard.tsx` | Creer — protection routes |
| `src/hooks/useAuth.ts` | Creer — session + user state |
| `src/hooks/useCredits.ts` | Creer — balance + transactions |
| `src/pages/Auth.tsx` | Creer — page auth dediee |
| `supabase/functions/ai-chat/index.ts` | Creer — edge function coach IA |
| `supabase/functions/ai-generate/index.ts` | Creer — edge function livrables |
| Migration SQL | Credits tables + trigger inscription |
| Migration SQL | Fix RLS RESTRICTIVE → PERMISSIVE |
| Seed SQL | 146 cartes supplementaires |
| `src/App.tsx` | Modifier — AppShell wrapper, routes auth |
| `src/pages/Explore.tsx` | Modifier — grille/liste, side panel, bookmarks |
| `src/pages/Plans.tsx` | Modifier — progression persistee |
| `src/pages/Lab.tsx` | Modifier — historique, comparaison |
| `src/pages/AI.tsx` | Modifier — vrai chat IA |
| `src/pages/Profile.tsx` | Modifier — dashboard connecte |
| `src/components/ai/ChatInterface.tsx` | Modifier — appel edge function |
| `src/index.css` | Modifier — variables desktop spacing |

---

## Ordre d'execution

1. Fix RLS (migration)
2. Seed 200 cartes completes
3. Layout AppShell + Sidebar + responsive
4. Command Palette
5. Auth (page + hooks + guard + Google OAuth)
6. Credits (tables + trigger + hook)
7. Refonte Explorer (grille/liste, side panel, bookmarks)
8. Refonte Plans (progression persistee)
9. Refonte Lab (historique, comparaison)
10. Edge functions IA + refonte page AI
11. Refonte Profil (dashboard)

Cela represente ~8-12 messages d'implementation. Le premier message couvrira les etapes 1-4 (fondations infra + layout).

