
Constat après audit complet

Le problème principal n’est plus côté données. J’ai vérifié que :
- le template `Cadrer et Piloter l'IA dans votre Métier` existe bien ;
- son toolkit principal `Cadrer la strategie ia` est bien `published` ;
- ce toolkit est bien actif pour l’organisation `Growthinnov` ;
- et surtout, le front le reçoit déjà dans les requêtes réseau sur `/challenge`.

Donc si vous ne le voyez toujours pas, le blocage est désormais côté expérience/front, pas côté base.

Ce que le diagnostic montre

1. Le challenge est bien renvoyé au front
- La requête org-scopée retourne bien le template attendu.
- Le backend est donc cohérent pour ce cas précis.

2. `/challenge` peut afficher un faux état “déconnecté” ou vide
- `src/pages/Challenge.tsx` affiche l’écran “Connectez-vous” dès que `user` est null, sans attendre la fin du chargement auth.
- Le replay montre justement cet écran sur `/challenge`.
- Comme `useAuth()` n’est pas mutualisé dans un provider global, plusieurs composants peuvent être momentanément désynchronisés.

3. `/challenge` n’attend pas non plus le chargement du contexte organisation
- La page décide trop tôt entre `orgTemplates` et `allTemplates`.
- Résultat possible : état vide ambigu au chargement, alors que les données arrivent juste après.

4. Le parcours de création n’est pas complet de bout en bout
- Dans `Challenge.tsx`, la création de challenge ne transmet pas `activeOrgId` à `create(...)`.
- Donc un challenge lancé depuis `/challenge` peut être créé hors contexte organisationnel, contrairement au module workshop.
- Ce n’est pas la cause du template invisible, mais c’est une vraie faille du parcours complet.

5. Il reste une fragilité structurelle sur le multi-toolkit
- Les politiques RLS de `challenge_subjects` et `challenge_slots` s’appuient encore sur `challenge_templates.toolkit_id`.
- Pour ce challenge précis ce n’est pas bloquant, car le toolkit principal est le bon.
- Mais à terme, un template multi-toolkit peut redevenir partiellement invisible si le toolkit “porteur” n’est pas le primary toolkit.

Plan corrigé et challengé

1. Stabiliser l’état d’authentification sur `/challenge`
- Modifier `src/pages/Challenge.tsx` pour utiliser `loading` de `useAuth()`.
- Tant que l’auth n’est pas résolue, afficher un vrai état de chargement.
- N’afficher “Connectez-vous” que si `loading === false && !user`.

2. Stabiliser le contexte organisation avant d’évaluer la liste
- Utiliser aussi `loading` de `useActiveOrg()`.
- Ne pas décider trop tôt entre `orgTemplates` et `allTemplates`.
- Ajouter un état distinct :
  - chargement auth/org,
  - chargement templates,
  - aucun challenge disponible.

3. Rendre le modal “Nouveau challenge” explicite
- Dans `Challenge.tsx`, afficher :
  - un loader quand les templates chargent,
  - un message vide seulement quand le chargement est terminé,
  - éventuellement le nom de l’organisation active dans la popup pour éviter l’ambiguïté.

4. Corriger le parcours de création end-to-end
- Passer `activeOrgId` dans :
  - `create(t.name, { type: "challenge", template_id: t.id }, activeOrgId)`
- Ainsi, un challenge lancé depuis `/challenge` sera bien rattaché à la bonne organisation, comme pour les workshops.

5. Durcir la logique de chargement des templates
- Dans `src/hooks/useChallengeData.ts` :
  - exposer clairement `isLoading`,
  - garder le tri actuel,
  - éventuellement forcer un `refetchOnMount` ou réduire le cache pour éviter les faux états juste après changement de contexte org.
- Je ne retiens pas le fallback polling comme solution principale ici : ce n’est pas un problème realtime, les données arrivent déjà bien.

6. Finaliser la cohérence multi-toolkit côté sécurité
- Mettre à jour les policies de :
  - `challenge_templates`
  - `challenge_subjects`
  - `challenge_slots`
- Objectif : autoriser la visibilité via la table de jonction `challenge_template_toolkits` ou via le toolkit principal, pour éviter les régressions futures.

Fichiers à corriger
- `src/pages/Challenge.tsx`
- `src/hooks/useChallengeData.ts`
- éventuellement `src/hooks/useAuth.ts` si on veut aller jusqu’à une auth réellement centralisée
- migration SQL pour aligner les policies RLS challenge avec le modèle multi-toolkit

Résultat attendu après implémentation
- En arrivant sur `/challenge`, un utilisateur connecté ne voit plus un faux écran “Se connecter”.
- En ouvrant “Nouveau”, le challenge `Cadrer et Piloter l'IA dans votre Métier` apparaît bien dans la liste pour Growthinnov.
- En le lançant, la session est créée avec :
  - `config.template_id` correct,
  - `organization_id` correct.
- En changeant d’organisation, la liste se met à jour proprement.
- Les templates multi-toolkits restent visibles de façon cohérente avec les règles de sécurité.

Validation end-to-end à faire après correction
1. Recharger `/challenge` en étant connecté.
2. Vérifier qu’aucun écran “Connectez-vous” intempestif n’apparaît.
3. Ouvrir “Nouveau”.
4. Vérifier que `Cadrer et Piloter l'IA dans votre Métier` est visible avec Growthinnov actif.
5. Lancer ce challenge.
6. Vérifier l’ouverture de la room avec le bon template.
7. Revenir sur `/challenge` et confirmer que la session créée est bien rattachée à l’organisation.
8. Changer d’organisation via le switcher et vérifier que la liste s’adapte.
