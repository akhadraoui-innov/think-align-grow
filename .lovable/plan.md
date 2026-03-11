

## Analyse de la regression et plan de restructuration Workshop / Challenge

### Diagnostic de la regression

La simplification du header a introduit **3 pertes critiques** :

1. **Le canvas collaboratif est mort.** Ligne 74-79 de `WorkshopRoom.tsx` force `workshopMode = "challenge"` dès qu'un template de challenge existe. Or un template existe toujours (il est lié au toolkit publié). Résultat : le mode canvas (post-its, flèches, groupes, icônes, texte, discussion) est **inaccessible**. Le code est encore là (lignes 402-457), mais il ne s'exécute jamais.

2. **La toolbar canvas a disparu.** `WorkshopToolbar` est importé mais jamais rendu. Les outils de création (post-it, flèche, groupe, texte, icône), le zoom, le snap-to-grid, le fit-to-content — tout est perdu. Le header minimal ne contient que : retour, nom, statut, participants, contrôles host.

3. **La `CardSidebar` est mal connectée.** Elle est toujours affichée, mais son `onAddCard` envoie les cartes sur le canvas (pas dans le challenge). En mode challenge forcé, elle ne sert à rien — le challenge a sa propre `StagingZone` intégrée.

### Problème de fond : couplage forcé de deux modules indépendants

Aujourd'hui, Workshop et Challenge sont **fusionnés dans le même écran** (`WorkshopRoom.tsx` = 486 lignes). Challenge n'existe qu'à l'intérieur d'un workshop. Il n'a pas :
- Son propre historique (pas de liste "Mes challenges")
- Sa propre entrée standalone (on doit créer un workshop pour lancer un challenge)
- Son propre header/toolbar adapté à son usage
- Sa propre route dédiée

### Architecture cible

```text
┌─────────────────────────────────────────────────────┐
│                    WORKSHOP                         │
│  Route: /workshop/:id                               │
│  Header: WorkshopToolbar (outils canvas complets)   │
│  Contenu: WorkshopCanvas + CardSidebar + Discussion │
│  Données: workshop_canvas_items, workshop_comments  │
│                                                     │
│  ┌─ Optionnel: Challenge intégré ─────────────────┐ │
│  │ Activé par l'hôte via un bouton dans la toolbar│ │
│  │ S'ouvre en overlay/panel ou remplace le canvas  │ │
│  │ Utilise le même workshop_id pour les réponses   │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    CHALLENGE                        │
│  Route: /challenge/:id (standalone)                 │
│  Header: minimal (nom challenge, sujets, analyser)  │
│  Contenu: ChallengeView (existant, inchangé)        │
│  Données: challenge_responses, challenge_analyses    │
│  Entrée: /challenge (liste + création)              │
└─────────────────────────────────────────────────────┘
```

### Plan d'implémentation — 5 étapes

---

**Étape 1 — Restaurer le Workshop canvas (correctif urgent)**

Fichier : `WorkshopRoom.tsx`

- Supprimer le `useEffect` qui force `workshopMode = "challenge"` (lignes 74-79)
- Remettre `workshopMode` par défaut à `"canvas"`
- Restaurer le rendu de `<WorkshopToolbar>` quand `workshopMode === "canvas"`, avec tous ses props (mode, zoom, snap, fit, icons, shapes, participants, contrôles host)
- Garder le header minimal uniquement pour le mode challenge
- Rétablir le bouton toggle "Canvas / Challenge" accessible depuis la toolbar, visible uniquement si des templates challenge existent
- La `CardSidebar` n'apparaît qu'en mode canvas (elle ajoute des cartes au canvas, pas au challenge)

Résultat : le workshop collaboratif avec canvas est de nouveau fonctionnel.

---

**Étape 2 — Créer la route standalone Challenge**

Fichiers nouveaux :
- `src/pages/Challenge.tsx` — page liste "Mes Challenges" (similaire à `Workshop.tsx`)
- `src/pages/ChallengeRoom.tsx` — page autonome qui affiche `ChallengeView` avec son propre header minimal

Fichier modifié : `src/App.tsx` — ajouter les routes `/challenge` et `/challenge/:id`

La page Challenge standalone :
- Utilise le même `workshop_id` en base (un challenge standalone crée un workshop de type "challenge-only" avec un champ config qui le distingue)
- Header minimal : nom du challenge, statut, participants, contrôles host
- Contenu : `<ChallengeView>` tel quel (aucune modification du composant)
- Liste "Mes challenges" : filtre les workshops dont `config.type === "challenge"`

Résultat : on peut lancer un challenge sans passer par le flux workshop.

---

**Étape 3 — Séparer la navigation et les entrées**

Fichier modifié : `src/components/layout/AppSidebar.tsx`

- Ajouter une entrée "Challenge" dans la navigation (icône LayoutGrid)
- L'entrée Workshop reste pour le canvas collaboratif
- L'entrée Challenge mène à `/challenge` (liste + création standalone)

Fichier modifié : `src/pages/Workshop.tsx`

- Retirer le bouton "Challenge" de la page Workshop (il a sa propre entrée maintenant)
- Garder uniquement "Créer" et "Rejoindre" pour les workshops canvas

---

**Étape 4 — Adapter le modèle de données pour distinguer les types**

Migration SQL :
- Ajouter un champ dans la config JSONB des workshops : `config->>'type'` avec valeurs `"canvas"` (défaut) ou `"challenge"`
- Pas de nouvelle table — on réutilise la même infrastructure workshops/participants pour les challenges standalone
- Les tables `challenge_responses`, `challenge_analyses`, `challenge_staging` restent identiques (elles référencent déjà `workshop_id`)

Cela prépare le terrain pour plus tard avoir des requêtes distinctes : "tous mes challenges", "tous mes workshops canvas", etc.

---

**Étape 5 — Intégration Challenge dans Workshop (optionnel, second temps)**

Fichier modifié : `WorkshopRoom.tsx`

- Dans la toolbar canvas, ajouter un bouton "Ouvrir un Challenge" (visible si des templates existent)
- Au clic, affiche un sélecteur de template puis bascule en mode challenge (comme aujourd'hui, mais par action explicite de l'hôte, pas automatique)
- Un bouton "Retour au canvas" permet de revenir

Résultat : l'hôte peut alterner entre canvas libre et challenge structuré pendant un même workshop.

---

### Priorités

| Priorité | Étape | Impact |
|----------|-------|--------|
| P0 — Bloquant | Étape 1 | Le canvas workshop ne fonctionne plus du tout |
| P1 — Important | Étapes 2+3 | Challenge standalone = valeur produit nouvelle |
| P2 — Structurant | Étape 4 | Distinguer les types dans les données |
| P3 — Enrichissement | Étape 5 | Intégration fluide workshop ↔ challenge |

### Fichiers impactés (récapitulatif)

| Fichier | Action |
|---|---|
| `src/pages/WorkshopRoom.tsx` | Restaurer canvas + toolbar, corriger le forçage challenge |
| `src/pages/Challenge.tsx` | Nouveau — liste "Mes challenges" |
| `src/pages/ChallengeRoom.tsx` | Nouveau — page standalone challenge |
| `src/App.tsx` | Ajouter routes `/challenge` et `/challenge/:id` |
| `src/components/layout/AppSidebar.tsx` | Ajouter entrée Challenge |
| `src/pages/Workshop.tsx` | Retirer bouton Challenge |
| Migration SQL | Ajouter `config->>'type'` convention |

