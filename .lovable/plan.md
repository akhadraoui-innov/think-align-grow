

## Diagnostic : conflit de layout entre AppShell et WorkshopRoom

### Probleme racine

`WorkshopRoom` est rendu **a l'interieur** de `AppShell`, qui ajoute :
- La **sidebar** a gauche (icones visibles sur le screenshot)
- Le **header** de 48px en haut (breadcrumb "Hack & Show / Workshop")

Mais `WorkshopRoom` utilise `h-screen w-screen flex flex-col` — il essaie d'occuper tout l'ecran alors qu'il est imbrique dans le layout sidebar+header. Resultat :
- La sidebar AppShell + la CardSidebar du workshop se superposent a gauche
- Le header AppShell + la banniere read-only + la toolbar = 3 barres empilees en haut
- Le canvas deborde car `h-screen` ne tient pas compte du header parent

### Solution

**Exclure `/workshop/:id` du shell AppShell**, comme c'est deja fait pour `/auth` et `/`. Le WorkshopRoom a son propre chrome (toolbar, sidebar cartes, banniere).

### Modifications

#### 1. `src/components/layout/AppShell.tsx`
Detecter les routes `/workshop/` (avec un ID) et les rendre sans shell :

```typescript
const isWorkshopRoom = location.pathname.startsWith("/workshop/") 
  && location.pathname !== "/workshop";

if (isLandingPage || isAuthPage || isWorkshopRoom) {
  return <>{children}</>;
}
```

Cela supprime d'un coup la sidebar + header dupliques. La page `/workshop` (liste) garde le shell normal.

#### 2. `src/pages/WorkshopRoom.tsx`
- Supprimer `w-screen` (inutile et cause des scrollbars horizontales)
- Garder `h-screen flex flex-col` qui est correct quand le composant est au top-level

### Fichiers modifies
- `src/components/layout/AppShell.tsx` — ajouter exclusion workshop room
- `src/pages/WorkshopRoom.tsx` — retirer `w-screen`

