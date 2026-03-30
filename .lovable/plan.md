

# Plan — Page de paramétrage détaillé par parcours (onglet Certificats)

## Problème actuel

L'onglet "Paramétrage" de `/admin/academy/certificates` affiche une simple liste de parcours avec score min et toggle "Certifiant" — tout est en lecture seule, pas cliquable, pas de détail.

## Solution

Quand l'utilisateur clique sur un parcours dans l'onglet Paramétrage, on affiche une **page complète de paramétrage certification** pour ce parcours, avec plusieurs sections :

### Vue cible : Page détail certification parcours

**Option retenue** : Remplacer la liste par un mode liste/détail dans le même onglet (pas de nouvelle route). Un state `selectedPathId` contrôle l'affichage.

#### Sections de la page détail :

1. **Header parcours** — Nom, difficulté (badge), description, bouton retour à la liste

2. **Paramétrage certification** (Card éditable)
   - Toggle Certifiant (oui/non) — mutation UPDATE `academy_paths.certificate_enabled`
   - Score minimum — Input numérique — mutation UPDATE `academy_certificate_config.min_score`
   - Template certificat (select)
   - Signature personnalisée (input)
   - Bouton Sauvegarder

3. **KPIs Certifiés** (Cards stats)
   - Nombre de certifiés, score moyen des certifiés, temps moyen passé, dernière certification
   - Table des certifiés : nom, score, date, temps passé, statut

4. **Détail des connaissances** (Onglet interne)
   - Objectifs pédagogiques du parcours (tags)
   - Compétences visées (depuis description/tags du path)

5. **Webflow du parcours** (Onglet interne) — Timeline verticale ultra-design
   - Chaque module affiché comme une carte dans un flow vertical avec connecteurs
   - Icône par type (Cours, Quiz, Exercice, Pratique)
   - Pour chaque module : titre, type (badge couleur), durée estimée, statut
   - Alternance gauche/droite (timeline style)
   - Couleurs par type : bleu (leçon), violet (quiz), orange (exercice), vert (pratique)

### Données nécessaires (queries Supabase)

- `academy_paths` — info parcours (déjà chargé)
- `academy_path_modules` + `academy_modules` — modules du parcours avec sort_order
- `academy_certificates` filtré par `path_id` — certifiés de ce parcours
- `academy_certificate_config` — config (déjà chargé)
- `profiles` — noms des certifiés (déjà chargé)

### Fichier impacté

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminAcademyCertificates.tsx` | Refonte de l'onglet "settings" — ajout state `selectedPathId`, vue détail avec sous-onglets (Paramétrage, Certifiés, Connaissances, Parcours), queries conditionnelles pour modules et certifiés du path sélectionné |

### Ordre d'exécution

1. Ajouter state `selectedPathId` + queries conditionnelles (modules, certifiés par path)
2. Rendre la liste de parcours cliquable → sélectionne le path
3. Construire la vue détail avec 4 sections/sous-onglets
4. Implémenter le webflow timeline des modules (design premium avec connecteurs SVG)
5. Ajouter mutations pour sauvegarder score min + toggle certifiant

