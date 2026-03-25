

# Plan : Module "Actifs Pedagogiques" (Pedagogy Assets Library)

## Concept

Creer une bibliotheque centralisee de tous les actifs pedagogiques (Quiz, Exercices, Pratiques) generes dans les parcours. Chaque actif est soit **public** (reutilisable par tous), soit **lie a une organisation**. L'admin peut les consulter, dupliquer vers un autre module, et modifier (si public ou si meme org).

## Probleme actuel

Les tables `academy_exercises`, `academy_practices`, `academy_quizzes` n'ont **pas de champ `organization_id`** ni de champ `visibility`. L'organisation est deduite indirectement via `module → path → organization_id`. Il faut ajouter une colonne `organization_id` nullable sur ces 3 tables pour supporter le filtrage direct.

## Architecture

```text
/admin/academy/assets          ← Page principale (3 sous-onglets)
├── Tab Quiz        (9 quiz, 53 questions)
├── Tab Exercices   (10 exercices)
└── Tab Pratiques   (11 pratiques)
```

Chaque ligne affiche : titre, module source, parcours source, organisation (ou "Public"), actions (voir, dupliquer, modifier).

## Modifications

### 1. Migration DB : ajouter `organization_id` aux 3 tables

```sql
ALTER TABLE academy_exercises ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE academy_practices ADD COLUMN organization_id uuid REFERENCES organizations(id);
ALTER TABLE academy_quizzes ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Backfill depuis les parcours existants
UPDATE academy_exercises e SET organization_id = p.organization_id
FROM academy_modules m JOIN academy_path_modules pm ON pm.module_id = m.id
JOIN academy_paths p ON p.id = pm.path_id WHERE m.id = e.module_id;

UPDATE academy_practices pr SET organization_id = p.organization_id
FROM academy_modules m JOIN academy_path_modules pm ON pm.module_id = m.id
JOIN academy_paths p ON p.id = pm.path_id WHERE m.id = pr.module_id;

UPDATE academy_quizzes q SET organization_id = p.organization_id
FROM academy_modules m JOIN academy_path_modules pm ON pm.module_id = m.id
JOIN academy_paths p ON p.id = pm.path_id WHERE m.id = q.module_id;
```

### 2. Sidebar : ajouter l'entree "Actifs pedagogiques"

Dans `AdminSidebar.tsx`, ajouter dans `academySubItems` :
```
{ path: "/admin/academy/assets", icon: Library, label: "Actifs pedagogiques" }
```

### 3. Page `AdminAcademyAssets.tsx`

- 3 onglets : Quiz | Exercices | Pratiques
- Chaque onglet : tableau avec colonnes (Titre, Module, Parcours, Org/Public, Type, Actions)
- Filtre par organisation (dropdown) + recherche texte
- Actions par ligne :
  - **Voir** : dialog avec le contenu complet (questions pour quiz, instructions pour exercice, scenario pour pratique)
  - **Dupliquer** : dialog pour choisir le module cible → insere une copie avec nouveau module_id
  - **Modifier** : ouvre un formulaire d'edition inline (seulement si saas_team)
- Requetes : jointure `exercise → module → path_module → path` pour afficher le contexte

### 4. Route dans `App.tsx`

```tsx
<Route path="/admin/academy/assets" element={<AdminAcademyAssets />} />
```

## Section technique

- Les jointures pour recuperer le contexte (module, parcours, org) se font cote client via des requetes React Query enrichies avec `.select("*, academy_modules!inner(title, academy_path_modules(academy_paths(name, organization_id, organizations(name))))")`
- La duplication copie toutes les donnees sauf `id`, `module_id` (remplace par la cible), et `created_at`
- Pour les quiz, la duplication copie aussi les `academy_quiz_questions` associees
- Le filtre org utilise un `Select` avec les organisations chargees via une requete separee

