

## 1. Audit du plan v2 — ce qui est fait vs manquant

### ✅ Livré
| Item | Statut |
|---|---|
| 5 tables DB (`practice_organizations`, `practice_user_assignments`, `practice_versions`, `practice_blocks`, `practice_variants`) | ✅ |
| 16 colonnes étendues sur `academy_practices` | ✅ |
| RLS multi-source (`is_public OR org OR user assignment`) | ✅ |
| Page `/admin/practices` + `StudioShell` 3 colonnes | ✅ |
| 8 onglets (Identity, Scenario, AI, Mechanics, Coaching, Evaluation, Distribution, Analytics) | ✅ |
| Live preview streaming | ✅ |
| Autosave 800 ms + snapshot manuel | ✅ |
| Lecture Portal unifiée (public OR org OR user) | ✅ |
| Hook centralisé `useAdminPractices` | ✅ |

### ❌ Incohérences critiques (paramètres sans impact runtime)
1. **`coaching_mode`** (proactive/socratic/challenger/silent) — saisi mais **jamais lu** par `academy-practice` (n'utilise que `ai_assistance_level`)
2. **`model_override` + `temperature_override`** — l'edge function reste hardcodé sur `gemini-2.5-flash` à 8192 tokens
3. **`evaluation_strategy` / `evaluation_dimensions` / `evaluation_weights`** — l'edge function évalue toujours via `evaluation_rubric` uniquement
4. **`restitution_template`** (sections, ton, min_score) — ignoré par le format de restitution figé dans l'edge
5. **`objectives` SMART + `success_criteria`** — pas injectés dans le system prompt
6. **`guardrails`** — saisis mais non concaténés
7. **`phases`** — pas envoyées à l'IA
8. **`is_public`** — apparaît 2× (Identity + Distribution) → dupliqué (UX confuse)
9. **Versions** : snapshot manuel uniquement, pas d'auto-snapshot, pas de diff, pas de rollback
10. **Tables `practice_blocks` / `practice_variants`** créées mais **0 UI**
11. **Bug runtime** : `Stat` warning ref dans `AnalyticsTab` (composant interne sans forwardRef ciblé par Tabs)
12. **Live preview** : utilise `system_override` brut → ne reflète pas behavior_injection ni coaching_mode → ne représente PAS la vraie session

## 2. Plan de finalisation v2.1 (cohérence + UX) puis extensions v2.2

### Phase A — Cohérence runtime (CRITIQUE, à faire d'abord)

**Edge function `academy-practice`**
- Lire et utiliser : `model_override`, `temperature_override`, `coaching_mode`, `objectives`, `success_criteria`, `guardrails`, `phases`, `evaluation_strategy`, `evaluation_dimensions`, `evaluation_weights`, `restitution_template`
- Ajouter 5 templates de posture coaching (proactive/socratique/challenger/silent/intensive) injectés dans le system prompt
- Construire dynamiquement le bloc `evaluation` selon `evaluation_strategy` (rubric vs dimensions pondérées vs hybride vs holistique)
- Filtrer les sections de restitution selon `restitution_template.sections`
- Adapter le ton du feedback selon `restitution_template.tone`
- Endpoint live preview : renvoyer le **même** prompt assemblé (preview = vérité)

### Phase B — UX Studio polish

- Supprimer doublon `is_public` (garder dans Distribution uniquement, badge en header)
- Header onglets : badge rouge sur onglets incomplets (titre vide, prompt vide, somme dimensions ≠ 100, aucune diffusion)
- Indicateur autosave plus visible (chip animé)
- Fix bug `Stat` ref warning (extraire hors fonction interne)
- Live preview : badge "Reflet exact" + bouton "Reset session"
- Ajouter compteur visible des sessions/score moyen dans la liste de pratiques
- Raccourcis clavier (Cmd+S, Cmd+P, Cmd+D)
- Onglet **Versions** dédié (sortir de Analytics) avec : auto-snapshot toutes les 10 modifs, diff visuel, bouton rollback
- Onglet **Évaluation** : visualisation circulaire des poids, alerte si ≠ 100%
- Onglet **Coaching** : prévisualisation du prompt système injecté pour la posture choisie

### Phase C — 3 innovations v2.2 (extensions du plan v2)

#### C.1 Bibliothèque de blocs réutilisables
- Drawer global "Library" accessible depuis le top bar
- 5 types : `persona`, `rubric`, `guardrail`, `mechanic`, `prompt_snippet`
- Chaque bloc : nom, description, contenu JSONB, scope (global / org)
- Bouton "Insérer ce bloc" sur chaque champ texte concerné
- Bouton "Sauver comme bloc" sur chaque section éditée (capitalisation rapide)
- Filtre par type + recherche full-text

#### C.2 Variantes A/B
- Nouvel onglet **Variantes** entre Coaching et Évaluation
- Liste des variantes (max 4) avec poids de routage (sliders sommant 100%)
- Édition diff côté droit : prompt système alternatif uniquement
- Routage côté `academy-practice` : tirage pondéré au démarrage de session
- Persistance variant_id sur `academy_practice_sessions` (champ JSONB metadata)
- Onglet Analytics enrichi : score moyen et taux complétion **par variante** + winner détecté

#### C.3 AI Co-pilote d'édition
- Bouton flottant "Co-pilote" en haut à droite du Studio
- Drawer avec 6 actions one-click contextuelles à l'onglet actif :
  - Identité : "Suggère 5 titres alternatifs"
  - Scénario : "Améliore le brief", "Génère 3 objectifs SMART"
  - AI : "Renforce le system prompt", "Génère 5 garde-fous"
  - Évaluation : "Génère une rubric pondérée", "Challenge mes critères"
  - Coaching : "Génère 5 hints adaptés"
  - Variantes : "Génère 2 variantes opposées"
- Edge function `practice-copilot` (nouvelle) — Lovable AI Gateway
- Insertion en mode "diff preview" : l'admin valide avant d'appliquer

## 3. Fichiers impactés

| Cible | Action |
|---|---|
| `supabase/functions/academy-practice/index.ts` | **Refonte** : exploiter tous les nouveaux champs |
| `supabase/functions/practice-copilot/index.ts` | **Nouveau** |
| `src/components/admin/practice-studio/StudioShell.tsx` | Badges complétion + raccourcis + bouton Library + Co-pilote |
| `src/components/admin/practice-studio/tabs/IdentityTab.tsx` | Retirer doublon `is_public` |
| `src/components/admin/practice-studio/tabs/AnalyticsTab.tsx` | Fix ref warning + analytics par variante |
| `src/components/admin/practice-studio/tabs/EvaluationTab.tsx` | Donut chart poids + alerte ≠100% |
| `src/components/admin/practice-studio/tabs/CoachingTab.tsx` | Preview prompt généré |
| `src/components/admin/practice-studio/tabs/VariantsTab.tsx` | **Nouveau** |
| `src/components/admin/practice-studio/tabs/VersionsTab.tsx` | **Nouveau** (sortir d'Analytics) |
| `src/components/admin/practice-studio/BlockLibrary.tsx` | **Nouveau** drawer |
| `src/components/admin/practice-studio/AICopilot.tsx` | **Nouveau** drawer |
| `src/components/admin/practice-studio/LivePreviewPanel.tsx` | Appeler nouvel endpoint preview cohérent |
| `src/hooks/useAdminPractices.ts` | + hooks blocks + variants + auto-snapshot |
| `src/pages/admin/AdminPracticeStudio.tsx` | +2 onglets (Variantes, Versions) + Library + Co-pilote |

## 4. Ordre d'exécution

1. **Phase A** (cohérence runtime) — sans cela, tous les paramètres sont décoratifs
2. **Phase B** (UX polish + bug fixes)
3. **Phase C.1** Bibliothèque de blocs
4. **Phase C.2** Variantes A/B
5. **Phase C.3** AI Co-pilote

