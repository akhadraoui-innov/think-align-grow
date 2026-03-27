

# Rapport Post-Session — PDF, Email, 5 KPIs, Premium++ Markdown

## Flux UX cible

```text
Session terminée → Rapport généré automatiquement → L'utilisateur le voit immédiatement
→ Bouton "Envoyer par email" → Il peut revenir dessus depuis l'historique
```

Pas de page intermédiaire ScoreReveal lourde. La session se termine, l'utilisateur est redirigé vers une page de rapport dédiée, persistante, consultable à tout moment.

---

## Bloc 1 — Enrichir le prompt d'évaluation IA

**Fichier** : `supabase/functions/academy-practice/index.ts`

Modifier les deux blocs `evaluate` (lignes 135-152) pour exiger un JSON enrichi :

```json
{
  "score": 72,
  "feedback": "Synthèse globale dense et utile...",
  "dimensions": [{"name": "Clarté", "score": 7}, ...],
  "kpis": {
    "communication_clarity": 7,
    "analysis_depth": 6,
    "adaptability": 8,
    "response_relevance": 7,
    "idea_structuring": 5
  },
  "strengths": [
    {"title": "Reformulation efficace", "detail": "Vous avez systématiquement reformulé..."}
  ],
  "improvements": [
    {"title": "Structuration", "detail": "Vos réponses manquent de structure...", "how": "Utilisez la méthode STAR : Situation → Tâche → Action → Résultat"}
  ],
  "learning_gaps": [
    {"topic": "Analyse de risques", "detail": "Sujet non abordé...", "resources": "Commencez par la matrice AMDEC..."}
  ],
  "explore_next": [
    {"topic": "Design Thinking", "why": "Votre approche centrée utilisateur est prometteuse..."}
  ],
  "best_practices": [
    {"title": "La règle des 5 pourquoi", "content": "Méthode Toyota pour identifier les causes racines..."},
    {"title": "Interagir avec l'IA", "content": "Structurez vos prompts : Contexte + Objectif + Contraintes + Format..."}
  ]
}
```

5 KPIs fixes : Clarté de communication, Profondeur d'analyse, Adaptabilité, Pertinence, Structuration. Chaque 0-10.

---

## Bloc 2 — Page de rapport en ligne (route persistante)

**Nouveau fichier** : `src/pages/SimulatorReport.tsx`  
**Route** : `/simulator/session/:sessionId/report`

Page dans le layout AppShell (header plateforme visible). Charge la session depuis `academy_practice_sessions` par ID. Design éditorial premium++ :

**Structure de la page :**

1. **Header** : Titre pratique, badge mode, date, "Tentative N", score animé avec grade
2. **5 KPIs** : 5 cards horizontales compactes avec icône, label, score /10, barre de progression colorée (vert ≥7, amber ≥4, rouge <4)
3. **Synthèse du coach** : Card avec bordure gauche primary, texte `leading-relaxed`, fond `bg-card`
4. **✅ Ce que vous faites bien** : Cards avec bordure gauche `emerald-500`, titre bold + détail prose
5. **⚠️ Ce que vous devez améliorer** : Cards bordure `amber-500`, titre + détail + encart "📌 Comment progresser" avec fond `bg-amber-50`
6. **📚 Ce que vous devez apprendre** : Cards bordure `blue-500`, sujet + pourquoi + "Par où commencer"
7. **🔭 Ce qui devrait vous intéresser** : Cards bordure `violet-500`, sujets connexes + pourquoi
8. **📖 Bonnes pratiques** : Section avec fond `bg-muted/30`, checklist stylisée, méthodes, retours d'expérience, tips IA
9. **💬 Vos échanges** : Transcript collapsible (ouvert par défaut), bulles user/assistant
10. **Actions** : "Envoyer par email" (primary), "Refaire la pratique", "Retour à l'historique"

Typographie : titres `text-xl font-bold`, body `text-sm leading-relaxed`, sections séparées par `<Separator />` et espaces `space-y-6`.

CSS `@media print` pour export PDF propre depuis le navigateur (masquer header, sidebar, boutons actions).

---

## Bloc 3 — Envoi par email (Edge Function)

**Nouveau fichier** : `supabase/functions/send-session-report/index.ts`

Edge function authentifiée qui :
1. Reçoit `session_id` 
2. Récupère la session + practice depuis DB (service role)
3. Récupère l'email de l'utilisateur depuis `auth.users`
4. Génère un HTML premium du rapport (même structure que la page)
5. Envoie via Lovable AI gateway (ou construit un lien de téléchargement)

Côté client : bouton "Envoyer par email" appelle cette function → toast de confirmation.

---

## Bloc 4 — Flux de fin de session

**Fichier** : `src/hooks/useSimulatorSession.ts`
- `completeSession` retourne le `sessionId` (actuellement void)

**Fichier** : `src/components/simulator/SimulatorEngine.tsx`
- `handleComplete` reçoit le `sessionId` retourné
- Appelle `navigate(/simulator/session/${sessionId}/report)` au lieu de juste remonter le score

**Fichier** : `src/components/simulator/widgets/ScoreReveal.tsx`
- Simplifié : ne sert plus que de fallback si pas de sessionId
- Ajout prop `sessionId` + bouton "Voir le rapport complet" qui navigue

---

## Bloc 5 — Historique multi-tentatives + lien rapport

**Fichier** : `src/pages/SimulatorHistory.tsx`
- Grouper sessions par `practice_id` 
- Afficher "Tentative 1, 2, 3..." avec score et delta (↗ +12)
- Chaque session terminée : bouton "Voir le rapport" → `/simulator/session/:id/report`

---

## Bloc 6 — Route

**Fichier** : `src/App.tsx`
- Ajouter : `<Route path="/simulator/session/:sessionId/report" element={<SimulatorReport />} />`

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/academy-practice/index.ts` | Prompt évaluation enrichi (5 KPIs, strengths, improvements, learning_gaps, explore_next, best_practices) |
| `src/pages/SimulatorReport.tsx` | **Nouveau** — rapport premium++ markdown |
| `supabase/functions/send-session-report/index.ts` | **Nouveau** — envoi email du rapport |
| `src/hooks/useSimulatorSession.ts` | Retourner sessionId depuis completeSession |
| `src/components/simulator/SimulatorEngine.tsx` | Navigation auto vers rapport post-session |
| `src/components/simulator/widgets/ScoreReveal.tsx` | Ajout lien rapport |
| `src/pages/SimulatorHistory.tsx` | Multi-tentatives + lien rapport |
| `src/App.tsx` | Route rapport |

## Ordre d'exécution

1. Edge function évaluation enrichie
2. SimulatorReport.tsx (page rapport)
3. Route App.tsx
4. useSimulatorSession + SimulatorEngine (flux auto)
5. send-session-report (email)
6. SimulatorHistory (multi-tentatives)
7. ScoreReveal (simplification)

