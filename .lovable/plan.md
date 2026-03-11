

## Enrichir les onglets Sessions et Analyses avec données par organisation

### Problème actuel
- **Sessions** : affiche uniquement nom, statut, date du workshop — pas d'info organisation, participants, complétude, analyse.
- **Analyses** : affiche workshop + maturité — pas d'info organisation.

### Données disponibles
- `workshops` a `organization_id` → jointure vers `organizations(name, logo_url)`
- `workshop_participants` → count par workshop pour nombre d'utilisateurs
- `challenge_responses` → count par workshop pour complétude (réponses vs slots)
- `challenge_analyses` → existence = analyse lancée, `analysis.global_maturity` = maturité

### Plan

**1. Hook `useAdminChallengeDetail` — enrichir les queries sessions et analyses**

- **Sessions** : au lieu de fetch workshops bruts, fetch avec jointures :
  ```
  workshops(*, organizations(id, name, logo_url))
  ```
  Puis fetch en parallèle : `workshop_participants` (count par workshop_id), `challenge_responses` (count par workshop_id), et croiser avec `challenge_analyses` pour savoir si analyse existe + maturité.

- **Analyses** : enrichir la query existante avec `workshops(*, organizations(id, name, logo_url))`.

**2. `ChallengeSessionsTab.tsx` — colonnes enrichies**

| Colonne | Source |
|---------|--------|
| Nom + code | workshop.name, code |
| Organisation | organizations.name via workshop |
| Participants | count workshop_participants |
| Complétude | responses count vs total slots (%) |
| Analyse | oui/non badge |
| Maturité | score si analyse existe |
| Statut | workshop.status |
| Date | created_at |

Recevoir en props les données enrichies (participants counts, responses counts, analyses map).

**3. `ChallengeAnalysesTab.tsx` — ajout organisation**

Ajouter colonne Organisation (nom) depuis `workshops.organizations`. Garder maturité + summary existants.

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useAdminChallenges.ts` | Enrichir sessions query avec org + fetch participants/responses counts + analyses map |
| `src/components/admin/ChallengeSessionsTab.tsx` | Refonte colonnes avec org, participants, complétude, analyse, maturité |
| `src/components/admin/ChallengeAnalysesTab.tsx` | Ajouter colonne organisation |
| `src/pages/admin/AdminChallengeDetail.tsx` | Passer les nouvelles données (participantCounts, responseCounts, analysesMap, totalSlots) aux tabs |

