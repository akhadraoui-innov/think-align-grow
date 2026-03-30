

# Plan — Partage public, LinkedIn, API de vérification + Module admin de pilotage des certificats

## Contexte

Actuellement : certificats générés et téléchargeables en PDF avec QR code pointant vers `/verify/{id}`, mais cette route n'existe pas. Aucun partage LinkedIn, aucune page publique de vérification, aucun module admin de gestion des certificats.

## Architecture cible

```text
┌─────────────────────────────────────────────────────┐
│                  PARTAGE PUBLIC                      │
│  /verify/:id  → Page publique (pas d'auth requise)  │
│  Edge function verify-certificate → API REST         │
│  Bouton LinkedIn Share → URL publique                │
│  Bouton Copier lien + Partage intranet              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              ADMIN — PILOTAGE CERTIFICATS            │
│  /admin/academy/certificates                         │
│  Dashboard KPI + Liste tous certificats              │
│  Paramétrage par parcours (templates, design)        │
│  Révocation + historique                             │
│  Config API/Webhook pour intranets clients           │
└─────────────────────────────────────────────────────┘
```

## 1. Page publique de vérification — `/verify/:id`

**Nouvelle page** `src/pages/VerifyCertificate.tsx` :
- Route publique (pas d'AppShell, pas d'auth)
- Appelle l'edge function `verify-certificate` avec l'ID
- Affiche : statut (valide/révoqué/introuvable), nom de l'apprenant, parcours, score, date, organisation
- Design premium avec branding GROWTHINNOV
- Si certificat révoqué → bandeau rouge "Certificat révoqué"

## 2. Edge function `verify-certificate`

**Nouveau** `supabase/functions/verify-certificate/index.ts` :
- GET `?id={certificateId}` → retourne les données publiques du certificat
- Pas de JWT requis (endpoint public)
- Requête `academy_certificates` + `academy_paths` + `profiles` via service role
- Retourne : `{ valid, holder_name, path_name, score, issued_at, revoked, organization_name }`
- Préparé pour être consommé par des intranets clients (JSON REST)

## 3. Partage LinkedIn + réseaux

**Modifier** `AcademyCertificates.tsx` et `PortalFormationsCertificates.tsx` :
- Bouton "Partager sur LinkedIn" avec URL `https://www.linkedin.com/sharing/share-offsite/?url={verifyUrl}`
- Bouton "Copier le lien" (déjà existant, à améliorer)
- Bouton "Partager" natif (Web Share API si disponible)
- Ajouter Open Graph meta tags dans la page `/verify/:id` pour un aperçu riche sur LinkedIn

## 4. Module admin de pilotage des certificats

**Nouvelle page** `src/pages/admin/AdminAcademyCertificates.tsx` :

### Onglet 1 — Dashboard
- KPIs : certificats émis (total, ce mois), score moyen, taux de certification, top parcours
- Graphique d'émission par mois (barres)
- Répartition par difficulté (donut)

### Onglet 2 — Liste des certificats
- DataTable complète : apprenant, parcours, score, date, statut (actif/révoqué)
- Actions : voir détail, révoquer, télécharger PDF
- Filtres : parcours, organisation, période, statut
- Export CSV

### Onglet 3 — Paramétrage
- Toggle `certificate_enabled` par parcours
- Score minimum requis pour certification (nouveau champ)
- Template de certificat (futur : choix de design)
- Texte personnalisable (titre, signature)

### Onglet 4 — API & Intégrations
- Documentation de l'endpoint de vérification
- Clé API pour intranets (préparation)
- Webhook URL configurable (préparation — champ en DB pour future utilisation)
- Exemple cURL, MCP endpoint, CLI

## 5. Base de données

**Migration** — Ajouter des colonnes à `academy_certificates` :
```sql
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS revoked_reason text;
ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS public_share_enabled boolean NOT NULL DEFAULT true;
```

**Migration** — Table de config certificats par parcours :
```sql
CREATE TABLE IF NOT EXISTS academy_certificate_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL UNIQUE,
  min_score integer NOT NULL DEFAULT 70,
  template_key text NOT NULL DEFAULT 'premium_gold',
  custom_title text,
  custom_signature text,
  webhook_url text,
  api_key_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE academy_certificate_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saas_manage_cert_config" ON academy_certificate_config FOR ALL TO authenticated USING (is_saas_team(auth.uid())) WITH CHECK (is_saas_team(auth.uid()));
```

**RLS** — Ajouter policy SELECT publique sur `academy_certificates` pour la vérification :
```sql
CREATE POLICY "public_verify_cert" ON academy_certificates FOR SELECT TO anon, authenticated USING (public_share_enabled = true);
```

## 6. Sidebar admin + Routes

- Ajouter entrée "Certificats" dans la sidebar Academy admin
- Route `/admin/academy/certificates` dans `App.tsx`
- Route `/verify/:id` HORS AppShell (page publique autonome)

## 7. Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/verify-certificate/index.ts` | **Créer** — API publique de vérification |
| `src/pages/VerifyCertificate.tsx` | **Créer** — Page publique avec OG tags |
| `src/pages/admin/AdminAcademyCertificates.tsx` | **Créer** — Module admin complet (4 onglets) |
| `src/App.tsx` | Ajouter routes `/verify/:id` (hors shell) + `/admin/academy/certificates` |
| `src/pages/AcademyCertificates.tsx` | Ajouter boutons LinkedIn + Share |
| `src/pages/portal/PortalFormationsCertificates.tsx` | Idem portail |
| `src/components/admin/AdminSidebar.tsx` | Ajouter lien Certificats |
| Migration SQL | `status`, `revoked_at`, `public_share_enabled` + table `academy_certificate_config` |
| `supabase/config.toml` | Ajouter `[functions.verify-certificate]` avec `verify_jwt = false` |

## 8. Ordre d'exécution

1. Migration DB (colonnes + table config + RLS)
2. Edge function `verify-certificate`
3. Page publique `VerifyCertificate.tsx` + route hors AppShell
4. Module admin `AdminAcademyCertificates.tsx` + sidebar + route
5. Boutons LinkedIn/Share dans les pages certificats (cabinet + portail)

