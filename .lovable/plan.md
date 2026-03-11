

## Sprint 10 — Configuration IA parametrable (globale + par organisation)

### Objectif
Permettre de configurer le fournisseur IA, le modele, la cle API et les prompts systeme au niveau global et par organisation. Par defaut, Lovable AI est utilise sans configuration requise.

### Architecture

```text
Resolution dans les edge functions :
  1. ai_configurations WHERE organization_id = X AND is_active = true
  2. ai_configurations WHERE organization_id IS NULL AND is_active = true (global)
  3. Fallback → LOVABLE_API_KEY + gateway lovable (retrocompat)
```

### 1. Migration DB

**Table `ai_providers`** (reference des fournisseurs) :
- `id` uuid PK, `slug` text UNIQUE, `name` text, `base_url` text, `auth_header_prefix` text default 'Bearer', `is_active` boolean default true, `created_at`
- Seed : lovable, openai, google, anthropic, custom

**Table `ai_configurations`** (config globale ou par org) :
- `id` uuid PK, `organization_id` uuid nullable FK → organizations (NULL = global), `provider_id` uuid FK → ai_providers
- `api_key` text (chiffre cote serveur, jamais expose au client)
- `model_chat` text, `model_structured` text
- `prompts` jsonb `{ coach: "...", reflection: "...", deliverables_swot: "...", deliverables_bmc: "...", deliverables_pitch_deck: "...", deliverables_action_plan: "..." }`
- `max_tokens` int default 1000, `temperature` numeric default 0.7
- `is_active` boolean default true, `created_at`, `updated_at`
- UNIQUE constraint on `organization_id` (1 config par org, 1 config globale avec NULL)

**RLS** : Lecture/ecriture reservee a `is_saas_team()`. Les edge functions accedent via `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Edge Functions — Refactoring

Chaque edge function (`ai-coach`, `ai-reflection`, `ai-deliverables`) sera modifiee pour :
1. Recevoir `organization_id` optionnel dans le body
2. Query `ai_configurations` + `ai_providers` avec service_role client pour resoudre la config (org → global → fallback lovable)
3. Construire l'URL et les headers d'auth du provider dynamiquement
4. Utiliser le prompt systeme depuis la config DB si disponible, sinon le prompt hardcode actuel

Le resolver sera duplique inline dans chaque function (pas de shared imports en edge functions).

**Gestion Anthropic** : Si `auth_header_prefix` = 'x-api-key', utiliser `x-api-key` au lieu de `Authorization: Bearer`. Ajouter `anthropic-version` header.

### 3. Admin UI — Page Settings (`/admin/settings`)

Transformer le placeholder en page fonctionnelle avec 2 sections :

**Section Fournisseurs** : Liste des providers avec slug, name, base_url, statut actif. Ajout/edition inline.

**Section Configuration Globale** : 
- Select provider, champs model_chat / model_structured
- API key (input password, masque)
- Temperature (slider), max_tokens (input number)
- Prompts par outil : 6 textarea (coach, reflection, swot, bmc, pitch_deck, action_plan)
- Bouton sauvegarder → upsert `ai_configurations` WHERE `organization_id IS NULL`
- Info : "Sans configuration, Lovable AI est utilise par defaut."

### 4. Admin UI — Onglet IA par Organisation

Ajouter un 9e onglet "IA" dans `AdminOrganizationDetail.tsx` :
- Composant reutilisable `OrgAIConfigTab.tsx`
- Meme formulaire que la config globale mais scope a l'org
- Toggle "Utiliser une configuration specifique" (si desactive, l'org utilise la config globale)
- Upsert `ai_configurations` WHERE `organization_id = X`

### 5. Composants AI — Passer `organization_id`

- `ChatInterface.tsx` : recevoir `organizationId` prop, l'envoyer dans le body de `ai-coach`
- `ReflectionTool.tsx` : idem pour `ai-reflection`
- `DeliverablesTool.tsx` : idem pour `ai-deliverables`
- `AI.tsx` : importer `useOrg()` et passer `activeOrgId` aux composants

### Fichiers

| Action | Fichier |
|--------|---------|
| Migration | Tables `ai_providers` + `ai_configurations` + seed providers + RLS |
| Rewrite | `supabase/functions/ai-coach/index.ts` — resolver config dynamique |
| Rewrite | `supabase/functions/ai-reflection/index.ts` — idem |
| Rewrite | `supabase/functions/ai-deliverables/index.ts` — idem |
| Rewrite | `src/pages/admin/AdminSettings.tsx` — config IA globale + providers |
| Create | `src/components/admin/OrgAIConfigTab.tsx` — config IA par org |
| Edit | `src/pages/admin/AdminOrganizationDetail.tsx` — ajouter onglet IA |
| Edit | `src/components/ai/ChatInterface.tsx` — prop organizationId |
| Edit | `src/components/ai/ReflectionTool.tsx` — prop organizationId |
| Edit | `src/components/ai/DeliverablesTool.tsx` — prop organizationId |
| Edit | `src/pages/AI.tsx` — passer activeOrgId aux outils |

