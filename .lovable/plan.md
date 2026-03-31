

# Plan — Immersion chromatique par zone du portail

## Concept

Deux familles de couleur appliquées à tout le portail (header, sidebar, accents) selon l'onglet actif :

- **Knowledge** (FORMATIONS + PRATIQUE) — Bleu marine profond `hsl(220 60% 25%)`
- **Collective Intelligence** (WORKSHOPS + CHALLENGES) — Bordeaux `hsl(345 65% 35%)`
- **ACADEMIE / INSIGHT** — Restent sur le bleu portail actuel

Quand on clique sur un onglet, une classe CSS (`portal-knowledge` ou `portal-collective`) est ajoutée au conteneur root `.portal`, ce qui override les variables `--primary`, `--ring`, `--sidebar-primary` etc. L'immersion est totale : onglets actifs, sidebar liens actifs, badges credits, notification dot — tout bascule.

## Mécanisme technique

### 1. CSS — 2 nouvelles classes de zone dans `index.css`

```text
.portal.portal-knowledge {
  --primary: 220 60% 25%;        /* navy */
  --ring: 220 60% 25%;
  --shadow-primary: ... navy glow
  --sidebar-primary: 220 60% 25%;
}

.portal.portal-collective {
  --primary: 345 65% 35%;        /* bordeaux */
  --ring: 345 65% 35%;
  --shadow-primary: ... bordeaux glow
  --sidebar-primary: 345 65% 35%;
}
```

### 2. PortalShell — Classe dynamique sur le root

Dériver la zone depuis `activeTab` :

```text
activeTab in ["/portal", "/portal/pratique"]      → "portal-knowledge"
activeTab in ["/portal/workshops", "/portal/challenges"] → "portal-collective"
sinon                                              → "" (bleu portail par défaut)
```

Appliquer : `<div className={cn("portal", zoneClass, ...)}>`

### 3. Header tabs — Indicateurs visuels de groupe

Ajouter un petit label discret sous les onglets groupés ou un séparateur visuel entre Knowledge et Collective Intelligence. Les onglets inactifs d'un même groupe restent teintés légèrement de la couleur du groupe pour montrer l'appartenance.

Structure header tabs enrichie :

```text
[FORMATIONS] [PRATIQUE]  |  [WORKSHOPS] [CHALLENGES]  |  [ACADEMIE] [INSIGHT]
 ── Knowledge ──            ── Collective ──              ── Platform ──
```

Le séparateur est un trait vertical fin (`h-5 w-px bg-border`) entre les groupes.

### 4. Sidebar — Accent adaptatif

La sidebar utilise déjà `text-primary` et `bg-primary/8` pour les items actifs. Puisque `--primary` change selon la zone, la sidebar s'adapte automatiquement sans modification de code.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/index.css` | Ajouter classes `.portal-knowledge` et `.portal-collective` avec variables overridées |
| `src/components/portal/PortalShell.tsx` | Calculer `zoneClass` depuis `activeTab`, appliquer sur root div, ajouter séparateurs et labels de groupe dans le header tabs |

## Ordre d'exécution

1. Ajouter les 2 classes CSS de zone dans `index.css`
2. Modifier `PortalShell.tsx` : logique de zone + classe dynamique + header tabs groupés avec séparateurs

