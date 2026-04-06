

# Plan — Audit UI + Harmonisation AI Value Builder

## Diagnostic par écran

### 1. Dashboard (`PortalUCM.tsx`) — Score: 7/10
- KPIs avec `AnimatedCounter` : bien
- Hero gradient : bien
- Cards projet : manquent d'un hover plus prononcé, pas de gradient sur la progress bar
- **Problème** : aucun empty state attractif pour le premier usage (juste "Aucun projet" basique)
- **Problème** : les cards sont petites et plates, pas de shadow-elevated ni glass

### 2. Contexte (`UCMContextStep.tsx`) — Score: 6/10
- Formulaire fonctionnel avec compteur caractères
- **Problème** : pas de header de page avec icône gradient (les autres pages du portail en ont)
- **Problème** : la card est trop simple — pas de titre de section visible avec icône
- **Problème** : le `max-w-3xl` sans padding à gauche crée un décalage par rapport au header de page
- **Problème** : pas de bordure violette sur l'immersion textarea comme demandé dans le CDC

### 3. Périmètre (`UCMScopeStep.tsx`) — Score: 5/10
- **Problème majeur** : pas de `p-6` wrapper — le contenu colle au bord gauche
- **Problème** : les boutons secteur sont des `Button` outline/default basiques, pas de chips visuels avec icônes distinctes
- **Problème** : quand un secteur est sélectionné, les fonctions métier ne montrent pas de header avec compteur (ex: "12 sélectionnées / 28")
- **Problème** : pas de bouton "Tout sélectionner" / "Tout désélectionner" par catégorie

### 4. Use Cases (`UCMUseCasesList.tsx`) — Score: 7/10
- Bonne structure avec checkbox, badges, description
- **Problème** : le dot de priorité (`bg-red-500 h-2 w-2`) est trop petit et pas aligné visuellement avec les badges
- **Problème** : pas de header avec icône gradient comme les autres écrans premium
- **Problème** : le bouton "Générer 10 UC" est isolé en haut à droite sans contexte visuel

### 5. Analyse UC (`UCMAnalysisPage.tsx`) — Score: 8/10
- Bon design : tabs colorés, header avec badge priorité, navigation prev/next
- **Problème** : l'action bar (Fiche décision / Analyse complète) est visuellement plate (`bg-muted/20`)
- **Problème mineur** : le badge "mode · version" n'utilise pas les couleurs de section

### 6. Synthèse (`UCMSynthesisPage.tsx`) — Score: 6/10
- **Problème** : les 7 cards sont toutes identiques — pas de différenciation visuelle par section
- **Problème** : pas de header avec icône gradient
- **Problème** : quand une section n'est pas générée, la card est vide et plate
- **Problème** : le bouton de génération est un petit `Sparkles` sans label, pas intuitif

### 7. Chat (`UCMChat.tsx`) — Score: 7/10
- Bon layout avec header, empty state, typing indicator
- **Problème** : le header "Consultant IA" est défini dans `PortalUCMProject.tsx` et non dans le composant — duplication de logique
- **Problème** : les suggestion chips manquent (ex: "Résume les synergies", "Compare les UC")

### 8. UC Explorer (`PortalUCMExplorer.tsx`) — Score: 6/10
- **Problème** : pas de header gradient hero comme le dashboard
- **Problème** : les cards UC sont basiques sans hover lift
- **Problème** : manque un filtre par secteur (identifié dans étape 7 du plan précédent)
- **Problème** : pas de lien de navigation vers le projet parent d'un UC

### 9. Sidebar projet (`UCMProjectSidebar.tsx`) — Score: 7/10
- Arbre contextuel fonctionnel avec indicateurs ●/○/★
- **Problème** : la section "ANALYSE PAR UC" n'apparaît pas car aucun UC n'est sélectionné par défaut
- **Problème** : pas de séparateur visuel entre sections (juste `pt-4`)
- **Problème** : le lien "← Projets" est trop discret

### 10. Problèmes globaux d'harmonisation
- **Incohérence de padding** : Contexte et Scope utilisent `max-w-3xl` sans wrapper, Use Cases a `p-6`, Synthèse a `p-6 max-w-3xl`
- **Incohérence de headers** : Certains écrans ont un h2 nu, d'autres un gradient, d'autres rien
- **Double sidebar** : La sidebar portal (Projets/UC Explorer) reste affichée à côté de la sidebar projet — crée une surcharge visuelle avec 3 colonnes (portal sidebar + project sidebar + contenu)
- **Pas de breadcrumb** : Quand on est dans un projet, on perd le contexte de navigation

---

## Plan de corrections

### Correction 1 — Layout cohérent : cacher la sidebar portal dans les projets

Quand l'utilisateur est dans un projet UCM (`/portal/ucm/:id/*`), la sidebar portal (Projets/UC Explorer) est redondante avec la sidebar projet. Le pattern "immersive" existe déjà pour les workshops.

**Action** : Dans `PortalShell.tsx`, ajouter les routes `/portal/ucm/:id` au pattern `isImmersive` pour masquer la sidebar portal. La sidebar projet interne (`UCMProjectSidebar`) suffira.

### Correction 2 — Harmoniser les headers de page

Créer un composant réutilisable `UCMPageHeader` utilisé dans tous les écrans : icône dans cercle gradient + titre H2 font-display + sous-titre muted + badge compteur optionnel.

Appliquer à : Contexte, Périmètre, Use Cases, Synthèse, Explorer.

### Correction 3 — Fixer le padding/layout de chaque page

- `UCMContextStep.tsx` : ajouter wrapper `p-6 overflow-auto flex-1` (comme Use Cases)
- `UCMScopeStep.tsx` : le contenu scrolle déjà mais manque un padding cohérent
- Tous les écrans : `max-w-4xl mx-auto` au lieu de `max-w-3xl` pour plus d'espace

### Correction 4 — Enrichir la Synthèse Globale

Chaque card de section synthèse doit avoir :
- Icône colorée dans un cercle gradient (pas juste l'emoji)
- Titre avec font-display
- Description courte quand non généré ("Générez l'executive summary pour une vue d'ensemble")
- Bouton avec label "Générer" au lieu d'un icône seul

### Correction 5 — Enrichir l'Explorer

- Ajouter un header gradient hero comme le dashboard
- Ajouter filtre par secteur
- Rendre chaque card cliquable vers le projet parent (`/portal/ucm/:projectId/uc/:ucId`)

### Correction 6 — Chat : suggestion chips + layout intégré

Ajouter des suggestion chips dans l'empty state du chat : "Résume les forces du portfolio UC", "Compare les risques entre UC", "Propose un plan d'action à 90 jours".

### Correction 7 — Sidebar projet : séparateurs et lien retour

- Ajouter un `Separator` entre sections (Projet / Analyse / Synthèse)
- Rendre le lien "← Projets" plus visible (bg-muted/30, bold)

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/portal/PortalShell.tsx` | Modifier — ajouter pattern immersif pour `/portal/ucm/:id` |
| `src/components/ucm/UCMPageHeader.tsx` | Creer — composant header réutilisable |
| `src/components/ucm/UCMContextStep.tsx` | Modifier — header + padding + bordure violette immersion |
| `src/components/ucm/UCMScopeStep.tsx` | Modifier — header + compteur fonctions + bouton "Tout sélectionner" |
| `src/components/ucm/UCMUseCasesList.tsx` | Modifier — header harmonisé |
| `src/components/ucm/UCMSynthesisPage.tsx` | Modifier — cards enrichies avec descriptions et boutons labels |
| `src/components/ucm/UCMChat.tsx` | Modifier — suggestion chips + retirer header dupliqué du parent |
| `src/components/ucm/UCMProjectSidebar.tsx` | Modifier — séparateurs + lien retour visible |
| `src/pages/portal/PortalUCMProject.tsx` | Modifier — retirer header chat dupliqué |
| `src/pages/portal/PortalUCMExplorer.tsx` | Modifier — header gradient + filtre secteur + liens cliquables |

## Ordre d'exécution
1. PortalShell (layout immersif)
2. UCMPageHeader (composant partagé)
3. Toutes les pages (header + padding)
4. Synthèse + Explorer (enrichissements)
5. Chat (chips) + Sidebar (séparateurs)

