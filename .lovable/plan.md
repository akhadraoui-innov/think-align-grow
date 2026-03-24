

# Heeplab — Présentation Corporate Premium PPTX

## Design Philosophy : "Orbital Precision"

Un mouvement visuel où chaque élément est placé avec la rigueur d'un ingénieur spatial et la sensibilité d'un directeur artistique. Formes géométriques pures, aplats de couleur profonds (navy `0F1729`, coral signature `E8613C`, blanc cassé), typographie fine et espacée. Les images IA art servent d'ancres émotionnelles — abstractions lumineuses évoquant la transformation, le cerveau, les réseaux neuronaux — sans jamais être illustratives. Le texte est rare, monumental ou microscopique, jamais entre les deux.

## Pipeline

1. **Design philosophy** → `/mnt/documents/heeplab_philosophy.md`
2. **Générer 6-8 images IA artistiques** via `google/gemini-3-pro-image-preview` (abstractions corporate : neural networks, growth, transformation, learning pathways)
3. **Capturer 6+ screenshots** des pages admin clés (Dashboard, Map, Toolkit Detail, Path Detail, Functions, Personae)
4. **Générer le PPTX** via pptxgenjs (~35 slides)
5. **QA visuelle** via LibreOffice → PDF → images → inspection

## Structure des slides (~35)

### Core (1-14)
1. **Cover** — "heeplab" en grand, baseline "by Growthinnov — Ammar Khadraoui", image IA abstraite plein fond
2. **Le constat** — Chiffres marché formation IA entreprise, image IA art
3. **Notre vision** — Proposition de valeur en 1 phrase monumentale
4. **3 piliers** — Toolkits / Design Innovation / Academy, icones + descriptions courtes
5. **Dashboard plateforme** — Screenshot + callouts
6. **20 Fonctions métier** — Screenshot + description
7. **6 Profils comportementaux** — Radar visuel, noms corporate
8. **Cartographie relationnelle** — Screenshot map + description
9. **Parcours sur mesure** — Timeline visuelle, screenshot path detail
10. **Contenu IA Premium** — Exemples callouts 💡📜⚠️, screenshot contenu
11. **Quiz interactifs 6 types** — Icones par type, description
12. **Déploiement & Campagnes** — Workflow visuel
13. **Pourquoi Heeplab** — 4 différenciateurs avec stats
14. **Contact / CTA** — Coordonnées, image IA art

### Annexes détaillées (15-35)
15. **Annexe : Admin Dashboard** — KPIs, graphiques Recharts, alertes
16. **Annexe : Toolkits — Liste** — DataTable, création manuelle 3 étapes, génération IA SSE
17. **Annexe : Toolkit — Page détail** — 7 onglets (Infos, Piliers, Cartes, Challenges, Game Plans, Quiz, Organisations)
18. **Annexe : Toolkit — IA Chat** — Dialog conversationnel, prompts suggérés, Gemini Pro
19. **Annexe : Design Innovation — Liste** — Templates, création 3 étapes
20. **Annexe : Challenge — Page détail** — 4 onglets (Infos, Sujets/Slots, Sessions, Analyses)
21. **Annexe : Academy — Command Center** — 6 KPIs, bar chart, heatmap, timeline
22. **Annexe : Academy — Cartographie** — Flow 4 colonnes, filtres, panel latéral
23. **Annexe : Academy — Fonctions** — 3 modes création IA, page détail tabs
24. **Annexe : Academy — Personae** — 10 traits radar, tags, textes, déclinaison org
25. **Annexe : Academy — Parcours liste** — Grille/tableau, filtres, stats
26. **Annexe : Academy — Parcours détail** — Timeline modules, preview contenu/quiz, batch génération
27. **Annexe : Academy — Contenu IA** — Prompts pro, EnrichedMarkdown, illustrations
28. **Annexe : Academy — Quiz 6 types** — MCQ, Vrai/Faux, Ordonner, Associer, Compléter, Scénario
29. **Annexe : Academy — Campagnes** — CRUD, timeline, organisations
30. **Annexe : Academy — Suivi** — DataTable, KPIs, progression
31. **Annexe : Organisations** — 8 onglets détaillés
32. **Annexe : Utilisateurs** — 8 onglets, profils, activité
33. **Annexe : Rôles & Permissions** — Matrice, comparaison
34. **Annexe : Paramètres IA** — Prompts, modèles, configurations
35. **Back cover** — Logo, baseline, image IA art

## Images IA artistiques (6-8)

Prompts pour `google/gemini-3-pro-image-preview` :
1. Abstract neural network with warm coral and deep navy tones, corporate art, minimalist
2. Human silhouette merging with data streams, transformation metaphor, dark background
3. Geometric learning pathway with glowing nodes, abstract corporate art
4. Brain-like organic structure with technological elements, warm lighting
5. Abstract growth visualization, ascending geometric forms, coral accent
6. Network of connected minds, collaborative intelligence, dark elegant

## Palette

- **Navy profond** : `0F1729`
- **Coral signature** : `E8613C`
- **Blanc cassé** : `F8F7F4`
- **Gris texte** : `94A3B8`
- **Accent violet** : `7C5CFC`

## Typographie

- Titres : Georgia Bold (système PPTX)
- Corps : Calibri Light
- Accents : Calibri uppercase tracking large

## Étapes d'exécution

1. Écrire `heeplab_philosophy.md` dans `/mnt/documents/`
2. Capturer screenshots des pages admin via browser (Dashboard, Toolkit Detail, Map, Path Detail, Functions, Personae)
3. Générer les 6 images IA art via edge function ou script
4. Écrire le script pptxgenjs complet (~35 slides) dans `/tmp/`
5. Générer le PPTX dans `/mnt/documents/`
6. Convertir en PDF → images pour QA
7. Inspecter chaque slide, corriger, re-générer

