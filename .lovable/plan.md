

# Plan consolidé — Rôles & Plans paramétrables + Guide stratégique + Devis IA

## Vue d'ensemble

3 ajouts majeurs au module Business & Revenue :

1. **Sous-onglet "Rôles & Plans"** dans Pricing — pricing paramétrable par rôle avec plans dédiés, accès modules, quotas granulaires
2. **Onglet "Guide"** — documentation stratégique GTM, revenue management, méthodologies
3. **Onglet "Devis IA"** — configurateur multi-modèle avec génération IA de propositions commerciales

---

## 1. Types et defaults dans `businessConfig.ts`

Nouveaux types :

```typescript
interface RolePlanAccess {
  moduleId: string; enabled: boolean;
  quotaType: "unlimited" | "monthly" | "yearly" | "per_use";
  quotaLimit: number | null;
}

interface RolePlan {
  id: string; name: string;
  billing: "monthly" | "annual" | "usage";
  pricePerUser: number; creditsIncluded: number; creditExtraPrice: number;
  moduleAccess: RolePlanAccess[];
  limits: { parcours | challenges | workshops | practices | projects | aiCalls: number | null };
}

interface PricingRole {
  id: string; name: string; description: string; icon: string;
  plans: RolePlan[]; defaultPlanId: string;
  valueLevel: "strategic" | "operational" | "consumption";
}

interface SaleModel { id; label; description; includesSetup; includesServices; }
interface QuoteRoleConfig { roleId; planId; count: number; }
```

4 rôles par défaut (Décideur/Admin, Manager, Utilisateur, Apprenant externe) avec 2 plans chacun (8 plans total), chacun avec accès modules et quotas configurés par rapport à `DEFAULT_MODULES`.

5 modèles de vente : SaaS pur, SaaS + Conseil, Academy Groupe, CaaS, Partnership/White-label.

---

## 2. Sous-onglet "Rôles & Plans" dans `BusinessPricingTab.tsx`

7ème sous-onglet (icon Users) ajouté au TabsList existant :

- **Section A — Liste des rôles** : cards CRUD (nom, description, icon, valueLevel éditables), bouton "Ajouter un rôle"
- **Section B — Plans du rôle sélectionné** : table éditable (nom, billing, prix/user, crédits inclus, prix crédit extra, limites d'usage). Grille d'accès modules avec toggles + type quota + limite.
- **Section C — Simulateur de deal** : table Rôle × Plan × Nb users avec calcul MRR/ARR temps réel

---

## 3. `BusinessGuideTab.tsx` (nouveau)

8 sections en `Accordion` :

| Section | Contenu clé |
|---------|------------|
| Mode d'emploi | Workflow onglet par onglet |
| Go-to-Market | ICP → Channels → Messaging → Launch → Iterate |
| Revenue Management | Quand seat vs usage vs hybrid vs CaaS |
| Modèles de vente | 5 combinaisons (SaaS, SaaS+CaaS, Academy, Partnership, White-label) |
| Valeur ajoutée | Où la valeur se crée : setup vs abo vs usage, pricing par rôle |
| Scalabilité SaaS | NRR, Magic Number, Rule of 40, seuils |
| MEDDIC | Scoring Enterprise 6 critères |
| Risques marché IA | Tokens, agents, build vs buy, AI Act |

UI : `Accordion` + `Card` + `Badge` + callouts tips (Lightbulb icon).

---

## 4. Edge function `business-quote/index.ts` (nouveau)

Suit le pattern `ai-coach` :
- CORS headers manuels (comme les autres fonctions)
- Validation body (prospectName, segment requis)
- System prompt expert revenue management / sales engineer
- Appel Lovable AI Gateway (`google/gemini-2.5-flash`) via `LOVABLE_API_KEY`
- Retourne `{ quote: string }` markdown
- Gestion 429/402

---

## 5. `BusinessQuoteTab.tsx` (nouveau)

**A — Contexte prospect** : nom, segment (select), nb users (slider), enjeux (textarea)

**B — Modèle de vente** : radio depuis `DEFAULT_SALE_MODELS`

**C — Composition par rôle** : pour chaque rôle dans `DEFAULT_PRICING_ROLES`, sélection du plan + nb users. Totaux MRR/ARR temps réel.

**D — Setup & Services** : checkboxes setup fees + services si modèle inclut CaaS. Durée engagement (12/24/36 mois) avec remises.

**E — Récapitulatif financier** : MRR total (par rôle), ARR, setup one-shot, services, total année 1, marge estimée.

**F — Génération IA** : bouton → edge function → rendu markdown (executive summary, proposition de valeur, détail offre, ROI, conditions). Boutons Copier + Régénérer.

---

## 6. `AdminBusiness.tsx` (modifier)

Ajouter 2 onglets :
- `{ value: "guide", label: "Guide", icon: BookOpen }`
- `{ value: "quote", label: "Devis IA", icon: FileText }`

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `businessConfig.ts` | Ajouter 5 interfaces + `DEFAULT_PRICING_ROLES` (4 rôles, 8 plans), `DEFAULT_SALE_MODELS` (5) |
| `BusinessPricingTab.tsx` | Ajouter sous-onglet "Rôles & Plans" avec CRUD + simulateur deal |
| `BusinessGuideTab.tsx` | **Créer** — 8 sections accordéon |
| `BusinessQuoteTab.tsx` | **Créer** — Configurateur multi-modèle + calcul + IA |
| `business-quote/index.ts` | **Créer** — Edge function |
| `AdminBusiness.tsx` | Ajouter 2 onglets |

## Ordre d'exécution
1. Types + defaults (`businessConfig.ts`)
2. Sous-onglet Rôles & Plans (`BusinessPricingTab.tsx`)
3. Guide (`BusinessGuideTab.tsx`)
4. Edge function (`business-quote/index.ts`)
5. Devis IA (`BusinessQuoteTab.tsx`)
6. Intégration (`AdminBusiness.tsx`)

