

# Refonte PPTX — Style BCG × Atlassian

## Problème

Le deck actuel est surchargé : fonds navy, trop de texte, trop de sections par slide. Un deck BCG est l'inverse — fonds blancs, 1 message par slide, typographie aérée, données isolées visuellement.

## Direction visuelle

- **Fond** : blanc pur `FFFFFF` partout, sauf cover et back cover (navy `0F1729`)
- **Texte** : charcoal `2D3748` (titres), gris `64748B` (corps)
- **Accent unique** : coral `E8613C` pour les chiffres clés, barres, highlights
- **Accent secondaire** : bleu doux `3B82F6` pour les icones et liens
- **Lignes** : gris très léger `E2E8F0` pour séparateurs
- **Typo** : Georgia 36pt titres, Calibri Light 14pt corps
- **Règle BCG** : max 3 éléments visuels par slide, 1 takeaway par slide
- **Images IA art** : conservées mais utilisées en petit format (accent visuel coin bas-droit), pas en plein fond

## Structure révisée (~30 slides)

### Core (1-14)
1. **Cover** — fond navy, "heeplab" blanc 60pt, baseline petit, 1 image IA art en overlay transparent
2. **Le constat** — fond blanc, 3 stats en grand (72pt coral) avec légendes grises
3. **Notre vision** — 1 phrase en Georgia 28pt centrée, rien d'autre
4. **3 piliers** — 3 colonnes épurées : icone cercle + titre bold + 2 lignes description
5. **Dashboard** — screenshot centré avec ombre légère, titre simple au-dessus
6. **20 Fonctions** — grille 4×5 minimaliste (nom + département en petit)
7. **6 Profils** — 6 cards blanches avec bordure gauche coral, nom + 1 ligne
8. **Cartographie** — screenshot centré, légende en dessous
9. **Parcours** — schéma linéaire horizontal 5 étapes (cercles + flèches)
10. **Contenu IA** — 2 colonnes : gauche = exemple callout stylisé, droite = description
11. **Quiz 6 types** — grille 2×3 : icone + nom du type + 1 ligne
12. **Déploiement** — flow horizontal 4 étapes (icones minimalistes)
13. **Pourquoi Heeplab** — 4 stats en grand format (nombre coral + texte gris)
14. **Contact** — fond navy, coordonnées centrées, image IA art petit format

### Annexes (15-30) — même principe épuré
Chaque annexe : titre en haut, 1 screenshot ou schéma centré, 3-5 bullet points max, fond blanc.

15-18. Toolkits (liste, détail 7 onglets, IA chat)
19-20. Design Innovation
21-26. Academy (dashboard, carto, fonctions, personae, parcours, contenu/quiz)
27-28. Campagnes & Suivi
29. Organisations & Utilisateurs
30. **Back cover** — fond navy, logo, baseline

## Exécution

1. Réécrire le script pptxgenjs avec fond blanc, espacement généreux, max 3 éléments/slide
2. Réutiliser les 6 images IA art existantes en format réduit (accent, pas fond)
3. Réutiliser les screenshots existants
4. Générer le PPTX v2
5. QA visuelle complète

**Output** : `/mnt/documents/Heeplab_Presentation_Premium_v2.pptx`

