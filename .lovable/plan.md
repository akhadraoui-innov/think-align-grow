

## Audit E2E complet — Hack & Show (Sprints 1-10)

---

### 1. Bugs actifs et regressions

| # | Severite | Description | Fichier | Action |
|---|----------|-------------|---------|--------|
| 1 | **Haute** | `analyze-challenge` edge function n'est PAS dans `config.toml` → `verify_jwt` n'est pas configure → la fonction utilisera le JWT par defaut et peut echouer si appele sans token valide. De plus, elle n'utilise PAS le systeme de config IA parametrable (Sprint 10) — elle hardcode `LOVABLE_API_KEY` + gateway Lovable. | `supabase/config.toml`, `supabase/functions/analyze-challenge/index.ts` | Ajouter dans config.toml + refactorer avec le resolver AI config |
| 2 | **Haute** | `ai-coach` n'est PAS dans `config.toml` non plus → meme probleme de JWT. Seuls `ai-reflection`, `ai-deliverables` et `import-toolkit-cards` sont declares. | `supabase/config.toml` | Ajouter `[functions.ai-coach]` et `[functions.analyze-challenge]` |
| 3 | **Moyenne** | Console warning: `Badge` component cannot receive refs dans `AdminSettings.tsx` (ligne 281). Le `Badge` est utilise comme enfant direct de `TabsContent` qui tente de lui passer une ref. Warning React visible en prod. | `src/pages/admin/AdminSettings.tsx:281` | Wrapper le Badge dans un `<span>` ou utiliser `forwardRef` |
| 4 | **Moyenne** | `Explore.tsx` — quand on recherche par query (ligne 44), le filtre s'applique sur `allCards` (ignorant `selectedPillarId`), mais `activePhase` s'applique ensuite sur ces resultats. Si l'utilisateur est dans un pilier, tape une recherche, les resultats montrent des cartes de TOUS les piliers mais filtrees par phase. Comportement incoherent. | `src/Explore.tsx:39-51` | Quand `query` est non-vide, appliquer aussi `selectedPillarId` si actif, ou explicitement reset le pilier |
| 5 | **Moyenne** | `FlipCard.tsx` — la couleur du pilier est derivee du `slug` avec un map statique (`slugColors`), MAIS `CanvasCard.tsx` et `GameCard.tsx` utilisent `getPillarGradient()` qui priorise `pillar.color` depuis la DB. Si un admin change la couleur d'un pilier dans la DB, `FlipCard` dans Explore ne refletera PAS le changement — regression visuelle. | `src/components/ui/FlipCard.tsx` | Passer `pillar.color` a `FlipCard` et utiliser `getPillarGradient()` au lieu du map statique |
| 6 | **Moyenne** | `OrgProvider` est place AVANT `BrowserRouter` dans `App.tsx` (ligne 75-78). `OrgProvider` utilise `useAuth` qui ne depend pas du router — OK. Mais si un composant descendant de `OrgProvider` (mais au-dessus de `BrowserRouter`) utilise `useNavigate`, crash garanti. Actuellement pas le cas, mais fragile. | `src/App.tsx:72-84` | Deplacer `OrgProvider` a l'interieur de `BrowserRouter` |
| 7 | **Faible** | `useQuotas` workshop count (ligne 54-56) compte TOUS les workshops non-completed de l'org, y compris les challenges. Le `workshopCount` inclut donc les challenges. Seul `challengeCount` est filtre correctement. Le calcul de `canCreateWorkshop` devrait exclure les challenges du count workshops. | `src/hooks/useQuotas.ts:54-56` | Filtrer `.not("config->>type", "eq", "challenge")` pour le workshopCount |
| 8 | **Faible** | `ChatInterface.tsx` ne gere pas le cas ou `user` est null — `useSpendCredits` va throw "Non authentifie". Le check `hasCredits()` passe car le solde est 0, mais l'erreur est generique. | `src/components/ai/ChatInterface.tsx` | La page AI gere deja ce cas (toast + return), OK au niveau UX |
| 9 | **Info** | `ai-coach` utilise `google/gemini-2.5-flash` comme modele par defaut, tandis que `ai-reflection` et `ai-deliverables` utilisent `google/gemini-3-flash-preview`. Incoherence mineure dans les defaults. | Edge functions | Harmoniser |

---

### 2. Integration Sprint 10 — Config IA

| Composant | Statut | Detail |
|-----------|--------|--------|
| **Tables DB** (`ai_providers`, `ai_configurations`) | OK | Schema correct, RLS en place |
| **Edge `ai-coach`** | OK | Resolver config dynamique integre |
| **Edge `ai-reflection`** | OK | Resolver config dynamique integre |
| **Edge `ai-deliverables`** | OK | Resolver config dynamique integre |
| **Edge `analyze-challenge`** | **MANQUE** | Toujours hardcode sur Lovable gateway, pas de resolver |
| **Admin Settings UI** | OK | 3 onglets (Config, Providers, Prompts defaut) fonctionnels |
| **Org AI Config Tab** | OK | Toggle, CRUD, prompts par defaut collapsibles |
| **AI.tsx** | OK | `activeOrgId` passe aux 3 composants |
| **config.toml** | **INCOMPLET** | `ai-coach` et `analyze-challenge` manquants |

---

### 3. Cartes — Couleurs et formats (regression identifiee)

| Composant | Source couleur | Coherent ? |
|-----------|---------------|------------|
| `CanvasCard.tsx` (Workshop) | `getPillarGradient(slug, color)` → DB prioritaire | OK |
| `GameCard.tsx` (Challenge) | `getPillarGradient(slug, color)` → DB prioritaire | OK |
| `FlipCard.tsx` (Explore) | Map statique `slugColors` → ignore `pillar.color` DB | **REGRESSION** |
| `StickyNote.tsx` | Couleurs propres (yellow, pink...) | OK (pas lie aux piliers) |

La regression `FlipCard` signifie que si un admin modifie la couleur d'un pilier via la DB ou l'admin UI, les cartes dans Explorer garderont l'ancienne couleur hardcodee.

---

### 4. Securite et RLS

| Point | Statut |
|-------|--------|
| `ai_configurations` et `ai_providers` — RLS `is_saas_team()` | OK |
| API key stockee en clair dans `ai_configurations.api_key` | **Acceptable** (acces via service_role uniquement, jamais expose cote client) |
| Edge functions accedent via `SUPABASE_SERVICE_ROLE_KEY` | OK |
| Pas de fuite de cle API vers le client | OK — les composants front ne lisent jamais `api_key` |
| `spend_credits` atomique avec `FOR UPDATE` | OK |
| Pas d'injection SQL | OK — SDK parametrise |

---

### 5. Logique metier

| Flux | Statut | Note |
|------|--------|------|
| Credits: debit avant appel IA | OK | Si l'IA echoue, les credits sont quand meme debites — design decision acceptable |
| Quotas: workshop vs challenge | **Bug #7** | Workshop count inclut les challenges |
| Config IA: resolution org → global → fallback | OK | Teste dans les 3 edge functions |
| Join workshop/challenge routing | OK | Fix Sprint 9 en place |
| Profile update sans reload | OK | `refreshProfile()` en place |

---

### 6. Proposition de valeur et fonctionnalites

| Feature | Etat | Completude |
|---------|------|------------|
| Explorer (cartes, piliers, phases, recherche) | OK | Regression couleur FlipCard |
| Quiz + Radar | OK | Scores persistes |
| Coach IA | OK | Config parametrable |
| Reflexion IA | OK | Config parametrable |
| Livrables IA (SWOT, BMC, Pitch, Action Plan) | OK | Config parametrable |
| Workshop Canvas | OK | Cartes, stickies, groupes, fleches, temps reel |
| Challenge | OK sauf `analyze-challenge` | Non parametrable IA |
| Admin Dashboard | OK | Stats, graphiques |
| Admin Orgs (9 onglets dont IA) | OK | Complet |
| Admin Users | OK | Detail utilisateur |
| Admin Billing | OK | Plans, subs, credits |
| Admin Logs | OK | Filtres, export CSV |
| Admin Settings (Config IA) | OK | 3 onglets |
| Prompts par defaut visibles | OK | Lecture seule + reference dans OrgAIConfigTab |

---

### 7. Corrections recommandees (priorite)

1. **config.toml** : Ajouter `[functions.ai-coach]` et `[functions.analyze-challenge]` avec `verify_jwt = false`
2. **analyze-challenge** : Integrer le resolver AI config (comme les 3 autres edge functions)
3. **FlipCard.tsx** : Utiliser `getPillarGradient()` au lieu du map statique — passer `pillar` ou `pillar.color` en prop
4. **AdminSettings.tsx** : Corriger le warning Badge/ref (wrapper dans `<span>`)
5. **useQuotas.ts** : Exclure les challenges du workshop count
6. **App.tsx** : Deplacer `OrgProvider` a l'interieur de `BrowserRouter`
7. **Explore.tsx** : Harmoniser le comportement recherche + filtre pilier

