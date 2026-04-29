
## Action : Documentation uniquement (aucun code modifié)

### 1. Créer `docs/releases/v2.9.7-portal-admin-parity-audit.md`
Contenu : verdict de l'audit du jour
- Méthode (extraction Python sur 5 axes : edge functions, tables Supabase, toasts, navigations, boutons)
- Résultats par paire (16 paires auditées)
- Divergences confirmées comme volontaires (UCM quotas admin-only, Practice filtering portal, Workshops/Challenges entry pages)
- Seul écart cosmétique restant : `missingCount` dans AcademyPaths (admin only) — non bloquant
- Conclusion : système sain, v2.9.5 et v2.9.6 correctement répliquées

### 2. Mettre à jour `docs/releases/README.md`
Ajout d'une ligne pour v2.9.7 dans l'index.

### 3. Mettre à jour `mem://technical/portal-architecture-duplication`
Ajouter une checklist obligatoire en tête du fichier :
> **CHECKLIST DE PARITÉ (obligatoire à chaque PR touchant `src/pages/admin/*` ou `src/pages/portal/*`)**
> 1. Identifier le pendant Admin↔Portal (mêmes suffixes : `AcademyPaths` ↔ `AcademiePaths`, etc.)
> 2. Répliquer : CTA, appels `supabase.functions.invoke`, toasts d'état, cache-busting d'images, gestion 429/402
> 3. Documenter tout écart volontaire (ex : tables admin-only `ucm_quota_usage`)
> 4. Tester visuellement les deux surfaces avant merge

### Hors scope
- Aucun fichier `.tsx` modifié
- Pas de port du `missingCount` (jugé légitime côté admin uniquement)
- Pas de nouveau bouton de régénération dans ModuleDetail/PathDetail (nécessite décision produit séparée)
