

# Plan — Page dédiée devis premium + calculs multi-années + synthèse engagements

## 3 chantiers

### 1. Page dédiée `/admin/business/quote-preview` avec rendu document corporate

**Nouveau fichier** : `src/pages/admin/AdminQuotePreview.tsx`

- Layout plein écran `AdminShell`, conteneur centré max-width 900px (format A4)
- Header corporate : prospect, segment, date, version, statut (badges)
- Toolbar sticky : Retour, Copier, Régénérer, Éditer/Aperçu toggle, Sauvegarder (si draft), Marquer envoyé
- Corps : `EnrichedMarkdown` avec typographie premium (prose classes, spacing adapté)
- Mode édition : `Textarea` monospace plein écran
- Sidebar financière compacte : MRR, ARR, Setup, Year1/Year2/Year3, Total contrat
- Données passées via `useNavigate({ state })` depuis le configurateur
- Bouton "Voir le devis" dans `BusinessQuoteTab` remplace l'aperçu inline actuel

### 2. Calculs financiers corrigés : one-shot vs récurrent + multi-année

**Modifier** `BusinessQuoteTab.tsx` (totals) :

Catégoriser les services sélectionnés :
- **One-shot** : `priceModel` = "Jour" | "Forfait" | "Par participant" | "Commission" → comptés une seule fois en Y1
- **Récurrent** : `priceModel` = "Mensuel" → × 12 par année

Nouveaux totaux :
```
servicesOneShot = somme services one-shot sélectionnés
servicesMonthly = somme services mensuels sélectionnés
year1 = ARR + setup + servicesOneShot + (servicesMonthly × 12)
year2 = (engagement >= 24) ? ARR + (servicesMonthly × 12) : 0
year3 = (engagement >= 36) ? ARR + (servicesMonthly × 12) : 0
totalContrat = year1 + year2 + year3
```

**Modifier** `business-quote/index.ts` (prompt IA) :
- Envoyer les détails one-shot vs récurrent séparément
- Imposer un tableau d'investissement par année dans le prompt
- Exiger la distinction explicite "prestations uniques (Y1)" vs "prestations récurrentes (mensuelles)"
- Si engagement > 12 mois, demander un breakdown Year 1 / Year 2 / Year 3

### 3. Onglet "Synthèse Engagements" — suivi interne par version

**Nouveau sous-onglet** dans `BusinessQuoteTab` ou section dédiée :

- Tableau récapitulatif de tous les devis `sent` groupés par prospect
- Colonnes : Prospect, Version, Date envoi, MRR, ARR, Setup, Total contrat, Engagement (mois)
- Ligne de totaux : pipeline total engagé, MRR cumulé, ARR cumulé
- Comparaison entre versions d'un même prospect (delta MRR, delta services)
- Filtre par statut (draft/sent), par segment, par date

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminQuotePreview.tsx` | **Créer** — Page document corporate |
| `src/components/admin/business/BusinessQuoteTab.tsx` | **Modifier** — Calculs multi-année, navigation preview, onglet synthèse |
| `supabase/functions/business-quote/index.ts` | **Modifier** — Prompt enrichi one-shot/récurrent + breakdown annuel |
| `src/App.tsx` | **Modifier** — Route `/admin/business/quote-preview` |

## Ordre
1. Calculs financiers corrigés (one-shot vs récurrent, Y1/Y2/Y3)
2. Prompt IA enrichi (edge function)
3. Page dédiée `AdminQuotePreview.tsx` + route
4. Onglet synthèse engagements
5. Connecter le tout (navigation, sauvegarde depuis preview)

