

# Plan — Skills, Certification, IA & Retour d'Expérience — Version Augmentée (révisé)

## Vision

Transformer le module Skills + Certification en un écosystème complet : référentiel de compétences structuré, page certificat dédiée multi-onglets, agent IA Knowledge, retour d'expérience apprenant, et analytics avancés.

---

## 1. Migration DB — Schéma enrichi

### 1a. Colonnes JSONB sur `academy_paths`
```sql
ALTER TABLE academy_paths
  ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS prerequisites jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS aptitudes jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS professional_outcomes jsonb NOT NULL DEFAULT '[]';
```

### 1b. Table `academy_path_feedback` — Retour d'expérience apprenant
Ratings (overall, difficulty, relevance), forces, améliorations, témoignage, recommandation, insights IA. Unique par enrollment.

### 1c. Table `academy_skill_assessments` — Évaluation par compétence
Skill name, niveau initial vs final, preuves (modules réussis), date d'évaluation. Lié à l'enrollment.

Pré-remplir données Process Mining + feedback Ammar Khadraoui.

---

## 2. Edge Function `academy-skills-agent` — Agent IA

**Actions supportées :**
- `assess-skills` — Analyse scores modules + réponses quiz/exercices → évalue chaque compétence du référentiel avec niveau initial vs final et preuves
- `generate-rex` — Génère un retour d'expérience structuré : points forts, axes d'amélioration, recommandations de parcours complémentaires, score NPS estimé
- `knowledge` — **Knowledge IA** : agent conversationnel expert sur le contenu du parcours, les compétences, les concepts clés, les ressources associées. L'apprenant peut poser des questions sur ce qu'il a appris, approfondir un concept, demander des explications complémentaires ou des références. L'IA exploite le contexte du parcours (modules, objectifs, skills, aptitudes) pour répondre comme un expert du domaine.

Utilise `google/gemini-2.5-flash` via Lovable AI gateway.

---

## 3. Page Certificat Dédiée — `PortalCertificateDetail.tsx`

Route : `/portal/certificates/:id` — remplace le Dialog actuel.

**5 onglets :**

| Onglet | Contenu |
|--------|---------|
| **Vue d'ensemble** | Hero premium avec grade lettre (A/B/C/D), KPIs visuels (score, modules, temps, difficulté), description du parcours, boutons télécharger/partager/LinkedIn |
| **Évaluation** | Tableau détaillé des modules avec score, type, durée, barre de progression. Moyennes par catégorie (leçons/quiz/exercices/pratiques). Graphique radar des types |
| **Compétences** | Matrice skills avec niveaux étoiles + progression (initial→final via `academy_skill_assessments`). Aptitudes développées. Débouchés professionnels. Prérequis validés |
| **Analyse & REX** | Points forts (modules >85%), axes d'amélioration (<70%). Modalités d'évaluation. Formulaire de retour d'expérience. Insights IA générés |
| **Certificat** | Aperçu visuel premium + bouton télécharger PDF + partage LinkedIn + QR code |

Design : style éditorial corporate premium — blanc pur, navy, accents dorés.

---

## 4. PDF Certificat — Refonte 3 pages premium

**Page 1** — Certificat (paysage A4) : fond blanc pur, bordures navy (#0F1729), accents dorés subtils, typographie corporate

**Page 2** — **Évaluation** (portrait) : header navy, tableau modules avec scores/types/durées, totaux en bande sombre

**Page 3** — Attestation de compétences (portrait) : référentiel compétences acquises avec niveaux, aptitudes, points forts/axes d'amélioration, modalités d'évaluation, rédaction narrative nominative, signature + QR code

---

## 5. `PathSkillsTab.tsx` — Onglet Skills enrichi

6 sections : Compétences (cards éditables avec niveaux étoiles), Prérequis (tags), Aptitudes (tags), Débouchés (cards), Ressources liées (queries automatiques), Feedback apprenants (agrégation NPS + témoignages + insights IA)

---

## 6. Pages Parcours modernisées

Refonte `PortalFormationsPath.tsx` + `AcademyPath.tsx` : hero premium, section skills/prérequis visible, timeline modules corporate, modalités d'évaluation si certifiant, bouton certificat proéminent, bouton retour d'expérience post-complétion

---

## 7. Enrichir `academy-generate` — IA génère skills automatiquement

Mettre à jour le tool schema pour inclure `skills[]`, `prerequisites[]`, `aptitudes[]`, `professional_outcomes[]`.

---

## 8. Widget "Knowledge IA" post-certification

Dans `PortalCertificateDetail.tsx`, onglet "Analyse & REX" :
- Bouton "Approfondir mes connaissances" qui ouvre un chat inline
- Appel à `academy-skills-agent` action `knowledge`
- L'IA exploite le contenu du parcours (modules, objectifs, compétences, concepts clés) pour agir comme un expert du domaine
- L'apprenant peut poser des questions, approfondir un concept, demander des ressources complémentaires

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | ADD colonnes + CREATE 2 tables + RLS + données Process Mining + feedback Ammar |
| `supabase/functions/academy-skills-agent/index.ts` | **Créer** — assess-skills, generate-rex, knowledge |
| `src/pages/portal/PortalCertificateDetail.tsx` | **Créer** — Page dédiée multi-onglets |
| `src/components/admin/path-detail/PathSkillsTab.tsx` | **Créer** — Onglet Skills complet avec feedback |
| `src/pages/portal/PortalFormationsCertificates.tsx` | Navigation vers `/portal/certificates/:id` |
| `src/pages/AcademyCertificates.tsx` | Même refonte navigation |
| `src/pages/admin/AdminAcademyPathDetail.tsx` | Ajouter onglet Skills |
| `src/pages/portal/PortalAcademiePathDetail.tsx` | Ajouter onglet Skills |
| `src/components/admin/path-detail/PathInfoTab.tsx` | Enrichir avec skills/prérequis/débouchés |
| `src/components/academy/CertificateDownload.tsx` | Refonte PDF 3 pages premium (Évaluation, pas Relevé de notes) |
| `src/pages/portal/PortalFormationsPath.tsx` | Refonte design corporate + REX |
| `src/pages/AcademyPath.tsx` | Miroir portail |
| `supabase/functions/academy-generate/index.ts` | Enrichir prompt + tool schema pour skills |
| `src/App.tsx` | Ajouter route `/portal/certificates/:id` |

## Ordre d'exécution

1. Migration DB (colonnes + tables feedback/assessments + RLS + données)
2. Edge function `academy-skills-agent`
3. Créer `PathSkillsTab.tsx` + intégrer dans admin/portail
4. Enrichir `PathInfoTab.tsx`
5. Créer `PortalCertificateDetail.tsx` (page multi-onglets avec "Évaluation")
6. Modifier navigation certificats (Dialog → page dédiée)
7. Refonte `CertificateDownload.tsx` (PDF 3 pages, "Évaluation")
8. Moderniser pages parcours (PortalFormationsPath + AcademyPath)
9. Enrichir `academy-generate` pour skills auto
10. Widget Knowledge IA

