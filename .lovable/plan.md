

# Plan — Complétion parcours Ammar Khadraoui + Module Certification E2E

## Deux axes majeurs

### AXE 1 — Simuler la complétion du parcours Process Mining pour Ammar Khadraoui

Insérer des données réalistes dans la base via l'outil d'insertion SQL (pas de migration).

**User ID** : `315af24d-afe3-4162-9b78-45274c0fe5dc`
**Path ID** : `036db7ea-359a-4359-9be2-2697a0a0d6f7`
**Enrollment ID** : `4168351f-6a24-4589-917f-4ff0ff30f828`

| Opération | Table | Détail |
|-----------|-------|--------|
| INSERT x4 | `academy_progress` | Modules 2-5 avec scores (88-100%), temps réalistes, metadata riche (réponses quiz, soumissions exercices, évaluations IA) |
| UPDATE x1 | `academy_enrollments` | Status → `completed`, `completed_at` = il y a 5 jours |
| INSERT x1 | `academy_certificates` | Certificat avec `certificate_data` complet (score moyen 91%, modules_completed: 5, total_time_hours, détail par module) |

Chaque `metadata` JSONB contiendra :
- **Exercise** : soumission textuelle réaliste sur l'extraction d'event logs SAP, évaluation IA (pertinence: 90, structure: 85, profondeur: 88)
- **Quiz** : réponses par question avec scores, tentative #1, durée par question
- **Lesson** : temps de lecture, sections visitées
- **Practice** : résumé de session, score, nombre d'échanges

### AXE 2 — Module Certification de bout en bout

Fonctionnalités manquantes identifiées :

| # | Fonctionnalité | État actuel | Action |
|---|----------------|-------------|--------|
| 1 | Auto-génération du certificat à 100% de complétion | Inexistant — aucun trigger/logique | Ajouter dans `useAcademyModule.ts` : quand `saveProgress` amène `completedCount + 1 >= pathModules.length` ET `certificate_enabled`, INSERT automatique dans `academy_certificates` |
| 2 | Notification dans la célébration | Partiel — `PathCompletionCelebration` existe mais ne mentionne pas le certificat | Ajouter bouton "Voir mon certificat" dans l'écran de célébration |
| 3 | Téléchargement PDF du certificat | Inexistant | Créer un composant `CertificatePDF` qui génère un PDF client-side via `html2canvas` + `jspdf` (ou canvas natif) |
| 4 | Partage / lien public du certificat | Inexistant | Hors scope pour cette itération |
| 5 | Vue certificat enrichie | Basique — dialog simple | Enrichir avec détails par module, scores, durée, bouton télécharger PDF |
| 6 | Badge certificat dans le dashboard formations | Inexistant | Afficher un badge dans `PortalFormationsPath` et `PortalFormationsDashboard` quand certificat obtenu |

#### Fichiers à modifier/créer

| Fichier | Action |
|---------|--------|
| `src/hooks/useAcademyModule.ts` | Ajouter logique auto-certification après `saveProgress` quand path complété à 100% et `certificate_enabled` |
| `src/components/academy/CertificateDownload.tsx` | **Créer** — Génère un PDF premium via canvas (nom, parcours, date, score, organisation, numéro unique) |
| `src/pages/AcademyModule.tsx` | Ajouter bouton certificat dans `PathCompletionCelebration` |
| `src/pages/portal/PortalFormationsModule.tsx` | Idem pour le portail |
| `src/pages/AcademyCertificates.tsx` | Enrichir dialog avec détails par module + bouton télécharger PDF |
| `src/pages/portal/PortalFormationsCertificates.tsx` | Idem portail |
| `src/pages/portal/PortalFormationsPath.tsx` | Afficher badge certificat obtenu si `progressPct === 100` et certificat existant |
| `src/pages/AcademyPath.tsx` | Idem cabinet |

#### Logique auto-certification (dans `useAcademyModule.ts`)

```text
saveProgress() → si status === "completed"
  → recalculer completedCount
  → si completedCount >= totalModules ET pathData.certificate_enabled
    → Vérifier qu'aucun certificat n'existe déjà
    → Calculer score moyen, temps total, détails modules
    → INSERT academy_certificates
    → Retourner flag "certificateIssued" pour déclencher la célébration
```

#### PDF du certificat (client-side via canvas)

Design premium avec :
- Logo GROWTHINNOV + logo organisation
- Titre "CERTIFICAT DE RÉUSSITE"
- Nom du parcours, nom de l'apprenant
- Score global, nombre de modules, heures de formation
- Date d'émission, numéro unique (ID tronqué)
- Bordures décoratives dorées

### Ordre d'exécution

1. **INSERT données** — Complétion du parcours Ammar Khadraoui (4 progress + 1 enrollment update + 1 certificat)
2. **Logique auto-certification** — `useAcademyModule.ts`
3. **Composant PDF** — `CertificateDownload.tsx`
4. **Enrichir pages certificats** — AcademyCertificates + PortalFormationsCertificates (dialog + PDF)
5. **Célébration** — Bouton certificat dans AcademyModule + PortalFormationsModule
6. **Badge path** — AcademyPath + PortalFormationsPath

