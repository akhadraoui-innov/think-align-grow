
Contexte clarifié: le problème est sur **/challenge** (pas côté admin).  
Constat actuel: le template existe bien en base et est publié, donc le blocage est côté affichage/filtrage UX de la page Challenge.

Plan d’implémentation (court et ciblé)
1) Rendre la récupération des templates robuste sur /challenge
- Ajouter un garde d’authentification dans le hook de templates (`enabled` quand la session est prête), pour éviter les chargements “à vide” au démarrage.
- Trier les templates par récence (nouveaux d’abord) pour que le challenge C-Level apparaisse immédiatement.

2) Rendre la liste “Nouveau challenge” visible et exploitable
- Mettre la liste dans un conteneur scrollable (hauteur max + overflow).
- Ajouter une recherche simple (nom/template/toolkit) dans la popup.
- Afficher clairement le toolkit de chaque template (déjà présent) + badge de difficulté.

3) Aligner avec le contexte organisation (Growthinnov)
- Filtrer les templates par toolkits actifs de l’organisation courante.
- Si aucun toolkit actif ne donne de template, afficher un état vide explicite (“Aucun challenge disponible pour cette organisation”).
- Prévoir un fallback contrôlé (optionnel) pour afficher tous les templates si aucun scope org n’est détecté, afin d’éviter un écran vide ambigu.

4) Vérification de donnée d’accès org
- Vérifier que le toolkit C-Level est bien activé pour Growthinnov dans la table de liaison organisation↔toolkit.
- Si absent/inactif, créer/activer la liaison pour que le template apparaisse dans le contexte Growthinnov.

Détails techniques
- Fichiers principaux:
  - `src/hooks/useChallengeData.ts` (query templates: auth gating + tri + éventuel filtre org)
  - `src/pages/Challenge.tsx` (UI popup: recherche + scroll + états vides explicites)
  - éventuelle vérification de mapping org/toolkit côté base de données
- Points de vigilance:
  - ne pas casser la création de challenge existante (`create(t.name, { type: "challenge", template_id: t.id })`)
  - conserver les règles de quota/crédits déjà en place
  - garder un comportement cohérent si utilisateur sans organisation active

Validation après implémentation
- Sur /challenge avec organisation active = Growthinnov:
  1) cliquer “Nouveau”
  2) vérifier que “Cadrer et Piloter l’IA dans votre Métier” est visible en haut de liste
  3) lancer le challenge et vérifier l’ouverture de la room
  4) changer d’organisation via le switcher et confirmer que la liste s’adapte au contexte org
