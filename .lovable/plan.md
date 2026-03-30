

# Plan — Dupliquer le module Pilotage des Certificats dans le portail ACADEMIE

## Contexte

Le module admin `/admin/academy/certificates` (AdminAcademyCertificates + CertPathDetail) gère le pilotage global des certificats (Dashboard KPI, liste, paramétrage par parcours, API). Il doit être dupliqué dans le portail workspace sous `/portal/academie/certificates`. Les certificats personnels de l'apprenant restent dans Formations (`/portal/certificates`).

## Actions

### 1. Créer la page portail `PortalAcademieCertificates.tsx`
- Copie de `AdminAcademyCertificates.tsx` sans `<AdminShell>`
- Remplacer tous les liens internes `/admin/academy/` → `/portal/academie/`
- Réutiliser le même composant `CertPathDetail` (il est déjà découplé du shell)

### 2. Ajouter la route dans `App.tsx`
- `/portal/academie/certificates` → `PortalAcademieCertificates`

### 3. Ajouter l'entrée sidebar dans `PortalSidebar.tsx`
- Ajouter `{ icon: Award, label: "Certificats", path: "/portal/academie/certificates" }` dans la section `/portal/academie`

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/portal/PortalAcademieCertificates.tsx` | **Créer** — miroir portail de AdminAcademyCertificates |
| `src/App.tsx` | Ajouter route |
| `src/components/portal/PortalSidebar.tsx` | Ajouter entrée "Certificats" |

