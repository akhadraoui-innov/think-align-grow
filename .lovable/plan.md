

## Génération IA de Toolkits complets

### Objectif
Ajouter une fonctionnalité "Générer un toolkit par IA" dans l'admin Toolkits. L'utilisateur fournit un contexte (thématique, objectifs, audience, nombre de piliers/cartes), et l'IA génère un toolkit complet avec la même structure que "Bootstrap in Business" : toolkit metadata, piliers, cartes (20 par pilier, 4 phases), quiz questions.

### Architecture

```text
┌─ AdminToolkits.tsx ─────────────────────────────┐
│  [Nouveau toolkit]  [✨ Générer par IA]          │
└──────────────────────────────────────────────────┘
         ↓ click
┌─ StepDialog (5 étapes) ─────────────────────────┐
│ 1. Thématique : nom, domaine, emoji              │
│ 2. Contexte : audience, objectifs, description    │
│ 3. Structure : nb piliers (6-10), cartes/pilier   │
│ 4. Options : langue, niveau, quiz oui/non         │
│ 5. Récap + lancer la génération                   │
└──────────────────────────────────────────────────┘
         ↓ submit
┌─ Edge Function: generate-toolkit ────────────────┐
│ 1. Crée le toolkit (draft)                        │
│ 2. Appelle Lovable AI (gemini-2.5-pro) avec       │
│    tool_calling pour structure JSON stricte        │
│ 3. Insert piliers, cartes, quiz en DB              │
│ 4. Retourne le toolkit_id                         │
└──────────────────────────────────────────────────┘
         ↓ success
   → Navigate vers /admin/toolkits/:id
```

### Modèle de référence (template toolkit)

Le prompt système inclura la structure exacte du "Bootstrap in Business" comme exemple :
- **10 piliers** (Thinking, Innovation, Business, Building, Profitability, Indicators, Managing, Finance, Gouvernance, Fundraising)
- **20 cartes par pilier**, chacune avec : title, subtitle, definition, action, kpi, phase (foundations/model/growth/execution), qualification, valorization, difficulty
- **4 phases** : Fondations (cartes 1-5), Modèle (6-10), Croissance (11-15), Exécution (16-20)
- **Quiz** : 3-5 questions par pilier avec options pondérées

L'IA devra produire un contenu de qualité professionnelle, pédagogique et actionnable, au même niveau que le référentiel.

### Edge Function `generate-toolkit`

Utilise `tool_calling` avec Lovable AI pour obtenir une sortie structurée :

```typescript
// Appel 1 : Générer piliers
tools: [{
  type: "function",
  function: {
    name: "create_toolkit_structure",
    parameters: {
      type: "object",
      properties: {
        pillars: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name, slug, description, subtitle, icon_name, color,
              target_audience, learning_outcomes, weight
            }
          }
        }
      }
    }
  }
}]

// Appel 2 (par pilier) : Générer 20 cartes
// Appel 3 (optionnel) : Générer quiz questions
```

Découpage en plusieurs appels AI pour respecter les limites de tokens et assurer la qualité par pilier.

### Progression en temps réel

Le frontend poll le statut via un état local pendant la génération :
- "Création du toolkit..."
- "Génération du pilier 3/8..."
- "Import des cartes..."
- "Génération du quiz..."
- "Terminé !"

Pour simplifier, la edge function est appelée une fois et retourne le résultat complet. Le frontend affiche un loader avec animation pendant l'attente (30-60s).

### Fichiers

| Fichier | Action |
|---------|--------|
| `supabase/functions/generate-toolkit/index.ts` | Créer — edge function IA multi-étapes |
| `supabase/config.toml` | Ajouter entry function |
| `src/pages/admin/AdminToolkits.tsx` | Ajouter bouton "Générer par IA" + StepDialog 5 étapes |
| `src/hooks/useAdminToolkits.ts` | Ajouter mutation `generateWithAI` |

### Sécurité
- La edge function vérifie l'auth et le rôle `is_saas_team` avant d'exécuter
- Utilise `SUPABASE_SERVICE_ROLE_KEY` pour les inserts DB (bypass RLS)
- Résout la config AI via `resolveAIConfig` (même pattern que ai-coach)

