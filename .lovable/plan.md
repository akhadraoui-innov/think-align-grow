

# Onglet Informations — Mode Lecture / Édition séparés

## Constat actuel
L'onglet Info affiche directement les champs en mode édition (inputs, selects, textareas). Pas de mode lecture. L'utilisateur arrive sur un formulaire brut, pas une fiche structurée.

## Plan

### 1. State `isEditing` (default: false)
Ajouter un `const [isEditing, setIsEditing] = useState(false)` dans le composant. Un bouton "Modifier" (icone Pencil) dans le header de l'onglet bascule en mode édition. Un bouton "Annuler" revient en lecture (et reset le form).

### 2. Mode Lecture — Fiche premium structurée
Quand `!isEditing`, afficher les données dans un layout propre, sans aucun input :

**Section A — Identité** : Grille de paires label/valeur (Nom en gras, Difficulté en badge coloré, Statut en badge, Durée en texte, Mode de génération en badge outline). Tags en pills read-only.

**Section B — Ciblage** : 3 colonnes — Fonction (lien cliquable vers la page fonction), Persona (texte), Organisation (texte). Si vide : "Non défini" en muted.

**Section C — Description** : Texte rendu en paragraphe stylé (pas de textarea), fond légèrement teinté, typography premium (leading-relaxed).

**Section D — Options** : Certificat affiché comme un indicateur visuel (check vert ou croix grise), pas de switch.

**Section E — Métadonnées** : Identique à l'actuel (déjà read-only).

**Section F — Historique** : Identique (déjà read-only).

Design lecture : valeurs en `text-sm font-medium`, labels en `text-[11px] text-muted-foreground uppercase tracking-wider`, espacement généreux, sections avec le même pattern card/header que l'actuel mais sans inputs.

### 3. Mode Édition — Formulaire actuel
Quand `isEditing`, afficher le formulaire inline-edit existant (sections A-D avec inputs/selects/switch). Le bouton Enregistrer sauvegarde puis repasse en lecture. Le bouton Annuler reset `infoForm` depuis `path` et repasse en lecture.

### 4. Bouton dans le header de l'onglet
Ajouter un header entre le TabsList et le contenu de l'onglet info :
```
[Informations du parcours]                    [Modifier ✏️]
```
En mode édition :
```
[Modification en cours]           [Annuler] [Enregistrer 💾]
```

### 5. Onglets Inscriptions & Stats
Pas de changement de fond — ces onglets sont déjà en lecture seule. Pas besoin de mode edit.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminAcademyPathDetail.tsx` | Ajouter state `isEditing`, créer le rendu lecture premium pour l'onglet Info, conditionner l'affichage lecture/édition |

