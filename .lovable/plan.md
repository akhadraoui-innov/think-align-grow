

# Audit Product Owner — Module INSIGHT

## Verdict brutal : un prospect DRH décroche en 30 secondes

### Ce qui ne marche PAS pour un acheteur

1. **Trop de jargon technique** — "Markdown enrichi", "IA Tutor", "batch generation", "RBAC", "multi-tenant" — un DRH ne comprend pas et ne veut pas comprendre
2. **9 sections identiques** — Même pattern répété (Hero → Pain → Features → ValueProp). Le prospect fatigue après la 2ème section
3. **Pas de storytelling** — Aucun scénario concret du type "Lundi, Marie votre DRH ouvre la plateforme et en 10 minutes..."
4. **Discovery = pour développeurs** — Le flow n8n est impressionnant techniquement mais un DRH n'en a rien à faire
5. **Décideurs enterré en 8ème position** — C'est LA section la plus importante pour un acheteur, elle devrait être en haut
6. **Pas de parcours de lecture guidé** — Le prospect ne sait pas par où commencer ni dans quel ordre lire
7. **Aucun visuel différenciant** — Que des cards identiques, pas de before/after, pas de timeline, pas de chiffre qui claque en grand

### Ce qui MARCHE

- Le comparatif GROWTHINNOV vs LMS classique (Décideurs) — excellent
- Les KPIs par domaine métier (Discovery > Cas Métier) — concret
- Les workflows business cliquables — bonne mécanique interactive
- Le PlatformFlow — impressionnant pour un profil technique

## Solution : un onglet "Vue Essentielle" par section

Ajouter dans chaque section un système de 2 onglets :
- **Essentiel** (défaut) — Version prospect/DRH : storytelling, chiffres clés, avant/après, scénarios concrets, langage métier
- **Détaillé** — Le contenu actuel (technique, exhaustif)

### Contenu de chaque onglet "Essentiel"

**Overview Essentiel** :
- Accroche en une phrase choc ("Vos formations ne changent rien. Nous, si.")
- 4 chiffres d'impact en très grand (×3 vitesse, -70% coûts, 92% complétion, 100% traçable)
- Scénario "Avant/Après" en 2 colonnes : journée type sans GROWTHINNOV vs avec
- 3 témoignages fictifs courts (DRH, Manager, Consultant)
- CTA unique

**Formations Essentiel** :
- "En 5 min, votre apprenant a un parcours adapté à son métier"
- Timeline visuelle : Inscription → 1er module → Quiz → Certificat (avec durées)
- Avant/Après : "Formation classique" vs "GROWTHINNOV"
- Ce que reçoit l'apprenant : liste visuelle (brief IA, feedback, livret, certificat)

**Pratique Essentiel** :
- "Un terrain d'entraînement IA pour vos équipes"
- 7 modes en icônes visuelles avec une phrase chacun
- Scénario concret : "Thomas, chef de projet, s'entraîne à analyser un cas stratégique..."
- Résultat : score, radar, rapport

**Workshops Essentiel** :
- "Transformez vos réunions en ateliers productifs"
- Avant/Après : "Réunion classique" vs "Workshop GROWTHINNOV"
- 3 livrables concrets que produit un workshop

**Challenges Essentiel** :
- "Un diagnostic stratégique en 30 minutes, sans consultant"
- Workflow ultra-simplifié en 3 étapes visuelles
- Exemple concret : "Évaluez votre maturité IA en 4 étapes"

**Plateforme Essentiel** :
- "Tout est paramétrable, tout est mesurable"
- 3 blocs : Créer (IA génère), Déployer (portail immersif), Mesurer (observabilité)

**Discovery Essentiel** :
- Vue simplifiée du flow avec seulement les 4 grandes briques connectées (pas 25 nœuds)
- Version "executive summary" du flow

**Décideurs Essentiel** :
- Comparatif amplifié avec colonnes visuelles
- ROI calculator simplifié (nombre d'apprenants × coût actuel = économie)

**Partenaires Essentiel** :
- 3 modèles en cards visuelles avec pictos clairs
- "Lancez votre offre en 2 semaines"

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/insight/InsightContent.tsx` | Chaque section wrappée dans Tabs("essentiel" / "détaillé"), nouveau contenu "Essentiel" par section |

## Détail technique

Chaque `XxxSection()` devient :
```text
Tabs (defaultValue="essentiel")
├── TabsList ["Essentiel", "Détaillé"]
├── TabsContent "essentiel"
│   └── Nouveau contenu simplifié, visuel, storytelling
└── TabsContent "detaille"
    └── Contenu actuel inchangé
```

Nouveaux sous-composants internes :
- `BeforeAfter` — 2 colonnes avec icônes rouge/vert
- `BigStat` — Chiffre en très grand avec label
- `ScenarioCard` — Carte avec persona + narration
- `SimpleFlow` — 3-4 étapes horizontales ultra-clean
- `TestimonialCard` — Citation courte avec avatar et rôle

## Ordre d'exécution

1. Créer les sous-composants réutilisables (BeforeAfter, BigStat, ScenarioCard, SimpleFlow, TestimonialCard)
2. Wrapper chaque section existante dans Tabs
3. Rédiger le contenu "Essentiel" de chaque section (9 sections)
4. Le contenu "Détaillé" = le code actuel sans modification

