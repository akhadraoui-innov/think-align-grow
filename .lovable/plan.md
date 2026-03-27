

# Refonte Premium+ du Catalogue Simulateur — Design, Insights Panel & Expérience Guidée

## Problème constaté

1. **Catalogue plat** : grille de cards identiques, pas de hiérarchie visuelle, pas de mise en avant
2. **Lancement brut** : le scénario initial est une phrase sèche sans contexte, sans consignes, sans guidance
3. **Aucun panel d'insights** : l'utilisateur ne comprend pas ce qu'il va apprendre, quelles compétences sont visées, quel est le déroulé
4. **Pas de sélecteur d'aide** avant lancement
5. **OnboardingOverlay trop minimaliste** : icône + titre + badges — pas de "comment ça marche", pas d'exemple

## Plan d'implémentation

### 1. Refonte du catalogue `Simulator.tsx` — Design Premium+

- **Hero section** avec gradient subtil, titre éditorial ("Centre de Simulation Professionnelle"), sous-titre positionnement ("Acculturation · Certification · Support Métier"), stats animées (X modes, Y univers)
- **Navigation par univers** : barre horizontale de pills/chips scrollable (12 univers) au lieu de Select dropdown — plus visuel, plus direct
- **Cards enrichies** : hauteur uniforme, icône colorée par univers, indicateur de difficulté visuel (dots), nombre de sessions complétées (si dispo), hover avec preview du scénario
- **Section "Recommandés pour vous"** en haut (3-4 cards mises en avant basées sur l'univers le plus populaire ou random featured)

### 2. Panel d'Insights à droite — Nouveau composant `SimulatorInsightPanel.tsx`

Quand l'utilisateur clique/hover une carte, un **panel latéral droit** s'ouvre (slide-in, ~380px) affichant en Markdown enrichi :

```text
┌─────────────────────────────────┐
│ [Icône]  Adoption Strategy      │
│ Univers: Transformation IA      │
│ Interface: Chat & Coaching      │
├─────────────────────────────────┤
│ 📋 Ce que vous allez pratiquer  │
│ Description immersive 3-4 lignes│
│                                 │
│ 🎯 Compétences développées      │
│ • Gestion du changement         │
│ • Communication stakeholders    │
│ • Mesure d'adoption             │
│                                 │
│ 📊 Critères d'évaluation        │
│ ┌──────────────┬──────────┐     │
│ │ Stratégie    │ ████░░ 3 │     │
│ │ Communication│ ████░░ 3 │     │
│ │ Résultats    │ ███░░░ 2 │     │
│ └──────────────┴──────────┘     │
│                                 │
│ 💡 Conseils pour bien démarrer  │
│ "Commencez par cartographier    │
│  les parties prenantes..."      │
│                                 │
│ ──── Niveau d'accompagnement ── │
│ [Autonome] [Guidé ✓] [Intensif] │
│                                 │
│     [ ▶ Lancer la simulation ]  │
└─────────────────────────────────┘
```

Contenu généré statiquement par mode via un mapping `INSIGHT_DATA` dans un nouveau fichier `config/modeInsights.ts` — données riches : description longue, compétences cibles, conseils de démarrage, exemples de premier message.

### 3. Enrichir le scénario de lancement — `config/scenarioTemplates.ts`

Nouveau fichier contenant `generateRichScenario(practiceType, difficulty, aiLevel)` qui produit un message d'accueil structuré en Markdown :

```markdown
## 🎯 Simulation : Stratégie d'adoption

**Contexte** — Vous êtes responsable du déploiement d'un nouvel outil IA dans une entreprise de 500 personnes. 30% des managers sont réticents.

**Votre mission** — Construisez une stratégie d'adoption complète en interagissant avec les différentes parties prenantes.

**Vous serez évalué sur :**
- Qualité de la stratégie · Gestion des objections · Résultats mesurables

---

💡 *Commencez par décrire votre approche ou posez une question pour comprendre la situation.*
```

### 4. Suggestions initiales automatiques dans `ChatMode.tsx`

Quand `messages.length === 1` (seul le scenario) et `aiAssistanceLevel !== "autonomous"`, afficher 3 chips de suggestion contextuelle hardcodées par `practiceType` (dans `scenarioTemplates.ts`).

Exemples pour `adoption_strategy` :
- "Décris-moi l'organisation et ses résistances"
- "Quels outils sont déjà en place ?"
- "Je propose un plan en 3 phases"

### 5. OnboardingOverlay enrichi

- Section "Comment ça marche" avec 3 étapes visuelles (icône + texte) : Briefing → Interaction → Évaluation
- Afficher le niveau d'aide sélectionné
- Exemple de premier message pour rassurer
- Design premium : plus d'espace, typographie serif pour le titre, gradient léger

### 6. System prompt injection pour standalone

Dans `Simulator.tsx`, au lieu de `systemPrompt=""`, construire le prompt depuis `BEHAVIOR_INJECTIONS[key]` + instructions d'assistance selon le niveau choisi.

---

## Fichiers

| Fichier | Action |
|---------|--------|
| `src/components/simulator/config/modeInsights.ts` | Nouveau — données riches par mode (description, compétences, conseils) |
| `src/components/simulator/config/scenarioTemplates.ts` | Nouveau — briefings Markdown + suggestions initiales par mode |
| `src/components/simulator/widgets/SimulatorInsightPanel.tsx` | Nouveau — panel latéral Premium+ |
| `src/pages/Simulator.tsx` | Refonte — hero, pills navigation, layout 2 colonnes, sélecteur aide, injection prompt |
| `src/components/simulator/modes/ChatMode.tsx` | Modifié — suggestions initiales automatiques |
| `src/components/simulator/widgets/OnboardingOverlay.tsx` | Modifié — enrichissement "comment ça marche" |

## Ordre

1. `modeInsights.ts` + `scenarioTemplates.ts` (données)
2. `SimulatorInsightPanel.tsx` (panel)
3. `Simulator.tsx` (refonte complète)
4. `ChatMode.tsx` (suggestions initiales)
5. `OnboardingOverlay.tsx` (enrichissement)

