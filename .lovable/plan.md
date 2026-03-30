

# Amélioration Catalogue Formations + Sidebar (Mes parcours + Organisation)

## Changements

### 1. Sidebar — Ajouter "Mes parcours" + Organisation

**`src/components/portal/PortalSidebar.tsx`**

- Ajouter un item "Mes parcours" dans la config Formations (entre Catalogue et Dashboard), avec icône `Route`, pointant vers `/portal/dashboard` ou une ancre dédiée
- En bas de la sidebar : afficher le nom (et logo si dispo) de l'organisation active via `useActiveOrg()`. En mode collapsed, afficher uniquement l'icône/logo. Réutilise le pattern de `OrgSwitcher.tsx`
- Si l'org a un `logo_url` (champ `organizations`), afficher l'image ; sinon fallback sur l'icône `Building2`

Config sidebar Formations mise à jour :
```
Catalogue → /portal
Mes parcours → /portal/dashboard (section parcours en cours/terminés)
Certificats → /portal/certificates
```

### 2. Catalogue — Amélioration visuelle

**`src/pages/portal/PortalFormations.tsx`**

- Séparer le contenu en 2 sections claires via la sidebar : le **Catalogue** (`/portal`) ne montre que la grille de parcours disponibles avec filtres améliorés ; les KPIs, heatmap, parcours en cours et activité récente sont dans **Mes parcours** (`/portal/dashboard`)
- Améliorer les cards catalogue : ajouter une bande de couleur en haut basée sur la difficulté, icône de fonction métier, nombre d'inscrits (si dispo), tags visibles, et un CTA "Voir le parcours" plus visible
- Ajouter un compteur de résultats ("12 parcours disponibles")
- Améliorer le layout des filtres : pills plus larges, search plus proéminent

### 3. Page "Mes parcours" existante

**`src/pages/portal/PortalFormationsDashboard.tsx`** — Vérifier qu'elle existe déjà et contient les KPIs + heatmap + parcours en cours/terminés. Si c'est un doublon de PortalFormations, nettoyer pour que chaque page ait son rôle propre.

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/portal/PortalSidebar.tsx` | Ajouter "Mes parcours" + bloc organisation en bas |
| `src/pages/portal/PortalFormations.tsx` | Nettoyer = catalogue seul, améliorer les cards |
| `src/pages/portal/PortalFormationsDashboard.tsx` | S'assurer qu'il contient KPIs + parcours utilisateur |

