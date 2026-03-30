

# Plan — Onglet Skills + Enrichissement Certificat

## 1. Migration DB — Nouvelles colonnes sur `academy_paths`

Ajouter 4 colonnes JSONB sur `academy_paths` :
- `skills` — compétences développées (array d'objets `{name, category, level}`)
- `prerequisites` — prérequis (array de strings)
- `aptitudes` — aptitudes professionnelles développées (array de strings)
- `professional_outcomes` — ce que la formation permet professionnellement (array de strings)

```sql
ALTER TABLE academy_paths
  ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS prerequisites jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS aptitudes jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS professional_outcomes jsonb NOT NULL DEFAULT '[]';
```

Pré-remplir le parcours Process Mining existant avec des données réalistes.

## 2. Nouveau composant `PathSkillsTab.tsx`

Composant riche dans `src/components/admin/path-detail/PathSkillsTab.tsx` avec :

**Section Compétences** — Cards avec nom, catégorie (technique/transversale/métier), niveau (1-5 étoiles), édition inline
**Section Prérequis** — Liste avec tags ajoutables/supprimables
**Section Aptitudes professionnelles** — Tags éditables
**Section Débouchés professionnels** — Cards descriptives
**Section Ressources liées** — Queries automatiques :
- Challenges liés (via `challenge_template_toolkits` + nom toolkit dans tags du path)
- Workshops liés (via `organization_id` commun)
- Pratiques liées (via `academy_practices` des modules du parcours)
- Autres parcours liés (mêmes tags ou même function_id)

## 3. Intégration dans les pages parcours (admin + portail)

| Fichier | Modification |
|---------|-------------|
| `AdminAcademyPathDetail.tsx` | Ajouter TabsTrigger "Skills" (icône Sparkles) après "Informations" |
| `PortalAcademiePathDetail.tsx` | Même ajout (miroir portail) |

## 4. Enrichir le certificat PDF — Page 3 "Attestation de compétences"

Ajouter une 3e page au PDF dans `CertificateDownload.tsx` :

**Page 3 — Attestation détaillée (portrait A4)**
- Header GROWTHINNOV + titre "ATTESTATION DE COMPÉTENCES"
- Description du parcours (objectifs, composantes)
- Tableau des compétences acquises avec niveau atteint
- Liste des aptitudes développées
- Relevé détaillé par module : titre, type, score, objectifs du module
- Signature + QR code

Modifier l'interface `CertificateDownloadProps` pour accepter :
- `skills`, `aptitudes`, `prerequisites`, `pathDescription`, `difficulty`

## 5. Enrichir `PathInfoTab.tsx`

Ajouter dans la vue lecture : section "Compétences clés" (badges), "Prérequis" (liste), "Débouchés" (cards). Ces données viennent des nouvelles colonnes `skills/prerequisites/aptitudes/professional_outcomes`.

## 6. Enrichir la génération IA des parcours

Mettre à jour l'edge function `academy-generate` pour que lors de la création d'un parcours, l'IA génère aussi les `skills`, `prerequisites`, `aptitudes` et `professional_outcomes`.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | ADD 4 colonnes JSONB + UPDATE Process Mining |
| `src/components/admin/path-detail/PathSkillsTab.tsx` | **Créer** — onglet Skills complet |
| `src/pages/admin/AdminAcademyPathDetail.tsx` | Ajouter onglet Skills |
| `src/pages/portal/PortalAcademiePathDetail.tsx` | Ajouter onglet Skills (miroir) |
| `src/components/admin/path-detail/PathInfoTab.tsx` | Enrichir vue lecture avec skills/prérequis |
| `src/components/academy/CertificateDownload.tsx` | Ajouter page 3 attestation de compétences |
| `src/pages/AcademyCertificates.tsx` | Passer skills/aptitudes au composant PDF |
| `src/pages/portal/PortalFormationsCertificates.tsx` | Idem portail |
| `supabase/functions/academy-generate/index.ts` | Enrichir prompt IA pour générer skills |

## Ordre d'exécution

1. Migration DB (colonnes + données Process Mining)
2. Créer `PathSkillsTab.tsx`
3. Intégrer dans `AdminAcademyPathDetail` + `PortalAcademiePathDetail`
4. Enrichir `PathInfoTab.tsx`
5. Enrichir `CertificateDownload.tsx` (page 3)
6. Mettre à jour les pages certificats pour passer les données skills
7. Enrichir l'edge function `academy-generate`

