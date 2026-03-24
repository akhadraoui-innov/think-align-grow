

# Audit Academy — Phases restantes Admin + UX Apprenant

## Etat actuel

### Admin (ce qui existe)
- **Dashboard** (`AdminAcademy`) : KPIs, graphiques, timeline activite
- **Cartographie** (`AdminAcademyMap`) : flow fonctions/personae/parcours/campagnes
- **Fonctions** (`AdminAcademyFunctions` + `AdminAcademyFunctionDetail`) : CRUD, 3 modes IA, page detail
- **Personae** (`AdminAcademyPersonae`) : CRUD, radar 10 axes, sheet panel
- **Parcours liste** (`AdminAcademyPaths`) : grille/table, creation IA 3 modes
- **Parcours detail** (`AdminAcademyPathDetail`) : timeline modules, preview contenu EnrichedMarkdown, preview quiz enrichi, generation batch, illustrations IA
- **Campagnes** (`AdminAcademyCampaigns`) : CRUD basique dialog
- **Tracking** (`AdminAcademyTracking`) : DataTable enrollments + progress

### Apprenant (ce qui existe)
- **Catalogue** (`Academy`) : grille de cards, filtres difficulte, search
- **Page parcours** (`AcademyPath`) : timeline verticale, inscription, progression
- **Page module** (`AcademyModule`) : tabs contenu/quiz/exercice/pratique, EnrichedMarkdown, tuteur IA flottant
- **Quiz** (`AcademyQuiz`) : 6 types (MCQ, vrai/faux, ordering, matching, fill_blank, scenario), hints, recap, review
- **Exercice** (`AcademyExercise`) : soumission texte + evaluation IA
- **Pratique** (`AcademyPractice`) : chat SSE coaching IA

---

## Phases restantes

### ADMIN — 6 chantiers

**1. Campagnes — Refonte complete**
- Actuellement : CRUD dialog basique, pas de timeline visuelle, pas d'inscriptions automatiques
- Manque : vue Gantt/timeline horizontale par campagne, inscriptions batch (inscrire tous les membres d'une org), emails de notification, stats campagne (taux inscription, taux completion), filtres multi-criteres
- Impact : deploiement a grande echelle impossible sans ca

**2. Tracking — Upgrade analytics**
- Actuellement : table plate d'enrollments sans profils utilisateurs (pas de noms affiches), pas de graphiques, pas d'export
- Manque : courbes de progression temporelles (Recharts), heatmap completion par module, export CSV, filtres par organisation/campagne, detail par apprenant (clic → drill down), alertes decrochage (apprenants inactifs > 7j)
- Impact : zero visibilite operationnelle pour un L&D manager

**3. Module detail admin — Page dediee**
- Actuellement : les modules ne sont editables que via le collapsible dans PathDetail. Pas de page `/admin/academy/modules/:id`
- Manque : page dediee avec tabs (Contenu, Quiz, Exercice, Pratique, Stats), edition inline du contenu markdown avec preview live, gestion des quiz questions une par une (reorder, edit, delete), preview apprenant integree
- Impact : impossible de gerer finement le contenu pedagogique

**4. Exercices & Pratiques — Gestion admin**
- Actuellement : aucune interface admin pour creer/editer des exercices ou des sessions de pratique IA. Les tables `academy_exercises` et `academy_practices` existent mais pas de CRUD admin
- Manque : CRUD exercices (instructions, criteres d'evaluation, evaluation IA toggle), CRUD pratiques (scenario, system_prompt, max_exchanges, rubric d'evaluation, difficulte), generation IA des scenarios
- Impact : ces 2 types de modules sont inutilisables sans creation admin

**5. Certificats — Gestion et generation**
- La table `academy_certificates` existe mais aucune UI admin ni apprenant
- Manque : template de certificat configurable, generation automatique a la completion d'un parcours avec `certificate_enabled`, preview PDF, listing admin des certificats emis
- Impact : feature prometteuse mais totalement dormante

**6. Onboarding fonction — Interface admin**
- `academy_function_users` et `custom_context` existent en DB mais pas d'interface pour assigner des utilisateurs a des fonctions ni pour lancer l'enrichissement IA du contexte
- Manque : dans la page FunctionDetail, onglet "Utilisateurs assignes" avec ajout/suppression, bouton "Enrichir le contexte IA", visualisation du custom_context

---

### APPRENANT — 8 chantiers

**1. Catalogue — Refonte immersive**
- Actuellement : grille de cards plates standard, pas d'images, pas de categories
- Objectif : hero immersif avec parcours mis en avant (featured), categories par fonction/persona, cards avec image de couverture generee, animation de survol riche, section "Recommandes pour vous" basee sur la fonction de l'utilisateur
- Inspiration : Coursera, Udemy, LinkedIn Learning

**2. Page parcours — Experience narrative**
- Actuellement : timeline verticale basique avec dots et cards plates
- Objectif : timeline immersive avec apercu du contenu de chaque module (1ere image, 3 premieres lignes), badges de type animes, estimations de temps cumulees, section "Ce que vous allez apprendre" (objectifs du parcours), section "Pre-requis", temoignages/avis, progression animee (confetti a 100%)
- Inspiration : page cours Coursera avec syllabus deployable

**3. Page module — Refonte lecteur immersif**
- Actuellement : contenu dans une Card blanche basique, tabs plates
- Objectif : lecteur plein ecran type Medium/Notion avec barre de progression de lecture, table des matieres laterale (headings extraits), mode sombre lecteur, surlignage et prise de notes (state local), animations d'apparition au scroll des sections
- Le tuteur IA flottant est bien mais pourrait avoir des suggestions contextuelles ("Voulez-vous que je vous explique ce concept ?")

**4. Quiz — Gamification avancee**
- Actuellement : fonctionnel avec 6 types mais UI sobre, pas d'images, pas de timer, pas de streaks
- Objectif : timer optionnel par question, streaks visuelles (3 bonnes reponses d'affilee = flamme), animations confetti sur bonne reponse (pas juste un checkmark), images/illustrations dans les questions, son optionnel (correct/incorrect), leaderboard par parcours, XP gagnes affiches en temps reel
- Le drag & drop pour ordering est basique (boutons fleche) → vrai DnD tactile

**5. Exercice — Interface enrichie**
- Actuellement : Textarea + bouton soumettre → feedback texte
- Objectif : editeur markdown avec preview (l'apprenant peut structurer sa reponse), upload de fichiers/images, historique des soumissions (re-soumission possible), feedback IA enrichi avec scoring par critere (pas juste un score global), progression par critere visualisee en radar

**6. Pratique IA — Experience conversationnelle premium**
- Actuellement : chat fonctionnel mais UI chat basique
- Objectif : avatars animes pour le coach IA, suggestions de reponses (chips cliquables), indicateur de frappe ("Le coach reflechit..."), reactions rapides, sauvegarde de la conversation, reprise de session

**7. Certificats — Affichage et telechargement**
- Aucune UI apprenant actuellement
- Objectif : page "Mes certificats" dans le profil, visualisation du certificat (design premium genere), telechargement PDF, partage LinkedIn, badge de reussite sur le profil

**8. Dashboard apprenant — Tableau de bord personnel**
- N'existe pas actuellement
- Objectif : page `/academy/dashboard` avec stats personnelles (parcours en cours, heures passees, score moyen, streak de jours consecutifs), calendrier d'activite (heatmap GitHub-style), recommandations de parcours, badges/achievements

---

## Priorisation recommandee

### Vague 1 — Fondations manquantes (critique)
1. Exercices & Pratiques admin (sans ca, 2 types de modules sont morts)
2. Catalogue apprenant immersif (premiere impression)
3. Page module lecteur immersif (coeur de l'experience)

### Vague 2 — Engagement & gamification
4. Quiz gamification (timer, streaks, confetti, DnD)
5. Dashboard apprenant personnel
6. Page parcours narrative

### Vague 3 — Operations & scale
7. Campagnes refonte (Gantt, batch enroll, notifs)
8. Tracking analytics (graphiques, export, alertes)
9. Module detail admin (page dediee)

### Vague 4 — Differenciateurs
10. Certificats (admin + apprenant)
11. Onboarding fonction
12. Exercice enrichi (markdown editor, multi-soumission)
13. Pratique IA premium (avatars, suggestions)

---

## Section technique

### Fichiers a creer
- `src/pages/admin/AdminAcademyModuleDetail.tsx`
- `src/pages/AcademyDashboard.tsx`
- `src/pages/AcademyCertificates.tsx`
- `src/components/academy/ImmersiveReader.tsx`
- `src/components/academy/QuizTimer.tsx`
- `src/components/academy/CertificateViewer.tsx`
- `src/components/admin/AcademyExercisesTab.tsx`
- `src/components/admin/AcademyPracticesTab.tsx`

### Fichiers a refondre
- `src/pages/Academy.tsx` (catalogue immersif)
- `src/pages/AcademyPath.tsx` (experience narrative)
- `src/pages/AcademyModule.tsx` (lecteur immersif)
- `src/components/academy/AcademyQuiz.tsx` (gamification)
- `src/pages/admin/AdminAcademyCampaigns.tsx` (Gantt + batch)
- `src/pages/admin/AdminAcademyTracking.tsx` (analytics)

### Routes a ajouter
- `/admin/academy/modules/:id`
- `/academy/dashboard`
- `/academy/certificates`

Par quelle vague souhaitez-vous commencer ?

