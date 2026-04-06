
# Plan — Fix double sidebar/header sur les pages UCM Portal

## Cause

`AppShell.tsx` (ligne 46-48) enveloppe **automatiquement** toutes les routes `/portal/*` dans `<PortalShell>`. Or les 3 pages UCM (`PortalUCM.tsx`, `PortalUCMProject.tsx`, `PortalUCMExplorer.tsx`) enveloppent aussi leur contenu dans `<PortalShell>`, causant un double header + double sidebar.

## Solution

Retirer `<PortalShell>` des 3 fichiers UCM portal — les remplacer par un simple fragment ou div, comme le font les autres pages portal (ex: `PortalFormations`, `PortalPratique`).

## Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/pages/portal/PortalUCM.tsx` | Retirer `<PortalShell>` wrapper, garder `<PageTransition>` directement |
| `src/pages/portal/PortalUCMProject.tsx` | Retirer `<PortalShell>` wrapper |
| `src/pages/portal/PortalUCMExplorer.tsx` | Retirer `<PortalShell>` wrapper |
