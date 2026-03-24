

# Refonte UX Premium — Academy Admin Dashboard

## Diagnostic

Les pages Academy admin sont fonctionnelles mais basiques : cards plates, pas de detail pages dediees, edit inline via dialogs, pas de vues alternatives, pas de panels riches, pas de stats visuelles. Le dashboard est une grille de compteurs sans graphiques. La cartographie utilise des lignes SVG brutes sans polish. Les fonctions n'ont pas de page detail dediee — juste un dialog edit.

## Principe directeur

- **Detail pages dediees** plutot que dialogs d'edition (clic sur une fonction → page `/admin/academy/functions/:id` avec tabs, panels, collapsibles)
- **Dashboard = command center** avec vrais graphiques (recharts), KPIs animés, heatmap de couverture
- **Cartographie** : nodes stylisés avec gradient, courbes bezier au lieu de lignes droites, mini-radar sur les personae, filtrage interactif
- **Chaque liste** : toggle grille/tableau, barre de recherche + filtres, tri

## Plan d'implémentation

### 1. Dashboard Academy (`AdminAcademy.tsx`) — Refonte complète

- Header hero avec gradient subtle + titre + sous-titre + CTA "Nouveau parcours"
- **KPI row** (6 cards) : compteurs animés (AnimatedCounter existant), micro-sparklines
- **Section graphiques** (2 colonnes) :
  - Gauche : bar chart horizontal "Parcours par difficulté" + "Modules par type" (recharts)
  - Droite : heatmap mini "Couverture Fonctions × Personae" (grille colorée)
- **Section activité** : timeline verticale stylisée (dot + ligne) au lieu de liste plate
- **Quick actions** : cards compactes avec hover lift, suppression du style "navigation rapide" basique

### 2. Cartographie (`AdminAcademyMap.tsx`) — Polish premium

- **Flow view** : remplacer `<line>` par `<path>` bezier curves, nodes avec gradient bg + shadow, icone dans chaque node, counter de liens
- **Nodes enrichis** : fonctions montrent département en badge coloré, personae montrent mini radar (5 traits en SVG inline petit), parcours montrent difficulté + nb modules, campagnes montrent dates
- **Matrice** : cellules avec couleur d'intensité (plus il y a de parcours, plus la couleur est intense), hover tooltip
- **Header** : stats inline (total nodes, total links, couverture %)
- **Filtrage** : barre de filtre par statut, par département, searchbar

### 3. Pages detail dediees — Fonctions, Personae

**Nouvelle route** : `/admin/academy/functions/:id` → `AdminAcademyFunctionDetail.tsx`
- Header avec icone gradient + nom + badges (département, séniorité, statut)
- **Tabs** : Informations | Responsabilités & KPIs | IA & Outils | Parcours liés
- Tab Infos : formulaire inline editable (pas dialog)
- Tab Responsabilités : listes éditables avec chips
- Tab IA : cas d'usage avec cards
- Tab Parcours : liste des parcours liés avec liens

**Refonte liste Fonctions** (`AdminAcademyFunctions.tsx`) :
- Toggle vue grille/tableau
- Searchbar + filtres département/séniorité/statut
- Clic sur card → navigate vers detail page (plus de dialog edit)
- Cards enrichies : gradient subtle par département

**Refonte liste Personae** (`AdminAcademyPersonae.tsx`) :
- Toggle vue grille/tableau
- Clic sur card → Sheet panel lateral (600px) avec radar, tags, textes descriptifs en sections collapsibles
- Suppression du dialog edit inline, remplacement par panel editable

### 4. Parcours & Campagnes — Enrichissement

**Parcours** (`AdminAcademyPaths.tsx`) :
- Toggle grille/tableau
- Cards avec progress bar (nb modules / total), badges fonction + persona targets
- Searchbar + filtres difficulté/statut

**Campagnes** (`AdminAcademyCampaigns.tsx`) :
- Vue timeline : barre horizontale par campagne (starts_at → ends_at) avec couleur par statut
- Vue liste enrichie : cards avec countdown / jours restants

### 5. Tracking (`AdminAcademyTracking.tsx`) — DataTable premium

- DataTable avec headers sticky backdrop-blur (pattern existant du projet)
- Lignes zébrées, avatar placeholder pour users
- Sparkline de progression par user
- Filtres multiples (parcours, statut, organisation)
- Stats agrégées en haut (taux complétion, score moyen, temps moyen)

### Fichiers impactés

**Nouveaux :**
- `src/pages/admin/AdminAcademyFunctionDetail.tsx`

**Refonte majeure :**
- `src/pages/admin/AdminAcademy.tsx` (dashboard command center)
- `src/pages/admin/AdminAcademyMap.tsx` (bezier curves, nodes enrichis, filtres)
- `src/pages/admin/AdminAcademyFunctions.tsx` (grille/table toggle, search, navigate to detail)
- `src/pages/admin/AdminAcademyPersonae.tsx` (Sheet panel, grille/table)
- `src/pages/admin/AdminAcademyPaths.tsx` (grille/table, search, filtres)
- `src/pages/admin/AdminAcademyCampaigns.tsx` (timeline view)
- `src/pages/admin/AdminAcademyTracking.tsx` (DataTable premium)
- `src/App.tsx` (route function detail)

### Ordre

1. Dashboard (impact visuel immédiat)
2. Cartographie (pièce maitresse)
3. Fonctions (liste + detail page)
4. Personae (Sheet panel)
5. Parcours + Campagnes
6. Tracking

