

# Audit & Plan d'evolution — Actifs Pedagogiques

## Audit de l'existant

### Ce qui fonctionne
- 3 onglets (Quiz, Exercices, Pratiques) avec donnees chargees via jointures
- Filtres : recherche, organisation, parcours, difficulte, mode de generation
- Duplication vers un module cible (avec copie des questions pour les quiz)
- Detail collapsible par ligne
- Navigation vers le module source pour edition

### Bugs et incoherences detectes

| Probleme | Impact | Severite |
|----------|--------|----------|
| **Le filtre Difficulte ne fonctionne que pour les Pratiques** — les Quiz et Exercices n'ont pas de champ `difficulty` en DB | Filtre silencieusement inoperant sur 2/3 des onglets | Critique |
| **Pas de padding sur le conteneur principal** — `AdminShell` wrape mais le contenu commence sans `p-6` | UI desalignee vs autres pages admin | Moyenne |
| **Fragments `<>` sans key** dans les `.map()` des TableRow | Warning React en console, potentiel bug de re-render | Faible |
| **Duplicate query calls** — `useQuizzes()`, `useExercises()`, `usePractices()` sont appeles 2 fois (dans les tabs + dans le main pour les paths) | Double fetch inutile | Moyenne |
| **Pas de gestion d'erreur** — si une requete echoue, aucun feedback | UX degradee silencieusement | Moyenne |

---

## Plan de corrections et evolutions

### CORRECTION 1 — Fixer les bugs existants
**Valeur business** : Fiabilite de l'outil, confiance des admins
**Valeur client** : Interface coherente, pas de filtres fantomes
**Valeur utilisateur** : Moins de confusion, zero bugs visuels

- Ajouter `p-6` au conteneur principal (alignement admin)
- Supprimer le filtre Difficulte des onglets Quiz et Exercices (il n'a pas de sens pour ces types) — ou le masquer dynamiquement selon l'onglet actif
- Ajouter des `key` aux fragments React
- Factoriser les queries : charger les 3 datasets une seule fois au niveau parent, les passer en props aux tabs
- Ajouter un state d'erreur avec message visible

### CORRECTION 2 — Filtre dynamique selon l'onglet actif
**Valeur business** : UX professionnelle, reduction du support
**Valeur client** : Interface intuitive qui s'adapte au contexte
**Valeur utilisateur** : Seuls les filtres pertinents sont affiches

Tracker l'onglet actif (`activeTab` state). La `FilterBar` recoit le type d'onglet et affiche/masque les filtres selon le contexte :
- **Quiz** : recherche, org, parcours, mode — pas de difficulte
- **Exercices** : recherche, org, parcours, mode — pas de difficulte
- **Pratiques** : recherche, org, parcours, mode, difficulte

### EVOLUTION 1 — Tags / Categories transversaux
**Valeur business** : Reutilisabilite x3, reduction du cout de production de contenu
**Valeur client** : Contenu categorise, recherche plus rapide
**Valeur utilisateur** : Trouver le bon actif en 2 clics

- Migration DB : ajouter une colonne `tags text[]` sur les 3 tables d'actifs
- Filtre "Tags" dans la FilterBar (multi-select)
- Tags derives automatiquement du parcours source (ex: "IA Generative", "Data", "Leadership")
- Edition des tags depuis le detail collapsible

### EVOLUTION 2 — Statistiques d'utilisation par actif
**Valeur business** : Identifier les contenus performants vs sous-utilises, piloter la production
**Valeur client** : Prioriser les actifs qui generent le plus d'engagement
**Valeur utilisateur** : Voir d'un coup d'oeil la popularite et l'efficacite d'un actif

- Requete `academy_progress` groupee par `module_id` pour compter tentatives + score moyen
- Afficher dans le detail collapsible : nombre de tentatives, taux de completion, score moyen
- Badge visuel "Populaire" (>10 tentatives) ou "Nouveau" (<7 jours)

### EVOLUTION 3 — Filtres croisables : recherche full-text enrichie
**Valeur business** : Gain de temps pour les equipes pedagogiques (x5 sur la recherche)
**Valeur client** : Capitaliser sur tout le contenu genere sans parcourir les parcours un par un
**Valeur utilisateur** : Recherche dans le contenu (instructions, questions, scenarios) et pas seulement dans les titres

- Etendre le `matchSearch` pour chercher aussi dans `instructions`, `scenario`, `description`, et le texte des questions quiz
- Ajouter un indicateur visuel du champ ou le match a ete trouve

### INNOVATION 1 — Asset Marketplace interne (cross-org sharing)
**Valeur business** : Monetisation indirecte — les clients voient la richesse du catalogue, upsell sur les parcours premium
**Valeur client** : Acces a un catalogue partage de best practices, acceleration du deploiement
**Valeur utilisateur** : Dupliquer un actif public de qualite en 1 clic plutot que creer from scratch

- Visibilite "Public" = disponible pour toutes les orgs en lecture
- Bouton "Importer dans mon parcours" pour les clients (via duplication)
- Statistiques de partage : combien de fois un actif public a ete duplique

### INNOVATION 2 — Versioning et historique des actifs
**Valeur business** : Tracabilite reglementaire (Qualiopi, compliance), zero perte de contenu
**Valeur client** : Rollback possible en cas d'erreur de modification
**Valeur utilisateur** : Voir l'evolution d'un actif et restaurer une version anterieure

- Migration DB : table `academy_asset_versions` (asset_type, asset_id, version, data jsonb, created_by, created_at)
- Trigger DB : a chaque UPDATE sur les 3 tables, inserer une version
- UI : onglet "Historique" dans le detail collapsible, avec diff visuel

---

## Priorites recommandees

| Phase | Actions | Effort |
|-------|---------|--------|
| **P0 — Maintenant** | Corrections 1 + 2 (bugs + filtres dynamiques) | 1 fichier, ~100 lignes |
| **P1 — Court terme** | Evolution 3 (recherche full-text) | Meme fichier, ~20 lignes |
| **P2 — Moyen terme** | Evolution 1 (tags) + Evolution 2 (stats) | Migration + ~150 lignes |
| **P3 — Long terme** | Innovation 1 (marketplace) + Innovation 2 (versioning) | Architecture + migration + nouvelle page |

## Section technique

**Correction 1 — Factorisation des queries** :
```tsx
// Main page charge tout une seule fois
const quizzes = useQuizzes();
const exercises = useExercises();
const practices = usePractices();

// Passe en props aux tabs
<QuizTab data={quizzes.data} filters={filters} />
```

**Correction 2 — Filtre dynamique** :
```tsx
const [activeTab, setActiveTab] = useState("quizzes");

<FilterBar filters={filters} setFilter={setFilter} orgs={orgs} paths={paths}
  showDifficulty={activeTab === "practices"} />

<Tabs value={activeTab} onValueChange={setActiveTab}>
```

**Evolution 2 — Stats par actif** :
```tsx
// Requete groupee
const { data: stats } = useQuery({
  queryKey: ["asset-usage-stats"],
  queryFn: async () => {
    const { data } = await supabase
      .from("academy_progress")
      .select("module_id, status, score");
    // Grouper par module_id → { attempts, completed, avgScore }
    return groupByModule(data);
  }
});
```

