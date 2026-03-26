

# Analyse d'impact — Plan World-Class Academy

## 1. Impact sur l'administration des formations

### Etat actuel
`AdminAcademyPathDetail.tsx` (1720 lignes) gere deja : Info (lecture/edition), Modules (CRUD + contenu/quiz/exercice/pratique), Inscriptions, Stats. Le fichier est deja tres dense.

### Impacts par vague

**Vague 1 (Fondation)** — Impact admin : **nul**. Les corrections sont cote apprenant uniquement.

**Vague 2 (Practice Studio)** — Impact admin : **moyen**
- Les colonnes `phases`, `dimensions` ajoutees a `academy_practices` doivent etre editables dans la section Pratique de `AdminAcademyPathDetail.tsx` (deja 1720 lignes)
- Risque : ce fichier depasse la limite de maintenabilite. Il faudra extraire les onglets en sous-composants (`PathInfoTab.tsx`, `PathModulesTab.tsx`, `PathEnrollmentsTab.tsx`, `PathStatsTab.tsx`)
- L'admin devra pouvoir configurer les scenarios phases (stepper editor) et les dimensions du radar

**Vague 3 (Dashboard/Certificats)** — Impact admin : **faible**
- Le trigger SQL de certificat automatique fonctionne sans changement admin
- Optionnel : lien vers les certificats dans la fiche apprenant admin (`UserInfoTab`)

**Vague 4 (Adaptatif)** — Impact admin : **eleve**
- `prerequisite_score` et `is_optional` sur `academy_path_modules` = nouvelle UI d'edition par module dans l'admin
- Le diagnostic initial necessite un editeur de questions de positionnement (similaire au quiz mais distinct)
- Le branching logic doit etre visualisable pour l'admin (graphe de dependances entre modules)

**Vague 5 (Social)** — Impact admin : **moyen**
- Moderation des discussions : nouvelle vue admin pour gerer les messages signales
- Configuration peer review par exercice : switch + grille de criteres

### Recommandation
Extraire `AdminAcademyPathDetail.tsx` en 4 sous-composants **avant la Vague 2** pour eviter un fichier de 3000+ lignes.

---

## 2. Impact sur la base de donnees

### Schema actuel (tables Academy)
```text
academy_paths, academy_modules, academy_path_modules, academy_contents,
academy_quizzes, academy_quiz_questions, academy_exercises, academy_practices,
academy_enrollments, academy_progress, academy_certificates,
academy_personae, academy_functions, academy_function_users,
academy_campaigns, academy_campaign_targets, academy_asset_versions
```
Total : 17 tables. Aucune FK declaree (relations implicites via colonnes `_id`).

### Nouvelles tables/colonnes par vague

**Vague 2 — Practice Studio**
- `ALTER TABLE academy_practices ADD COLUMN phases jsonb DEFAULT '[]'` (config des phases du scenario)
- `ALTER TABLE academy_practices ADD COLUMN evaluation_dimensions jsonb DEFAULT '[]'` (dimensions radar)
- **Nouvelle table** `academy_practice_sessions` : stocke l'historique des sessions (messages, scores, duree). Actuellement les conversations ne sont PAS persistees — tout est perdu au refresh.

```text
academy_practice_sessions (
  id, user_id, practice_id, enrollment_id, messages jsonb,
  evaluation jsonb, score integer, started_at, completed_at
)
```
- RLS : `user_id = auth.uid()` pour CRUD, `is_saas_team()` pour SELECT admin

**Vague 3 — Certificats automatiques**
- Pas de nouvelle table. Ajout d'un **trigger PostgreSQL** sur `academy_progress` qui verifie si tous les modules du parcours sont completes apres chaque UPDATE status='completed'.
- Impact sur `sync_observatory_asset` et `capture_asset_version` : aucun (tables differentes)

**Vague 4 — Adaptatif**
- `ALTER TABLE academy_path_modules ADD COLUMN prerequisite_score integer DEFAULT NULL`
- `ALTER TABLE academy_path_modules ADD COLUMN is_optional boolean DEFAULT false`
- **Nouvelle table** `academy_diagnostics` : resultats du quiz de positionnement
- Impact : les requetes de locking dans `AcademyModule.tsx` et `AcademyPath.tsx` devront lire `prerequisite_score`

**Vague 5 — Social**
- **Nouvelle table** `academy_discussions (id, module_id, user_id, content, parent_id, created_at, is_pinned, is_flagged)`
- **Nouvelle table** `academy_peer_reviews (id, exercise_submission_id, reviewer_id, scores jsonb, comment, created_at)`
- RLS : membres de l'orga du parcours peuvent lire, auteur peut ecrire
- Realtime : `ALTER PUBLICATION supabase_realtime ADD TABLE academy_discussions`

### Risques base de donnees
1. **Absence de FK** : aucune foreign key declaree sur les 17 tables existantes. Un orphelin est possible (module supprime mais progress reste). Ce n'est pas bloquant mais degrade l'integrite.
2. **Trigger chain** : `sync_observatory_asset` + `capture_asset_version` sont deja actifs sur INSERT/UPDATE. Ajouter un trigger de certificat sur `academy_progress` = 3 triggers potentiels en cascade. Risque de deadlock faible mais a monitorer.
3. **Volume `academy_practice_sessions.messages`** : JSONB avec tout l'historique de conversation (10-20 messages x ~500 chars). Taille estimee : 5-15 KB par session. Pas de probleme a court terme, mais indexer `user_id` + `practice_id`.

---

## 3. Impact sur l'IA

### Edge functions IA actuelles
- `academy-generate` (1206 lignes) : 11 actions (path, content, quiz, exercise, practice, persona, function, illustrations, campaign, etc.)
- `academy-practice` (95 lignes) : streaming chat avec evaluation finale

### Impacts par vague

**Vague 2 — Practice Studio**
- `academy-practice` doit etre **restructure** :
  - Le `system_prompt` doit integrer les **phases** du scenario (injection dynamique de la phase courante)
  - L'evaluation finale doit renvoyer un **radar multi-dimensionnel** (pas un seul score) : `{"dimensions": [{"name": "Communication", "score": 85}, ...], "overall": 78, "feedback": "..."}`
  - Bug existant (ligne 48) : `practice` est hors scope quand `practice_id === "__persona_chat__"` + `evaluate === true` → crash
  - Consommation IA : inchangee (meme nombre de tokens par echange)

**Vague 4 — Adaptatif**
- Nouvelle action dans `academy-generate` : `generate-diagnostic` (generer les questions de positionnement a partir du contenu du parcours)
- Nouvelle action : `analyze-diagnostic-results` (analyser les reponses et recommander les modules a skipper)
- Impact tokens : ~2 appels IA supplementaires par inscription, faible volume
- `academy-generate` (deja 1206 lignes) doit etre **decoupe** en fichiers separes ou en edge functions distinctes

**Vague 5 — Social**
- Pas d'impact IA direct sauf si on active la moderation automatique des discussions (optionnel)

### Risques IA
1. **Fichier monolithique** : `academy-generate` a 1206 lignes et 11 actions. Ajouter des actions supplementaires degradera la lisibilite et le cold start de l'edge function (tout le code est charge meme pour une seule action).
   - **Recommandation** : Decouper en `academy-generate-path`, `academy-generate-content`, `academy-generate-diagnostic` etc.
2. **Bug connu** : `academy-practice` ligne 48 reference `practice` hors scope quand `practice_id === "__persona_chat__"` et `evaluate === true`. A corriger dans la Vague 2.
3. **Cout** : Le Practice Studio avec phases genere potentiellement plus d'echanges (phases = plus de tours). Impact modere sur la consommation de credits.

---

## 4. Impact sur l'architecture (robustesse + orientation organisation)

### Architecture actuelle
```text
Client (React SPA)
  ├── OrgContext (multi-tenant via localStorage)
  ├── AuthGuard / AdminGuard
  ├── Pages (Academy, Admin, Workshop, Challenge)
  └── Supabase Client (RLS-based access)

Edge Functions
  ├── academy-generate (LOVABLE_API_KEY, service_role)
  ├── academy-practice (LOVABLE_API_KEY, service_role — PAS d'auth user!)
  └── 6 autres fonctions

Database
  ├── RLS avec is_saas_team(), is_org_member(), is_org_admin()
  └── Triggers: sync_observatory_asset, capture_asset_version
```

### Points critiques

**1. `academy-practice` n'authentifie pas l'utilisateur**
- Contrairement a `academy-generate` qui verifie le JWT, `academy-practice` accepte tout appel sans authentification (pas de check `Authorization` header). N'importe qui avec l'URL peut consommer des credits IA.
- **Action requise Vague 2** : Ajouter la verification JWT comme dans `academy-generate`

**2. Scoping organisation insuffisant cote apprenant**
- `AcademyModule.tsx` fetch les modules sans filtre organisation. Un apprenant pourrait theoriquement acceder a un module via URL directe meme si le parcours n'est pas assigne a son organisation.
- La protection repose sur le RLS de `academy_modules` qui verifie `status=published` OU appartenance au path publie. C'est correct mais pas organisation-scoped.
- **Risque** : Un parcours publie sans `organization_id` est visible par TOUS les utilisateurs authentifies. C'est le design voulu (parcours publics) mais doit etre documente.

**3. Fichier `AcademyModule.tsx` (451 lignes) concentre trop de responsabilites**
- Fetch module, contents, enrollment, progress, path modules, quiz, exercise, practice
- Gere sidebar, navigation, completion, transitions
- **Recommandation** : Extraire un hook `useAcademyModule(id, pathId)` qui centralise toutes les queries et la logique metier

**4. Pas de cache intermediaire**
- Chaque navigation vers un module trigger 6-8 requetes Supabase independantes. React Query cache mais le premier load est lent.
- **Recommandation Vague 1** : Prefetch les modules adjacents dans `useAcademyModule` via `queryClient.prefetchQuery`

**5. Multi-tenant et Social Learning (Vague 5)**
- Les discussions doivent etre scopees par parcours ET organisation (un meme parcours deploye dans 2 orgas = 2 espaces de discussion separes)
- Les peer reviews doivent respecter la frontiere organisationnelle
- RLS necessaire : `is_org_member(auth.uid(), (SELECT organization_id FROM academy_enrollments WHERE id = enrollment_id))`

---

## 5. Impact sur la performance

### Etat actuel
- Page `AcademyModule` : **6-8 requetes paralleles** au chargement (module, contents, enrollment, progress, pathModules, quiz, exercise, practice)
- Page `AcademyDashboard` : **4 requetes** (enrollments, progress, moduleCounts, activity)
- Page `AdminAcademyPathDetail` : **8 requetes** (path, pathModules, contents, quizzes, exercises, practices, enrollments, progress)

### Impacts par vague

**Vague 1** — Impact : **neutre**. Les corrections sont CSS/logique, pas de nouvelles requetes.

**Vague 2 — Practice Studio**
- +1 requete pour charger l'historique des sessions (`academy_practice_sessions`)
- +1 requete pour charger les dimensions d'evaluation
- Le streaming SSE reste identique (pas d'impact reseau)
- **Risque** : Si on affiche le radar de progression avec benchmark anonyme, ca necessite une requete aggregee sur toutes les sessions de la pratique (potentiellement lourd). Solution : vue materialisee ou calcul cote edge function.

**Vague 3 — Certificats**
- Le trigger SQL s'execute cote serveur, transparent pour le client
- +1 requete pour verifier si un certificat existe (deja fait dans `AcademyCertificates`)

**Vague 4 — Adaptatif**
- Le diagnostic initial = +1 page avec ~10 questions (faible impact)
- Le branching modifie la logique de `getModuleStatus` mais pas le nombre de requetes

**Vague 5 — Social**
- **Impact le plus lourd** : Realtime sur `academy_discussions` = websocket permanent par module ouvert
- Pagination des discussions necessaire (pas de `limit` = risque de charger des centaines de messages)
- Peer reviews : requetes supplementaires par exercice soumis

### Metriques cibles
| Page | Requetes actuelles | Apres plan complet | Objectif |
|------|-------------------|-------------------|----------|
| Module (apprenant) | 6-8 | 8-10 | < 12 |
| Dashboard | 4 | 6-7 | < 10 |
| Admin Path Detail | 8 | 10-12 | < 15 |

### Recommandations performance
1. **Prefetch** : Quand l'apprenant est sur le module N, prefetch module N+1 (contents + quiz/exercise)
2. **Hook centralise** : `useAcademyModule` pour eviter les requetes en cascade (certaines dependent de `enrollment` qui depend de `pathId`)
3. **Pagination** : Discussions limitees a 50 messages avec infinite scroll
4. **Index SQL** : Ajouter `CREATE INDEX idx_progress_enrollment ON academy_progress(enrollment_id, module_id)` et `CREATE INDEX idx_sessions_user ON academy_practice_sessions(user_id, practice_id)`

---

## Resume des risques par priorite

| Priorite | Risque | Vague | Action |
|----------|--------|-------|--------|
| CRITIQUE | `academy-practice` sans auth JWT | Vague 2 | Ajouter verification JWT |
| CRITIQUE | `academy-practice` bug ligne 48 (variable hors scope) | Vague 2 | Fix conditionnel |
| HAUTE | `academy-generate` monolithique (1206 lignes) | Vague 4 | Decouper en fonctions separees |
| HAUTE | `AdminAcademyPathDetail` trop gros (1720 lignes) | Vague 2 | Extraire sous-composants |
| MOYENNE | Conversations Practice non persistees | Vague 2 | Table `academy_practice_sessions` |
| MOYENNE | Absence de FK sur les tables academy | Toutes | Migration FK optionnelle |
| FAIBLE | Prefetch modules adjacents | Vague 1 | `queryClient.prefetchQuery` |

