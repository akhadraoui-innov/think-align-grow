

## Implémenter la page Admin "Design Innovation"

La page `/admin/design-innovation` est actuellement un placeholder. Elle doit devenir une interface complète de gestion des challenge templates, calquée sur le modèle de `/admin/toolkits` (liste + fiche détail).

### Architecture

```text
/admin/design-innovation          → Liste de tous les challenge_templates (DataTable)
/admin/design-innovation/:id      → Fiche détail d'un template (Tabs)
```

### Page liste — `AdminDesignInnovation.tsx`

Refonte complète. Hook `useAdminChallenges` pour charger :
- `challenge_templates` avec jointure `toolkits(name, icon_emoji)` et `challenge_subjects(id)`
- Compteurs : sujets par template, slots par template, sessions (workshops ayant des `challenge_responses` liées)

Colonnes DataTable :
| Colonne | Source |
|---------|--------|
| Nom + description | `name`, `description` |
| Toolkit | `toolkits.icon_emoji + toolkits.name` |
| Difficulté | `difficulty` badge |
| Sujets | count `challenge_subjects` |
| Sessions | count workshops liés via `challenge_analyses` |
| Créé le | `created_at` |

Bouton "Nouveau template" via Dialog (nom, toolkit select, difficulté, description).

Clic sur une ligne → `/admin/design-innovation/:id`.

### Page détail — `AdminChallengeDetail.tsx`

Nouveau fichier. Structure en onglets comme `AdminToolkitDetail` :

| Onglet | Contenu |
|--------|---------|
| **Infos** | Édition nom, description, difficulté, toolkit, pilier |
| **Sujets & Slots** | Arbre hiérarchique : sujets → slots avec CRUD inline (ajouter/modifier/supprimer sujet, ajouter/modifier/supprimer slot) |
| **Sessions** | Liste des workshops qui ont utilisé ce template, avec statut, date, nombre de réponses, lien vers analyse |
| **Analyses** | Historique des `challenge_analyses` liées, avec maturité globale et résumé |

### Hook — `useAdminChallenges.ts`

Nouveau fichier :
- `useAdminChallenges()` : liste tous les templates + compteurs
- `useAdminChallengeDetail(id)` : template, sujets+slots, analyses, sessions (workshops via challenge_analyses)
- Mutations : create/update/delete template, create/update/delete subject, create/update/delete slot

### Composants onglets

| Fichier | Rôle |
|---------|------|
| `ChallengeInfoTab.tsx` | Formulaire édition template |
| `ChallengeSubjectsTab.tsx` | Gestion sujets + slots en arbre (réutilise le pattern de `ToolkitPillarsTab`) |
| `ChallengeSessionsTab.tsx` | DataTable des workshops liés |
| `ChallengeAnalysesTab.tsx` | Historique analyses avec preview maturité |

### Routing

Ajouter dans `App.tsx` :
```
/admin/design-innovation/:id → AdminChallengeDetail
```

Mettre à jour `AdminShell.tsx` breadcrumb map pour inclure le pattern dynamique.

### Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `src/hooks/useAdminChallenges.ts` | Créer — hook complet (list, detail, mutations) |
| `src/pages/admin/AdminDesignInnovation.tsx` | Refonte — liste DataTable |
| `src/pages/admin/AdminChallengeDetail.tsx` | Créer — fiche détail avec 4 onglets |
| `src/components/admin/ChallengeInfoTab.tsx` | Créer |
| `src/components/admin/ChallengeSubjectsTab.tsx` | Créer |
| `src/components/admin/ChallengeSessionsTab.tsx` | Créer |
| `src/components/admin/ChallengeAnalysesTab.tsx` | Créer |
| `src/App.tsx` | Ajouter route detail |
| `src/components/admin/AdminShell.tsx` | Ajouter breadcrumb |

