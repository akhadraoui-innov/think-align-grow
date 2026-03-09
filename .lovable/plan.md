

## Plan: Moderniser l'experience Workshop + liste des workshops

### Probleme actuel
La page `/workshop` ne montre pas les workshops existants de l'utilisateur. Le breadcrumb ne couvre pas `/workshop`. L'experience est basique (pas de liste, pas de statut visuel).

### Modifications

#### 1. Hook `useMyWorkshops` (src/hooks/useWorkshop.ts)
Ajouter un hook qui recupere les workshops ou l'utilisateur est participant, avec le role et le nombre de participants :
```typescript
export function useMyWorkshops() {
  // Query workshop_participants filtered by user_id
  // Join workshops table for name, code, status, created_at, host_id
  // Sort by created_at desc
}
```

#### 2. Refonte de la page Workshop (src/pages/Workshop.tsx)
Moderniser avec une experience en 3 zones :

- **Actions rapides** en haut : deux cartes cote a cote "Creer" et "Rejoindre" (plus compactes, glassmorphism)
- **Section "Mes workshops"** : liste des workshops avec badges de statut colores (vert=actif, orange=pause, gris=termine, bleu=lobby), role (host/participant), nombre de participants, date relative (date-fns `formatDistanceToNow`), clic pour naviguer
- **Etat vide** elegant si aucun workshop
- Les formulaires create/join s'ouvrent en Dialog modal au lieu de remplacer toute la page
- Animations framer-motion staggerees sur la liste

#### 3. Breadcrumb (src/components/layout/AppShell.tsx)
Ajouter `/workshop` → "Workshop" dans le map du breadcrumb.

#### 4. Sidebar "Nouveau workshop" (src/components/layout/AppSidebar.tsx)
Le lien `/workshop/new` n'a pas de route. Le remplacer par une action qui navigue vers `/workshop` et ouvre le dialog de creation, ou simplement pointer vers `/workshop` avec un query param `?action=create`.

### Fichiers modifies
- `src/hooks/useWorkshop.ts` — ajouter `useMyWorkshops`
- `src/pages/Workshop.tsx` — refonte complete avec liste + dialogs
- `src/components/layout/AppShell.tsx` — ajouter workshop au breadcrumb
- `src/components/layout/AppSidebar.tsx` — corriger le lien "Nouveau workshop"

Pas de migration DB necessaire : les RLS existantes (`is_workshop_participant`) autorisent deja la lecture.

