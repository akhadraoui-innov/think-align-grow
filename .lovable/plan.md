

## Audit E2E — Hack & Show (Sprints 1-8)

Apres lecture exhaustive du code, voici l'etat de chaque flux utilisateur et les problemes identifies.

---

### Front-office utilisateur

| Flux | Statut | Problemes |
|------|--------|-----------|
| **Landing (Index)** | OK | Liens CTA fonctionnels, navigation coherente |
| **Auth** | OK | Login/signup via AuthPage |
| **Explorer** | OK | Pillars + cards depuis DB, recherche, filtres phase, FlipCard |
| **Lab / Quiz** | OK | Questions DB, scores persistes dans `quiz_results`, RadarChart hydrate au reload |
| **Profil authentifie** | OK | Stats live (XP, credits, cartes, quiz), edition, orgs, deconnexion |
| **OrgSwitcher** | OK | Sidebar footer, persistance localStorage |
| **Coach IA** | OK | Debit 1 credit/message, edge function `ai-coach` deploye |
| **Outils Reflexion/Livrables** | Placeholder | Affiche "Sprint 9" — attendu |
| **Workshop creation** | OK | Debit credits, quota check, org_id passe |
| **Workshop join** | OK | Code 6 chars, upsert participant |
| **Challenge creation** | OK | Templates DB, debit credits, quota check |
| **Credits display** | OK | Sidebar + AI page + Profile |

### Back-office Admin

| Module | Statut | Problemes |
|--------|--------|-----------|
| **Dashboard** | OK | Stats, graphiques |
| **Organisations** | OK | CRUD + 8 onglets |
| **Utilisateurs** | OK | Fiche detaillee |
| **Toolkits** | OK | 7 onglets |
| **Billing** | OK | Plans CRUD, subs, credits/org, BarChart mensuel |
| **Logs** | OK | Filtres, pagination, display_name, export CSV |
| **Workshops** | OK | Liste admin |
| **Design Innovation** | Placeholder | Prevu Sprint futur |
| **Settings** | Placeholder | Prevu Sprint futur |

### Problemes identifies dans le code

| # | Severite | Description | Fichier |
|---|----------|-------------|---------|
| 1 | **Moyenne** | `Profile.tsx` fait `window.location.reload()` apres save — perte de state React, UX cassee. Devrait invalider le query cache et refetch le profil. | `Profile.tsx:106` |
| 2 | **Moyenne** | `OrgContext` est wrappé AVANT `BrowserRouter` dans `App.tsx` — mais `useAuth` dans `OrgContext` ne depend pas du router, donc OK. Cependant si un composant enfant de OrgProvider utilise `useNavigate`, ca crash. | `App.tsx` |
| 3 | **Faible** | `useJoinWorkshop` redirige toujours vers `/workshop/:id` meme pour un challenge (config.type === "challenge"). Le participant rejoint un challenge mais atterrit sur la vue workshop. | `useWorkshop.ts:110` |
| 4 | **Faible** | `Explore.tsx` — quand on recherche par query, le filtre phase est ignore (le filtre s'applique apres sur `filteredCards` mais le search reset `selectedPillarId` sans reset `activePhase`). Comportement coherent mais potentiellement confusant. | `Explore.tsx:39-51` |
| 5 | **Faible** | `useQuotas` compte les challenges comme tous les workshops avec `config IS NOT NULL` — imprecis. Devrait filtrer `config->>'type' = 'challenge'`. | `useQuotas.ts:58-63` |
| 6 | **Info** | `ChatInterface` ne gere pas le cas ou l'utilisateur n'est pas authentifie — `useSpendCredits` va throw. | `ChatInterface.tsx` |

### Architecture & Securite : RAS

- RLS exhaustives et coherentes sur toutes les tables
- `is_saas_team()` SECURITY DEFINER pour admin
- `spend_credits()` atomique avec `FOR UPDATE` lock
- Pas de fuite de donnees inter-orgs visible
- Pas d'injection SQL possible (SDK parametrise)

---

## Recommandation : Sprint 9

Basé sur l'audit, le sprint suivant le plus impactant est **les corrections des bugs identifies + les outils IA Reflexion/Livrables** :

### Sprint 9 — Corrections + Outils IA specialises

**Corrections (1-2)** :
1. `Profile.tsx` : remplacer `window.location.reload()` par invalidation React Query + refetch profile dans useAuth
2. `useWorkshop.ts:110` : rediriger vers `/challenge/:id` si le workshop rejoint a `config.type === "challenge"`
3. `useQuotas.ts` : corriger le comptage des challenges (filtrer par `config->>'type'`)

**Outils IA (3-4)** :
4. **Generateur de Reflexion** : edge function `ai-reflection` avec prompt specialise (analyse situation → plan de jeu structure en JSON), UI formulaire multi-etapes (contexte, probleme, objectifs) → rendu structure
5. **Generateur de Livrables** : edge function `ai-deliverables` avec prompts par type (SWOT, BMC, Pitch Deck, Plan d'action), selection du type → generation → rendu formaté avec sections exportables

Chaque outil debite les credits affiches (2 pour Reflexion, 5 pour Livrables) via `useSpendCredits`.

| Action | Fichier |
|--------|---------|
| Fix | `src/pages/Profile.tsx` — supprimer reload, invalider cache |
| Fix | `src/hooks/useWorkshop.ts` — redirect challenge sur join |
| Fix | `src/hooks/useQuotas.ts` — comptage challenge precis |
| Create | `supabase/functions/ai-reflection/index.ts` |
| Create | `supabase/functions/ai-deliverables/index.ts` |
| Rewrite | `src/pages/AI.tsx` — integrer les 2 nouveaux outils |
| Create | `src/components/ai/ReflectionTool.tsx` |
| Create | `src/components/ai/DeliverablesTool.tsx` |

