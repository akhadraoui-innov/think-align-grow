

# Refonte des onglets Parcours — Info, Inscriptions, Statistiques

## Etat actuel

**Onglet Informations** : Grille de Cards basiques (Nom, Difficulté, Description, Fonction, Persona, Durée, Certificat) + formulaire d'édition plat. Données manquantes : `tags`, `organization_id`, `generation_mode`, `created_at`, `updated_at`, `created_by`.

**Onglet Inscriptions** : Table brute avec `user_id` tronqué (pas de join profil), 4 colonnes sans enrichissement.

**Onglet Statistiques** : 3 KPI cards géants + table par module avec seulement 2 métriques.

## Plan

### 1. Onglet Informations — Sections structurées inline-edit

Remplacer la grille de cards + le formulaire séparé par un design en sections (pattern ToolkitInfoTab) avec édition inline directe (pas de mode lecture/écriture distinct) :

**Section A — Identité** : Nom, Difficulté (select), Statut (select), Durée estimée, Generation mode (read-only badge), Tags (input + pills comme ToolkitInfoTab)

**Section B — Ciblage** : Fonction cible (select avec lien cliquable), Persona cible (select), Organisation (select — actuellement non affiché)

**Section C — Description** : Textarea pleine largeur

**Section D — Options** : Certificat (switch inline), bouton Enregistrer sticky

**Section E — Métadonnées** : ID (mono), Créé le, Mis à jour, Créé par — read-only, style compact

**Section F — Historique** : VersionHistory dans un collapsible

- Requête path : ajouter le join `organizations` pour afficher le nom org
- Requête update : ajouter `tags` et `organization_id` dans la mutation
- Charger la liste des organisations pour le select

### 2. Onglet Inscriptions — Table enrichie

- Joindre `profiles` sur `user_id` pour afficher nom/email au lieu du UUID tronqué
- Ajouter une colonne "Progression" : nombre de modules complétés / total (cross-ref avec `progress`)
- Badge coloré pour le statut (enrolled = blue, in_progress = amber, completed = green)
- Compteur en header + état vide amélioré
- Si 0 inscriptions : illustration vide propre

### 3. Onglet Statistiques — KPIs lean + breakdown enrichi

- KPIs : remplacer les gros chiffres centrés par des cards compactes avec icône + label + valeur, sur une ligne (pattern admin)
- Ajouter KPI : "Modules publiés" (count published / total)
- Table par module : ajouter colonnes "En cours", "Temps moyen", barre de progression visuelle
- Ajouter un mini-funnel : Inscrits → En cours → Complétés (3 barres horizontales proportionnelles)

### Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminAcademyPathDetail.tsx` | Refonte des 3 onglets (Info sections, Inscriptions enrichies, Stats lean) |

