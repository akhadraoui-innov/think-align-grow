

# Refonte UI/UX Campagnes — Collapse enrichi + Filtres avancés

## Problèmes actuels (visibles sur les screenshots)

1. **Collapse basique** : le panneau étendu est un simple dump de texte + 3 compteurs KPI identiques, pas de structure
2. **Filtre unique** : un seul select "statut", pas de recherche, pas de filtre par parcours ou organisation
3. **Densité faible** : beaucoup d'espace perdu, les actions sont des icônes sans contexte
4. **Stratégie IA invisible** : le `deployment_strategy` généré n'est accessible nulle part dans la liste

## Plan

### 1. Filtres avancés — Barre de recherche + multi-filtres

Remplacer le select isolé par une barre complète :
- **Recherche texte** (nom, description, parcours)
- **Filtre statut** : pills cliquables (Tous / Brouillon / Actif / Suspendu / Terminé) avec compteur par statut
- **Filtre organisation** : select
- **Filtre parcours** : select
- Compteur de résultats dynamique

### 2. Collapse enrichi — Vue structurée en sections

Transformer le panneau étendu en sections visuellement distinctes :

**Section A — Description + Stratégie**
- Description en texte, stratégie de déploiement dans un bloc stylisé avec icône et bordure colorée (si disponible)

**Section B — KPIs en ligne**
- 3 KPIs (Inscrits, Complétés, Taux) avec icônes et mini-progress circulaire, pas juste des gros chiffres dans des boîtes

**Section C — Apprenants** (si inscrits > 0)
- Table compacte avec avatar, nom, statut (badge coloré)
- Limité à 5 lignes avec "Voir tout" si plus

**Section D — Historique des versions** (collapsible à l'intérieur)
- Le VersionHistory existant, mais dans un sous-collapsible pour ne pas encombrer

### 3. Amélioration du row principal

- Ajouter un indicateur visuel de progression (mini barre) directement dans le row même quand collapsed
- Afficher la durée restante ou "terminé depuis X jours" selon le statut
- Icône de stratégie IA (Sparkles) visible si `deployment_strategy` existe

### Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminAcademyCampaigns.tsx` | Refonte filtres + collapse enrichi + row amélioré |

