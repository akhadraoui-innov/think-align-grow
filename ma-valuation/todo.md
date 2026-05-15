# KHALEO Valuation — Todo

## Infrastructure & BDD
- [x] Schéma Drizzle 25 tables multi-tenant (organizations, users étendu, projects, project_members, audit_log)
- [x] Module 1 tables : historical_periods, income_statement, balance_sheet, cash_flow, operational_kpis, restatements
- [x] Module 2 tables : strategic_orientations, strategic_axes, strategic_objectives, strategic_levers
- [x] Module 3 tables : business_plans, bp_assumptions, bp_projections, bp_sensitivity
- [x] Module 4 tables : valuation_runs, valuation_params, valuation_results, sector_multiples, comparable_transactions
- [x] Module 5 tables : simulations, simulation_levers, simulation_scenarios
- [x] Migration BDD (pnpm db:push)

## Design System
- [x] Palette navy #0A1628 / bleu #1A85FF / or #C9A84C dans index.css
- [x] Typographies Montserrat + Inter via Google Fonts
- [x] Thème sombre global cohérent
- [x] Composants financiers réutilisables (KpiCard, FinancialRow, AiSuggestion, StatusBadge, DeltaValue)

## Auth & Multi-tenant
- [x] Extension du rôle utilisateur : owner / analyst / client / viewer / admin
- [x] Routers tRPC : organizations, projects, project_members
- [x] Middleware ownerOrAnalystProcedure sur toutes les mutations
- [x] Gestion des permissions par rôle

## Layout & Navigation
- [x] Sidebar fixe rétractable avec 7 entrées (Dashboard + 5 modules + Exports)
- [x] AppLayout wrapping toutes les pages authentifiées
- [x] Breadcrumb contextuel par module
- [x] Top bar avec indicateur Live, bouton IA, notifications
- [x] Page de login institutionnelle

## Dashboard Projets
- [x] Liste des projets avec statuts et complétude
- [x] Formulaire de création/édition de projet
- [x] Sélecteur de secteur d'activité
- [x] Indicateurs de progression par module
- [x] Actions rapides (archiver, supprimer)

## Module 1 — Données Historiques
- [x] Sélecteur de mode (Rapide / Structuré / Expert)
- [x] Formulaire compte de résultat (revenue → net_income)
- [x] Formulaire bilan (actif / passif)
- [x] Formulaire flux de trésorerie
- [x] KPIs opérationnels
- [x] Retraitements normatifs (mode Expert)
- [x] Calculs automatiques (marges, ratios)
- [x] Analyse IA contextuelle (panneau latéral)

## Module 2 — Stratégie & Leviers
- [x] Arborescence Orientations → Axes → Objectifs → Leviers
- [x] CRUD pour chaque niveau de l'arborescence
- [x] Formulaire d'impact chiffré par levier
- [x] Vue synthèse des impacts sur la valorisation
- [x] Statuts des leviers (identified / validated / in_progress / done)
- [x] Suggestion IA d'impact chiffré (JSON structuré)

## Module 3 — Business Plan
- [x] Sélecteur de mode et horizon (3-5 ans)
- [x] Saisie des hypothèses par catégorie
- [x] Projections P&L / bilan / flux
- [x] Scénarios base / haut / bas
- [x] Analyse de sensibilité
- [x] Graphiques de projection (Chart.js)
- [x] Analyse IA de crédibilité

## Module 4 — Valorisation
- [x] Méthode EBITDA multiple
- [x] Méthode DCF
- [x] Méthode ANR
- [x] Comparables boursiers
- [x] Transactions comparables
- [x] Méthode rendement
- [x] Goodwill
- [x] Synthèse pondérée multi-méthodes
- [x] Football field chart (fourchettes EV)
- [x] Narrative IA institutionnelle

## Module 5 — Simulation Inverse
- [x] Saisie objectif de valorisation cible
- [x] Calcul du gap à combler
- [x] Activation/désactivation des leviers en temps réel
- [x] Mise à jour temps réel de l'EV résultante
- [x] Scénarios de combinaisons
- [x] Analyse IA de faisabilité

## IA Contextuelle
- [x] Panneau latéral rétractable (300px, animé)
- [x] Suggestions contextuelles M1 (ratios anormaux, tendances)
- [x] Suggestions contextuelles M2 (benchmarks leviers)
- [x] Suggestions contextuelles M3 (crédibilité BP)
- [x] Suggestions contextuelles M4 (narrative valorisation)
- [x] Suggestions contextuelles M5 (faisabilité objectif)

## Exports
- [x] Export Excel via ExcelJS (Cover, Valorisation, BP, Historique)
- [x] Export PDF via window.print (rapport institutionnel CSS print)
- [x] Export PowerPoint via PptxGenJS (5 slides Bloomberg)
- [x] Sélecteur de périmètre d'export
- [x] Historique des exports dans la session

## Tests
- [x] Tests Vitest auth.logout (1 test)
- [x] Tests Vitest calculs de valorisation (EBITDA, DCF, Goodwill)
- [x] Tests Vitest simulation inverse (gap, couverture)
- [x] Tests Vitest business plan (TCAM)
- [x] Tests Vitest permissions multi-tenant (viewer/analyst/owner)
- [x] TypeScript : 0 erreur (pnpm check)

## Backlog — Sprints suivants
- [ ] Gestion des membres d'organisation (invitations, rôles)
- [ ] Page paramètres organisation
- [ ] Import de données depuis Excel/CSV
- [ ] Multiples sectoriels — base de données enrichie
- [ ] Transactions comparables — base de données enrichie
- [ ] Notifications temps réel
- [ ] Mode collaboration multi-utilisateurs simultanés
- [ ] Audit trail complet (journal des modifications)
- [ ] Export consolidé (dossier complet multi-format)
- [ ] Intégration données de marché (cours boursiers, multiples live)
- [ ] Templates de BP par secteur
- [ ] Comparaison entre plusieurs runs de valorisation
