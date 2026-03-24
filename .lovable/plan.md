

# Academy Admin — Refonte UX Premium + Sous-menus Sidebar + Module Cartographie

## Diagnostic actuel

| Element | Etat |
|---------|------|
| **Sidebar admin** | Academy = 1 seul lien plat, pas de sous-menus. Navigation lente (retour obligatoire au dashboard Academy pour aller d'une section a l'autre) |
| **Dashboard Academy** | 5 stats + 4 cards de navigation = page morte, pas de valeur ajoutée. Pas de graphiques, pas de vue d'ensemble, pas de suivi |
| **Pages CRUD** | Toutes identiques : liste de cards + dialog de création basique. Pas de panels, pas de collapsibles, pas de vues alternatives (grille/table/kanban) |
| **Pas de module de cartographie** | Aucune vue relationnelle entre fonctions, personae, parcours, campagnes, utilisateurs. Impossible de visualiser l'organisation de la formation |
| **Pas de navigation rapide** | Pour passer de Fonctions a Personae, il faut retourner au dashboard Academy, puis cliquer. 3 clics pour changer de section |

## Plan d'implémentation

### 1. Sous-menus Academy dans AdminSidebar

Transformer le lien "Academy" en groupe dépliable (Collapsible) avec sous-items :

```text
Academy ▾
  ├─ Vue d'ensemble    → /admin/academy
  ├─ Cartographie      → /admin/academy/map
  ├─ Fonctions         → /admin/academy/functions
  ├─ Personae          → /admin/academy/personae
  ├─ Parcours          → /admin/academy/paths
  ├─ Campagnes         → /admin/academy/campaigns
  └─ Suivi             → /admin/academy/tracking
```

Le groupe s'ouvre automatiquement quand on est sur une route `/admin/academy/*`. Chaque sous-item a son icone. En mode collapsed, le sous-menu apparait en tooltip/popover.

**Fichier** : `src/components/admin/AdminSidebar.tsx` — ajouter `Collapsible` + sous-items Academy.

### 2. Dashboard Academy enrichi (Vue d'ensemble)

Refondre `AdminAcademy.tsx` en vrai dashboard métier :

- **Header** avec stats en gradient cards (parcours, modules, inscrits, taux complétion, campagnes actives)
- **Section "Activité récente"** : dernières inscriptions, derniers modules complétés (requete `academy_progress` + `academy_enrollments`)
- **Section "Répartition"** : graphiques simples (barres de progression par parcours, répartition par difficulté)
- **Quick actions** : cards de navigation conservées mais plus petites, en bas
- **Panel latéral collapsible** "Actions rapides" : créer parcours, lancer campagne, générer persona

### 3. Nouvelle page Cartographie (`/admin/academy/map`)

Page de visualisation relationnelle inspirée n8n/Miro, affichant les connexions entre entités :

**Vue par défaut : Organigramme de formation**
- Layout en colonnes : Fonctions → Personae → Parcours → Campagnes
- Chaque entité = un noeud (card compacte avec icone, nom, badge statut)
- Les liens (function_id, persona_id sur les paths, path_id sur les campagnes) = lignes SVG entre noeuds
- Cliquer un noeud ouvre un panel latéral avec les détails
- Filtrer par organisation, par statut

**Vues alternatives (tabs en haut)** :
- **Matrice** : tableau croisé Fonctions × Personae, cellules = nombre de parcours ciblés
- **Kanban** : colonnes par statut (draft/published/archived) avec les parcours en cards draggables
- **Liste** : DataTable classique avec toutes les entités filtrables

**Données affichées dans chaque noeud** :
- Fonction : nom, département, nb parcours liés
- Persona : nom, radar mini (5 axes), nb parcours liés
- Parcours : nom, difficulté badge, nb modules, nb inscrits
- Campagne : nom, dates, statut, nb inscrits

**Fichier nouveau** : `src/pages/admin/AdminAcademyMap.tsx`

### 4. Nouvelle page Suivi (`/admin/academy/tracking`)

Dashboard de suivi des apprenants :

- **Tableau** : liste des enrollments avec utilisateur, parcours, progression %, dernière activité
- **Filtres** : par parcours, par campagne, par organisation, par statut
- **Vue agrégée** : taux de complétion par parcours, temps moyen, scores moyens
- **Export** (futur)

**Fichier nouveau** : `src/pages/admin/AdminAcademyTracking.tsx`

### 5. Enrichir les pages existantes avec panels et vues

**Fonctions** (`AdminAcademyFunctions.tsx`) :
- Ajouter toggle vue grille/liste
- Vue grille : cards avec département coloré, badges seniority, mini-liste ai_use_cases
- Panel latéral (Sheet) au clic sur une fonction pour voir le détail complet sans quitter la liste

**Personae** (`AdminAcademyPersonae.tsx`) :
- Ajouter toggle vue grille/liste
- Vue grille actuelle enrichie avec radar
- Panel latéral au clic : tous les traits, tags, textes descriptifs dans des sections Collapsible

**Parcours** (`AdminAcademyPaths.tsx`) :
- Ajouter toggle vue grille/liste/kanban
- Vue kanban par statut (draft/published/archived)
- Panel latéral au clic : modules, stats d'inscription, persona/fonction cible

**Campagnes** (`AdminAcademyCampaigns.tsx`) :
- Timeline view : frise chronologique des campagnes avec barres de durée
- Panel latéral au clic : parcours lié, organisation, progression agrégée

### Fichiers impactés

**Modifiés :**
- `src/components/admin/AdminSidebar.tsx` — sous-menus Collapsible Academy
- `src/pages/admin/AdminAcademy.tsx` — refonte dashboard enrichi
- `src/pages/admin/AdminAcademyFunctions.tsx` — toggle vues + Sheet panel
- `src/pages/admin/AdminAcademyPersonae.tsx` — toggle vues + Sheet panel
- `src/pages/admin/AdminAcademyPaths.tsx` — toggle vues grille/liste/kanban + Sheet panel
- `src/pages/admin/AdminAcademyCampaigns.tsx` — timeline view + Sheet panel
- `src/App.tsx` — 2 nouvelles routes (map, tracking)

**Nouveaux :**
- `src/pages/admin/AdminAcademyMap.tsx` — cartographie relationnelle
- `src/pages/admin/AdminAcademyTracking.tsx` — suivi apprenants

### Ordre d'implémentation

1. **Sidebar sous-menus** — débloque la navigation rapide (indispensable)
2. **Routes** dans App.tsx
3. **Dashboard enrichi** — donne de la valeur a la page d'accueil Academy
4. **Page Cartographie** — la pièce maitresse, vue relationnelle
5. **Page Suivi** — tracking apprenants
6. **Enrichissement pages existantes** — panels, vues alternatives, collapsibles

