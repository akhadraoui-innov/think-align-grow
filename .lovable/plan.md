

# Lot E5 → "Studio" — Refonte UI générationnelle

Pas un widget. Un **langage d'interface** : opinionné, signature, world-class. On dépasse la commande initiale (widget mail) pour livrer une **transformation cohérente** dont le widget Email n'est qu'une instance.

---

## Parti pris (non négociables)

1. **Command Bar comme colonne vertébrale** (façon Linear/Raycast) — toute action est à 1 touche (`⌘K`), 1 geste, ou 1 raccourci sémantique (`g e` = go emails, `g h` = health, `n` = nouveau).
2. **Header unifié "OmniBar"** — un seul rail de boutons identiques entre Admin et Portal, gauche=identité, centre=navigation, droite=signaux (Mail, Bell, Credits, Avatar). Tous les signaux suivent **le même contrat visuel** (icône 18px, badge 9px, dropdown 380px glassmorphique éditorial).
3. **Glassmorphisme assumé, pas timide** : `backdrop-blur(40px) saturate(180%)`, fond translucide multi-couches, bord lumineux 1px hairline, ombre stratifiée (proche/lointaine).
4. **Densité éditoriale** : typographie Space Grotesk en titrage, micro-caps (10px tracking 0.15em) pour labels, chiffres en variant tabulaire (`font-feature-settings: "tnum"`), aucune compromission sur les marges.
5. **Mouvement signature** : transitions sur courbe `cubic-bezier(0.32, 0.72, 0, 1)` (Apple-like), durées 180ms/280ms/420ms strictes, `prefers-reduced-motion` respecté.
6. **Couleur signal** : pillar colors deviennent le système de **statut sémantique** (innovation=info, growth=success, business=warn, thinking=danger), exit emerald/amber/rose ad hoc.

---

## Livrable 1 — Système de Design "Studio"

`src/styles/studio.css` (importé dans `index.css`) introduit :

- **Surfaces** : 4 niveaux glassmorphiques (`--surface-1` à `--surface-4`) avec saturation et blur progressifs.
- **Hairline borders** : `--hairline: 0 0% 100% / 0.08` pour bord interne lumineux + `border` standard pour bord externe.
- **Shadows stratifiées** : `--shadow-sticker` (carte flottante), `--shadow-pop` (dropdown), `--shadow-monolith` (modal/command bar) — chacune en double-couche (proche dure + lointaine douce).
- **Animation tokens** : `--ease-out-quart`, `--ease-spring`, `--duration-fast/base/slow`.
- **Easing utilities Tailwind** : `ease-studio`, `ease-spring` exposés via `tailwind.config.ts`.
- **Keyframes** : `studio-pop-in` (scale 0.96 + opacity + blur 8px→0), `studio-shimmer` (loading), `studio-tick` (badge increment).

## Livrable 2 — `OmniHeader` partagé

`src/components/shell/OmniHeader.tsx` remplace le `<header>` actuel des deux shells.

- API : `<OmniHeader variant="portal|admin" left={...} center={...} signals={[...]} />`.
- Hauteur 56px portal / 48px admin, fond `surface-2`, bord-bas hairline.
- Contient un slot **SignalRail** qui rend les widgets (Search trigger, Mail, Bell, Credits, Avatar) avec spacing strict 4px et règle de séparation visuelle (chip vs ghost).
- `PortalShell.tsx` et `AdminShell.tsx` réécrits pour consommer `OmniHeader` (élimine la duplication header).

## Livrable 3 — `SignalWidget` (factorise Bell/Mail)

`src/components/shell/SignalWidget.tsx` — primitive qui gouverne **toutes** les cloches.

- Props : `icon`, `label`, `count`, `tone` (`neutral|info|warn|danger`), `dropdown` (render-prop), `pulse` (boolean).
- Badge animé via `studio-tick` lors d'un increment (compare prev/next via `useRef`).
- Dropdown ancrée à droite, largeur 384px, header en micro-caps + action secondaire, footer avec lien "voir tout" + raccourci clavier visible (kbd).
- `NotificationsDropdown` réécrit comme `<SignalWidget>` avec render-prop.
- `EmailWidget` créé comme `<SignalWidget>` avec render-prop (cf. Livrable 4).

## Livrable 4 — `EmailWidget` (Admin + Portal)

Hook `useEmailWidget(variant)` :

- **Admin** : `email_send_log` agrégé 24h (sent/failed/bounced/opened), `get_priority_lane_metrics`, `get_email_provider_health`, count `email_security_flags` non revus. Realtime sur `email_send_log` filtré `status in (failed,dlq)`.
- **Portal** : 5 derniers emails reçus via `recipient_email = user.email`, flag `localStorage:email-widget-last-seen` pour les non lus.

Rendu :

- **Admin** — Header "EMAIL STUDIO • 24H". Grille 3 KPI tabulaires (Sent / Failed / Bounced) avec mini-sparkline 24 buckets (SVG inline). Section "Lanes" avec 3 jauges horizontales (transactional/marketing/bulk, couleur signal selon backlog). Liste 3 derniers échecs (template • destinataire tronqué • raison). Footer raccourcis : Composer (`g c`), Templates (`g t`), Logs (`g l`), Health (`g h`).
- **Portal** — Header "VOTRE BOÎTE". Liste 5 emails (sujet bold • from • time-ago micro). Footer : Préférences (`g p`).

## Livrable 5 — `CommandBar v2`

Réécriture de `CommandPalette.tsx` :

- Ouverture en **center-modal** (max-w-2xl, top-20%) avec `studio-pop-in` (scale + blur fade).
- Sections : **Suggestions** (contextuelles à la route active), **Aller à** (toutes routes), **Email**, **Sécurité**, **Academy**, **Aide**.
- **Raccourcis sémantiques** type Linear : `g e` (go emails), `g h` (health), `g a` (academy), `g w` (workshops). Affichés en kbd à droite de chaque item.
- **Actions inline** : "Composer email…", "Replay DLQ…", "Marquer toutes notifs lues" exécutent une mutation directement (sans navigation).
- Footer : ligne d'aide avec `↑↓ naviguer • ↵ exécuter • ⎋ fermer • ⌘K basculer`.
- Indicateur "Pro tip" rotatif en bas (3 astuces qui tournent toutes les 8s).

## Livrable 6 — Micro-interactions transversales

- **Numbers ticker** : composant `<Tick value={n} />` qui anime les chiffres en roulement (CountUp custom 280ms).
- **Skeleton shimmer Studio** : remplacement des `<Skeleton>` par variante shimmer dégradé hairline.
- **Toast Studio** : surcharge de `sonner` via `<Toaster richColors closeButton position="bottom-right" />` avec classes `font-display` + glassmorphisme.
- **Focus rings** : `--ring` exploité via `focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2` global → tous les boutons interactifs ont un focus signature.

## Livrable 7 — Audit & docs

- `docs/releases/v2.7.0-studio.md` — manifeste design avec captures avant/après.
- `mem://style/studio-design-system.md` — règles : surfaces, easing, tokens, micro-caps, ticker.
- Test responsive : 384×709 (mobile actuel) → OmniHeader collapse en `OmniHeaderMobile` (logo + ⌘K + cloche unifiée fusionnant Mail+Bell sous un swipe-tab).
- Test a11y : focus-visible, `aria-label` sur tous SignalWidget, `prefers-reduced-motion` désactive `studio-pop-in`/`studio-tick`.

---

## Détails techniques

- **Pas de dépendance externe ajoutée** (CountUp et ticker en-house, ~30 LOC).
- **Tokens CSS** : tout sous `--studio-*` pour éviter collisions avec tokens existants. Le `.portal` scope override les surfaces avec teinte bleu signature.
- **Performance** : `useEmailWidget` `staleTime: 30s`, channel realtime unique par variant, cleanup propre.
- **Backward compat** : `NotificationsDropdown` exporte toujours pareil (signature identique), implémentation interne change.
- **Permissions** : `EmailWidget` admin gated par `email.logs.view` via `usePermissions()`.

## Ce qu'on ne fait PAS dans ce lot

- Pas de dark mode complet (préparation tokens uniquement, switch viendra Lot E6).
- Pas de refonte des pages admin internes (focus shell + signaux).
- Pas de redesign sidebar (reste cohérente, juste les hairlines homogénéisées).

## Audit final

1. ⌘K depuis n'importe où ouvre la CommandBar v2 stylée.
2. Mail widget admin : injection d'un échec en DB → ticker badge + toast + apparition en liste dans <2s.
3. Mail widget portail : envoi d'un email reçu → notif realtime + badge.
4. Bell widget : continue de fonctionner sans régression (même API).
5. Mobile 384px : OmniHeader collapse, signaux fusionnés accessibles.
6. `prefers-reduced-motion: reduce` : animations sup­primées, transitions ramenées à 0ms.
7. Linter Supabase 0 finding, 0 régression console.

