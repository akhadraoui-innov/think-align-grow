

## Audit complet du Practice Studio v2.2

### ✅ Conforme au plan
| Item | État | Note |
|---|---|---|
| 5 tables DB + 16 colonnes + RLS | ✅ | Conforme |
| 10 onglets (8 + Variantes + Versions) | ✅ | OK |
| Edge function `academy-practice` consomme tous les nouveaux champs | ✅ | `coaching_mode`, `model_override`, `evaluation_strategy`, `restitution_template`, `objectives`, `phases`, `guardrails`, `attached_data`, variants A/B routés |
| Live preview branché sur `preview_practice` (reflet exact) | ✅ | Edge applique `buildSystemPrompt` identique |
| AICopilot drawer + 9 actions contextuelles | ✅ | OK |
| Block Library drawer (5 types) | ✅ | OK |
| Versions tab avec snapshot + restore | ✅ | OK |
| Auto-snapshot tous les 10 saves | ✅ | OK |
| Raccourcis ⌘S/⌘⇧P/⌘⇧D/⌘K/⌘L | ✅ | OK |

### ❌ Bugs et incohérences détectés

| # | Problème | Sévérité | Fichier |
|---|---|---|---|
| 1 | **Console error** : `ActionRow` reçoit une ref invalide depuis `Sheet/ScrollArea` (function component sans `forwardRef`) | bloquant warning | `AICopilot.tsx` |
| 2 | `IdentityTab` importe `MODE_REGISTRY` mais le bouton de filtrage par famille UI n'est plus visible nulle part (mode picker pauvre) | UX | `IdentityTab.tsx` |
| 3 | Le `Select` du modèle utilise `"__default__"` comme valeur sentinel mais retourne `null` mal — peut écrire `"__default__"` en DB | bug data | `AIPromptsTab.tsx` |
| 4 | Onglet Évaluation : pas de visualisation circulaire des poids (plan B mentionnait donut chart) | UX | `EvaluationTab.tsx` |
| 5 | Coaching tab : pas de preview du prompt système réellement injecté (plan B) | UX | `CoachingTab.tsx` |
| 6 | Live preview : pas de bouton "Reset session" visible dans header (déjà présent mais peu lisible) | UX | `LivePreviewPanel.tsx` |
| 7 | Indicateur autosave statique : `"Enregistré 3s"` ne se met pas à jour après le rendu initial | UX | `StudioShell.tsx` |
| 8 | Liste des pratiques : pas de stats de session par item (plan B) ni d'icône d'univers | UX | `PracticeListPanel.tsx` |
| 9 | Tabs débordent légèrement sur 1392px de large (10 onglets) — pas de scroll horizontal | UX | `AdminPracticeStudio.tsx` |
| 10 | `BlockLibrary` : aucun moyen d'**insérer** un bloc dans un champ courant (drawer ouvert depuis topbar sans contexte) | feature | `BlockLibrary.tsx` |
| 11 | Snapshot manuel via topbar et via onglet Versions = 2 voies sans coordination claire | UX | `StudioShell.tsx` |
| 12 | Live preview ne montre pas quel **modèle** ni quelle **posture** sont actifs | UX | `LivePreviewPanel.tsx` |

## Plan de finalisation v2.3

### Bug fixes (P0)
1. `AICopilot.tsx` — wrap `ActionRow` avec `forwardRef` (élimine warning console)
2. `AIPromptsTab.tsx` — convertir `"__default__"` ↔ `null` proprement avant écriture DB

### UX/UI polish (P1)
3. **Indicateur autosave dynamique** : tick toutes les 10s dans `StudioShell` (timer interne), avec animation pulse pendant la sauvegarde
4. **Tabs scrollables horizontalement** + tabs avec icône (Identité, Scénario, IA, Mécanique, Coaching, A/B, Évaluation, Diffusion, Analytics, Versions)
5. **Liste pratiques enrichie** : icône d'univers, badge nombre de sessions, score moyen (mini hook ou prop), badge "Public/Org/Assigné"
6. **EvaluationTab** : donut SVG des poids (composant inline ~30 lignes) + alerte rouge si ≠ 100%
7. **CoachingTab** : carte "Aperçu posture injectée" qui affiche les 80 premiers caractères du `COACHING_POSTURES[mode]` (dupliqué côté front en const partagée)
8. **LivePreviewPanel** : header montre `Model: gemini-2.5-flash` + `Posture: socratic` + `Variantes: 2` (chips), bouton Reset plus visible

### Cohérence & contexte (P1)
9. **Snapshot unifié** : retirer le bouton snapshot du topbar (garder uniquement dans onglet Versions) pour éviter la confusion
10. **BlockLibrary contextuel** : ajouter bouton "Insérer dans le champ courant" qui pousse le contenu dans `system_prompt` ou `guardrails` selon `currentTab` actif (passé en prop)

### Vérification Live Preview (P0)
11. Tester via `supabase--curl_edge_functions` que `academy-practice` répond bien quand on envoie `preview_practice` (vérifier que le system prompt assemblé contient posture + objectifs + garde-fous)
12. Confirmer que le streaming SSE fonctionne dans le preview (pas de buffer côté edge)

### Fichiers à modifier
| Cible | Action |
|---|---|
| `src/components/admin/practice-studio/AICopilot.tsx` | forwardRef + bug fix |
| `src/components/admin/practice-studio/tabs/AIPromptsTab.tsx` | sentinel null fix |
| `src/components/admin/practice-studio/StudioShell.tsx` | timer autosave, retirer bouton snapshot, scroll horizontal tabs |
| `src/components/admin/practice-studio/PracticeListPanel.tsx` | univers icon, sessions count, badge diffusion |
| `src/components/admin/practice-studio/tabs/EvaluationTab.tsx` | donut chart SVG |
| `src/components/admin/practice-studio/tabs/CoachingTab.tsx` | preview posture injectée |
| `src/components/admin/practice-studio/LivePreviewPanel.tsx` | header model/posture, reset visible |
| `src/components/admin/practice-studio/BlockLibrary.tsx` | insertion contextuelle |
| `src/pages/admin/AdminPracticeStudio.tsx` | passe `currentTab` à BlockLibrary, tabs avec icônes/scroll |

### Hors scope (pour itération suivante)
- Diff visuel entre versions (heavy, à reporter)
- Drag-drop des phases (bibliothèque externe)
- Replay session exemplaires dans Analytics

### Ordre d'exécution
1. Bug fixes P0 (AICopilot ref + sentinel) — 5 min
2. Tests live preview via curl edge fn — 5 min  
3. UX polish P1 (autosave timer, tabs scroll, donut, posture preview, model header) — 25 min
4. Block library contextuel + suppression snapshot doublon — 10 min

