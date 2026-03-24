

# Heeplab PPTX v3 — BCG Style + Contenu Rédactionnel Premium

## Problème

Les versions précédentes avaient du texte générique, des bullet points creux, des placeholders. Le contenu doit être rédigé comme un deck BCG : argumenté, chiffré, avec une narration stratégique.

## Approche

1. **Rédiger le contenu complet** de chaque slide via IA (prompts dédiés par slide) avant de générer le PPTX
2. **Capturer des screenshots** réels des pages admin pour les mockups
3. **Générer 6 images IA art** en grand format
4. **Assembler le PPTX** avec layouts variés (8 types) et contenu premium

## Pipeline

### Etape 1 : Rédaction du contenu (via AI gateway)

Générer un document JSON structuré avec le texte complet de chaque slide :
- **Slide 2 "Le constat"** : stats sourcées (marché formation corporate 2025, taux d'échec des programmes classiques, gap compétences IA), paragraphes argumentés
- **Slide 3 "Vision"** : proposition de valeur rédigée, pas un slogan
- **Slide 5 "3 piliers"** : description de 4-5 lignes par pilier avec bénéfices concrets
- **Slides produit (6-12)** : chaque feature décrite avec le problème qu'elle résout, comment elle fonctionne, quel résultat mesurable
- **Slide 13 "Pourquoi Heeplab"** : 4 différenciateurs argumentés avec stats d'impact
- **Annexes (15-30)** : descriptions techniques complètes de chaque module, pas des bullet points creux

Prompt system : "Tu es un consultant senior BCG spécialisé en EdTech et transformation digitale. Tu rédiges le contenu d'une présentation corporate pour Heeplab, plateforme SaaS de formation IA. Ton style : précis, factuel, argumenté, zéro bullshit. Chaque affirmation est étayée par un chiffre ou un mécanisme concret."

### Etape 2 : Captures d'écran (7 pages admin)

Via browser : Dashboard, Toolkits, Toolkit Detail, Academy, Map, Functions, Personae, Path Detail

### Etape 3 : Images IA art (6 images)

Via AI gateway `--image` : abstractions corporate (neural networks, transformation, growth)

### Etape 4 : Script pptxgenjs

30 slides avec 8 layouts alternés, fond blanc dominant, images IA en grand (split layout 50%), screenshots centrés, texte rédigé complet.

Signature : "heeplab — by Growthinnov — Ammar Khadraoui"

## Structure des slides avec contenu type

| # | Slide | Contenu attendu |
|---|-------|----------------|
| 1 | Cover | Logo heeplab, baseline, image IA art fond |
| 2 | Le constat | 3 stats marché (ex: "67% des programmes de formation échouent à produire un changement comportemental mesurable — McKinsey 2024"), paragraphe de contexte |
| 3 | Vision | "Heeplab transforme la formation corporate en expérience adaptative..." — texte de 5-6 lignes argumenté |
| 4 | Divider | "La plateforme" |
| 5 | 3 piliers | Toolkits (structuration stratégique), Design Innovation (mise en situation), Academy (formation adaptative) — 4 lignes chacun |
| 6 | Dashboard | Screenshot + description des KPIs temps réel, alertes proactives |
| 7 | 20 Fonctions | Grille + texte expliquant la granularité métier (responsabilités, KPIs, use cases IA par fonction) |
| 8 | 6 Profils | Description du modèle comportemental 10 axes, adaptation pédagogique par profil |
| 9 | Cartographie | Screenshot + texte sur la vue relationnelle Fonctions→Personae→Parcours→Campagnes |
| 10 | Parcours | Flow 5 étapes + texte sur la personnalisation par niveau/fonction/persona |
| 11 | Contenu IA | Exemples concrets de callouts (À retenir, Le saviez-vous, Attention), schémas ASCII, adaptation au niveau |
| 12 | Quiz 6 types | Description de chaque type (QCM, Vrai/Faux, Ordonner, Associer, Compléter, Scénario) avec mécanique pédagogique |
| 13 | Pourquoi Heeplab | 4 différenciateurs : IA générative contextuelle, granularité métier, adaptive learning, déploiement en 48h |
| 14 | Contact | Coordonnées complètes, CTA |
| 15-30 | Annexes | Textes techniques complets par module (Toolkit 7 onglets, IA Chat, Challenge 4 onglets, Academy 6 sections, Orgs, Users, Rôles) |

## Fichiers

- Contenu JSON : `/tmp/heeplab_content.json`
- Script PPTX : `/tmp/generate_v3_pptx.js`
- Output : `/mnt/documents/Heeplab_Presentation_Premium_v3.pptx`
- QA : conversion PDF → images → inspection slide par slide

## Ordre d'exécution

1. Rédiger le contenu complet via AI gateway → JSON
2. Capturer 8 screenshots via browser
3. Générer 6 images IA art
4. Ecrire le script pptxgenjs avec layouts variés + contenu intégré
5. Générer le PPTX
6. QA visuelle complète (PDF → images → inspection)
7. Corrections et re-génération si nécessaire

