

# Critique du plan — Faiblesses, angles morts, risques

## 1. Le plan est un inventaire, pas une strategie

Le plan liste 14 chantiers sur 4 vagues sans jamais definir de critere de succes mesurable. "Catalogue immersif" ou "Quiz gamification" sont des labels, pas des objectifs. Un vrai plan dirait : "Reduire le taux d'abandon module de X% a Y%" ou "Passer le temps moyen par session de 3min a 12min".

**Verdict** : le plan decrit ce qu'on va construire, jamais pourquoi ni comment on saura si ca marche.

---

## 2. Priorisation contestable

La Vague 1 met "Catalogue immersif" et "Lecteur immersif" avant "Campagnes" et "Tracking". Or :

- **Sans Tracking**, on ne sait meme pas si les apprenants utilisent ce qui existe deja. On embellit a l'aveugle.
- **Sans Campagnes**, personne ne peut deployer un parcours a une cohorte. Le catalogue le plus beau du monde est inutile si l'admin ne peut pas inscrire 200 personnes en un clic.
- **Exercices & Pratiques admin** est correctement en Vague 1 — c'est effectivement bloquant.

**Proposition alternative** :
1. Exercices & Pratiques admin (bloquant fonctionnel)
2. Tracking analytics (visibilite operationnelle — on mesure avant d'embellir)
3. Campagnes batch (deploiement a l'echelle)
4. ENSUITE seulement : UX apprenant (catalogue, lecteur, quiz)

---

## 3. Le plan ignore les donnees existantes

Le plan ne mentionne jamais :
- Combien d'utilisateurs actifs ont teste l'Academy ?
- Combien de parcours existent en DB ? Combien ont du contenu genere ?
- Quels sont les taux de completion actuels ?
- Quels bugs ou frictions existent deja ?

On planifie des refontes massives sans jamais regarder ce qui se passe reellement. C'est du "feature factory" pur.

---

## 4. Scope explosion sur l'UX apprenant

Chaque chantier apprenant contient 5-8 sous-features ambitieuses :

- **Catalogue** : hero, categories, recommandations, animations de survol, images generees → c'est 5 chantiers en 1
- **Quiz** : timer, streaks, confetti, DnD tactile, leaderboard, XP, sons → c'est un mini-jeu complet
- **Lecteur** : table des matieres, mode sombre, surlignage, notes, animations scroll → c'est Notion

Aucun de ces sous-chantiers n'a d'estimation de temps. Le risque : on commence tout, on finit rien, chaque page est a moitie refaite.

**Regle** : chaque vague devrait contenir max 3 livrables avec un perimetre fige et testable.

---

## 5. Angles morts techniques

### 5.1 Performance de generation
Le "Tout generer" timeout deja a 60s (bug corrige avec retry). Avec les marqueurs `<!-- ILLUSTRATION -->` en plus, chaque module va declencher 2-3 appels image supplementaires. Un parcours de 5 modules = ~25 appels IA sequentiels. Ca va prendre 5-10 minutes et probablement echouer.

**Manque** : un systeme de queue (table `generation_jobs` avec statuts, polling cote client, reprise sur echec).

### 5.2 Stockage images
Le bucket `academy-assets` existe mais : pas de politique de nettoyage, pas de CDN, pas de compression. Generer 3 images par module × 5 modules × 10 parcours = 150 images PNG non compressees. Cout et latence vont exploser.

### 5.3 Pas de versioning du contenu
Quand on re-genere du contenu, l'ancien est ecrase. Pas d'historique, pas de rollback. Un admin qui lance "Tout generer" par erreur perd tout le contenu edite manuellement.

---

## 6. Le prompt de contenu demande des schemas ASCII... puis on veut les supprimer

Le plan actuel (ligne 274 de l'edge function) demande explicitement "Schemas en ASCII art dans des blocs code". Le nouveau plan veut les remplacer par des marqueurs `<!-- ILLUSTRATION -->`. Mais :

- Les contenus deja generes contiennent du ASCII art → ils ne seront pas retroactivement mis a jour
- Le prompt actuel produit du contenu de qualite — le changer risque de degrader la coherence
- On n'a aucun fallback si la generation d'image echoue (le marqueur reste brut dans le markdown)

---

## 7. L'experience apprenant actuelle n'est peut-etre pas si mauvaise

Le lecteur actuel a deja :
- Barre de progression de lecture (lignes 197-204 d'AcademyModule)
- Table des matieres extractive (lignes 127-141)
- Navigation inter-modules (prev/next)
- Tuteur IA flottant
- EnrichedMarkdown avec callouts stylises

Le plan dit "UI basique" mais c'est deja au-dessus de la moyenne. Le vrai probleme n'est probablement pas le layout mais le **contenu** (qualite de generation, pertinence des exemples, adaptation au niveau).

---

## 8. Ce que le plan devrait etre

```text
Phase 0 — Mesurer (1 jour)
├── Ajouter tracking anonyme (pages vues, temps, completion)
├── Compter les donnees existantes en DB
└── Identifier les 3 frictions #1 des utilisateurs actuels

Phase 1 — Debloquer (3-4 jours)
├── CRUD Exercices admin
├── CRUD Pratiques admin
└── Campagnes : inscriptions batch

Phase 2 — Qualite du contenu (2-3 jours)
├── Ameliorer les prompts de generation (plus contextuels, zero ASCII)
├── Illustrations isometriques premium (nouveau style)
└── Fallback robuste si generation image echoue

Phase 3 — UX chirurgicale (3-4 jours)
├── Catalogue : images de couverture + section "En cours"
├── Lecteur : espacement typographique + images full-width
└── Quiz : animations feedback (confetti sur completion, pas par question)

Phase 4 — Scale (quand necessaire)
├── Tracking analytics complet
├── Certificats
└── Dashboard apprenant
```

---

## Resume

Le plan actuel est une wishlist exhaustive deguisee en roadmap. Il manque :
1. Des metriques de succes
2. Une priorisation basee sur l'impact reel (pas l'esthetique)
3. Des estimations de temps
4. Une gestion des risques techniques (timeout, stockage, versioning)
5. Une validation que le probleme est bien l'UI et pas le contenu

Souhaitez-vous que je re-redige le plan avec ces corrections ?

