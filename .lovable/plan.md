

# Plan — Upgrade UI Premium des 3 pages Admin UCM

## Diagnostic

Les 3 pages (`AdminUCM`, `AdminUCMSectors`, `AdminUCMPrompts`) utilisent un rendu basique : cards plates, pas de gradient, pas de Recharts, pas de `GradientIcon`, pas de `StatsCard` pattern existant. Le `AdminDashboard` principal montre le standard premium attendu : KPI cards avec icônes colorées, graphiques Recharts, sections titrées avec icône + label, border-border/50, uppercase tracking labels.

## Changements par page

### 1. AdminUCM.tsx — Command Center

**Header** : Titre `font-display` + sous-titre muted, aligné sur AdminDashboard.

**KPIs** : 4 cards (au lieu de 3) utilisant le pattern `StatsCard` existant avec icônes colorées distinctes :
- Projets UCM (Briefcase, primary)
- Use Cases générés (Lightbulb, accent)  
- Analyses ce mois (BarChart3, violet)
- Tokens consommés (Zap, emerald)

**Graphiques Recharts** : Ajouter une rangée de 2 charts :
- BarChart : UC générés par organisation (top 5)
- LineChart : Évolution mensuelle tokens/analyses (6 derniers mois, données issues de `ucm_quota_usage`)

**Table projets** : Remplacer la liste plate par une vraie `Table` (thead/tbody) avec colonnes : Entreprise, Organisation, Secteur, UC count, Status, Date — style `rounded-xl border-border/50 bg-card`.

**Statut badges** : Couleurs sémantiques (draft=secondary, active=primary, completed=emerald).

### 2. AdminUCMSectors.tsx — Catalogue Premium

**Header** : Titre `font-display` + badge compteur total + sous-titre.

**KPIs** : 3 mini stats en haut :
- Total secteurs (Globe, primary)
- Secteurs actifs (CheckCircle, emerald)
- Groupes (FolderTree, violet)

**Groupes** : Chaque groupe devient une card `rounded-xl border-border/50` avec header contenant icône du premier secteur du groupe + compteur items. Les items dans le groupe utilisent un layout grid 2 colonnes au lieu d'une liste verticale.

**Sector items** : Chaque item affiche icône + label + badge actif/inactif + compteur fonctions (extrait du JSON `functions`) + bouton edit, dans un mini-card hover:bg-muted/50.

**Dialog** : Ajouter des `Label` shadcn au lieu de `<label>`, séparer les champs avec `Separator`, et ajouter un header avec l'emoji du secteur en grand.

### 3. AdminUCMPrompts.tsx — Prompt Studio

**Header** : Titre `font-display` + sous-titre + badge compteur total (analyse + global).

**Tabs** : Style premium — `TabsList` plus large avec icônes dans les triggers (Search pour analyse, Globe pour synthèse).

**Section cards** : Chaque `SectionEditor` reçoit un traitement visuel :
- Bande de couleur gauche (border-l-4 avec couleur thématique par code)
- Icône en grand (text-2xl) dans un cercle coloré
- Badge code en `font-mono` avec background subtil
- Compteur de caractères dans les textareas (brief/detailed)
- Indicateur visuel "non modifié" vs "modifié" pendant l'édition

**Description tabs** : Remplacer le texte plat par une card info `bg-muted/30` avec icône Info.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminUCM.tsx` | Réécrire — StatsCard pattern, Recharts, Table |
| `src/pages/admin/AdminUCMSectors.tsx` | Réécrire — KPIs, grid layout, dialog premium |
| `src/pages/admin/AdminUCMPrompts.tsx` | Réécrire — border-l-4, tabs avec icônes, compteurs |

## Ordre d'exécution
1. AdminUCM (dashboard = vitrine)
2. AdminUCMSectors (catalogue)
3. AdminUCMPrompts (studio prompts)

