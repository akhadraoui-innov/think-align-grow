## Objectif

Aligner totalement les cards toolkits sur le langage visuel des formations Academy (cover image éditoriale, badges noir/uppercase, hover scale, fallback élégant) tout en réservant aux toolkits une **identité graphique propre** : visuels d'**ateliers d'idéation et d'intelligence collective** (cartes physiques, post-its, frameworks, mains qui collaborent) liés au sujet du toolkit.

Build complet : DB → Storage → Génération IA → UI catalogue + détail + admin → batch + auto-trigger → QA performance.

## 1. Schéma DB

Migration `toolkits` :
```sql
ALTER TABLE public.toolkits ADD COLUMN cover_image_url text;
CREATE INDEX IF NOT EXISTS toolkits_status_idx ON public.toolkits(status);
```

Réutilisation du bucket existant `academy-assets` (déjà public, RLS écriture SaaS team) sous le préfixe `toolkit-covers/<id>.png`. Pas de nouveau bucket → pas de nouvelle policy.

## 2. Edge Function — `academy-generate`

Mutualisation : on ajoute deux actions dans la fonction existante (même style que `generate-cover` / `generate-all-covers` déjà en place pour Academy) :

| Action | Params | Comportement |
|---|---|---|
| `generate-toolkit-cover` | `toolkit_id` | Génère + uploade + update `cover_image_url`. Idempotent (`upsert: true`). |
| `generate-all-toolkit-covers` | (aucun, ou `force: bool`) | Itère sur toolkits où `cover_image_url IS NULL` (ou tous si `force`). Concurrence limitée (3 en parallèle), `Promise.allSettled`, retour `{ ok, ko, errors[] }`. |

**Pipeline image** (réplique du pipeline Academy validé) :
1. Construction du prompt par `google/gemini-2.5-flash` (rapide) avec brief stylistique fixe + données toolkit (`name`, `description`, `target_audience`, `nomenclature`, top-3 `tags`)
2. Génération image par `google/gemini-3.1-flash-image-preview` (rapport qualité/latence le meilleur)
3. Upload `academy-assets/toolkit-covers/<id>.png`, URL publique persistée

**Brief stylistique toolkit (différent d'Academy)** :
> Premium editorial illustration of a strategic ideation workshop in action. Top-down or 3/4 view of a collaborative table covered with **physical ideation cards, sticky notes, sketchnotes, a structured framework canvas**, and the diverse hands of professionals collaborating. Symbolic objects, charts and props specific to the toolkit topic ("{name}" — {description}) are visible on the cards and canvas. Modern flat-vector + light isometric 3D, Behance/Dribbble-grade quality, cinematic soft lighting, harmonious palette of 2-4 colors with one strong topic-driven accent color. 16:9. Absolutely NO text, NO letters, NO words, NO logos.

**Robustesse** :
- Validation Zod du body
- Gestion explicite 402 / 429 → renvoyés au client tels quels
- Logs structurés (`console.log({ action, toolkit_id, status })`)
- Timeout/fallback : si la génération échoue, ne pas écrire `cover_image_url`, renvoyer 200 + `{ generated: false, reason }` pour ne pas bloquer le batch

## 3. Auto-trigger admin

Dans `src/pages/admin/AdminToolkits.tsx` :
- À la création manuelle (insert) → invocation `generate-toolkit-cover` *fire-and-forget* (toast neutre "Couverture en cours…")
- À la fin de `generate-toolkit` IA → idem dans le `onSuccess`
- Bandeau contextuel en tête de table : "X toolkits sans couverture · [Générer toutes]" (n'apparaît que si N>0)
- Sur chaque ligne, bouton icône au hover : régénérer / générer (icône `Wand2`)
- Invalidation de `react-query` `["admin-toolkits"]` après chaque génération

## 4. UI Portal — `PortalToolkits` (catalogue)

Refonte de la **vue grille** uniquement (la vue liste ajoutera juste une mini-thumbnail 56x40). Pattern aligné sur `PortalAcademiePaths` :

```tsx
<Card className="group overflow-hidden flex flex-col">
  {/* Cover bandeau */}
  <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5">
    {toolkit.cover_image_url ? (
      <img
        src={`${toolkit.cover_image_url}?v=${new Date(toolkit.updated_at || toolkit.created_at).getTime()}`}
        alt={toolkit.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-60">
        {toolkit.icon_emoji || "🚀"}
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

    {/* Badges superposés haut-droite — style serious game noir */}
    <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end">
      {toolkit.difficulty_level && (
        <Badge className="text-[9px] bg-black/85 text-white border-0 uppercase tracking-wider font-bold backdrop-blur">
          {DIFFICULTY_MAP[toolkit.difficulty_level].label}
        </Badge>
      )}
      <Badge className="text-[9px] bg-black/85 text-white border-0 uppercase tracking-wider font-bold backdrop-blur">
        <Layers className="h-3 w-3 mr-1" /> {pillarCounts[toolkit.id] || 0} piliers
      </Badge>
    </div>

    {/* Titre en bas du bandeau pour ancrer la lecture */}
    <div className="absolute bottom-3 left-4 right-4">
      <p className="text-base font-bold text-white drop-shadow line-clamp-2">{toolkit.name}</p>
      <p className="text-[10px] text-white/70 uppercase tracking-widest">v{toolkit.version}</p>
    </div>
  </div>

  {/* Body : description + meta */}
  <CardContent className="p-5 flex flex-col gap-3 flex-1">
    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{toolkit.description}</p>
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
      {toolkit.target_audience && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <Users className="h-3.5 w-3.5" /> {toolkit.target_audience}
        </span>
      )}
      <span className="text-xs font-semibold flex items-center gap-1 text-muted-foreground/60 group-hover:text-primary transition-all">
        Voir <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </div>
  </CardContent>
</Card>
```

**Vue détail** (`selectedToolkit`) : transformer le bloc header de la sidebar en hero plein largeur 200px avec cover en background + overlay `from-background via-background/70`, comme `AcademyPath`. Le reste de la sidebar (description, audience, bénéfices, stats) reste structurellement identique.

**Vue liste** : ajout d'une thumbnail `h-12 w-16 rounded-lg object-cover` à gauche de chaque ligne — fallback emoji centré.

## 5. Performances

- **Lazy + decode async** sur toutes les `<img>` cover
- **Cache-busting fin** : `?v=${updated_at}` (pas `Date.now()`) → permet vrai cache navigateur entre sessions
- **CDN Storage Supabase** déjà actif sur `academy-assets`
- **Query react-query** : `staleTime: 5 * 60_000` pour `portal-toolkits` et `portal-toolkit-pillar-counts` (déjà déclarées sans staleTime)
- **Pillar counts** : remplacer le `select("id, toolkit_id")` puis groupBy JS par une RPC simple :
  ```sql
  CREATE OR REPLACE FUNCTION public.get_pillar_counts_per_toolkit()
  RETURNS TABLE (toolkit_id uuid, count int)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT toolkit_id, count(*)::int FROM pillars GROUP BY toolkit_id
  $$;
  ```
  Évite de transférer toutes les lignes pillars
- **Batch covers** : limiter à 3 en parallèle (Gemini image gateway sensible aux pics) + 250ms `await` entre vagues
- **Pas d'animation framer-motion sur l'image** — elle reste sur la carte (`motion.div whileHover y:-4`), l'image utilise un simple `transition-transform CSS` (GPU-friendly)

## 6. QA / Acceptation

1. Catalogue grille : 3 colonnes ≥ lg, hauteur card uniforme, ratio bandeau 16:9 respecté
2. Fallback emoji visible et propre sur toolkits sans cover (avant batch)
3. Batch admin : génération de l'ensemble du catalogue en < 2 min, aucune régression de la table
4. Vue liste : thumbnail bien alignée, tronquage description fonctionne en 1024px
5. Vue détail : hero lisible (overlay), pas de CLS (hauteur fixe)
6. Lighthouse `/portal/workshops/toolkits` : LCP < 2.5s avec 8 covers chargées
7. Aucun warning console, aucune `<img>` sans `loading="lazy"` ni `alt`

## 7. Hors scope

- Quiz / certificats toolkits
- Vue grille admin (table only)
- Aucune modification de la génération de cartes ou piliers
- Aucun changement sur `PortalAcademiePaths`

## Fichiers touchés

- **Migration SQL** (nouvelle)
- `supabase/functions/academy-generate/index.ts` — 2 actions + brief
- `src/pages/portal/PortalToolkits.tsx` — refonte grille + détail + liste thumbnail + RPC counts
- `src/pages/admin/AdminToolkits.tsx` — auto-trigger + bandeau batch + bouton régen
- `src/hooks/useToolkitData.ts` (si helpers à exposer — sinon inline)
