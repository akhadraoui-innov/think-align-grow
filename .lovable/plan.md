


# Plan — Skills, Certification, IA & Retour d'Expérience — Version Augmentée (révisé)

## Vision

Transformer le module Skills + Certification en un écosystème complet : référentiel de compétences structuré, page certificat dédiée multi-onglets, agent IA Knowledge, retour d'expérience apprenant, et analytics avancés.

---

## 1. ✅ Migration DB — Schéma enrichi

### 1a. Colonnes JSONB sur `academy_paths` — FAIT
### 1b. Table `academy_path_feedback` — FAIT
### 1c. Table `academy_skill_assessments` — FAIT
### Données Process Mining + feedback Ammar Khadraoui — FAIT

---

## 2. ✅ Edge Function `academy-skills-agent` — Agent IA

Déployée avec 3 actions : `assess-skills`, `generate-rex`, `knowledge` (streaming).

---

## 3. ✅ Page Certificat Dédiée — `PortalCertificateDetail.tsx`

Route `/portal/certificates/:id` — 5 onglets : Vue d'ensemble, Évaluation, Compétences, Analyse & REX (avec Knowledge IA chat), Certificat.

---

## 4. ✅ PDF Certificat — Refonte 3 pages premium

Page 1 — Certificat (paysage A4), Page 2 — **Évaluation** (portrait), Page 3 — Attestation de compétences avec débouchés, modalités d'évaluation, points forts/axes d'amélioration, narrative nominative.

---

## 5. ✅ `PathSkillsTab.tsx` — Onglet Skills enrichi

6 sections : Compétences, Prérequis, Aptitudes, Débouchés, Ressources liées, intégré dans admin + portail.

---

## 6. ✅ PathInfoTab enrichi

Ajouté section Aptitudes professionnelles manquante. Skills, Prérequis, Débouchés déjà présents.

---

## 7. ✅ Enrichir `academy-generate` — IA génère skills automatiquement

Tool schema enrichi avec `skills[]`, `prerequisites[]`, `aptitudes[]`, `professional_outcomes[]`. Insert mis à jour.

---

## 8. ✅ Widget "Knowledge IA" post-certification

Chat inline streaming dans l'onglet Analyse & REX de PortalCertificateDetail.

---

## 9. ✅ Navigation certificats → page dédiée

AcademyCertificates et PortalFormationsCertificates naviguent vers `/portal/certificates/:id`.

---

## 10. ✅ Config.toml

Ajouté `[functions.academy-skills-agent]` avec `verify_jwt = false`.

---

## Prochaines étapes potentielles

- Moderniser pages parcours (PortalFormationsPath + AcademyPath) avec hero premium et section skills visible
- Ajouter feedback apprenants agrégé dans PathSkillsTab
- Dashboard analytics des compétences acquises par cohorte
