

# Plan consolidé — Tout ce qui reste à implémenter

## Audit : ce qui est FAIT vs ce qui reste

### FAIT
- `useAcademyModule.ts` — saveProgress avec metadata merge
- `academy-tutor` edge function — 4 actions (brief, explain, coach, debrief)
- `ModuleReviewView.tsx` — version basique 3 onglets (Résultat, Analyse IA, Knowledge Brief)
- Intégration dans PortalFormationsModule + AcademyModule (toggle lecture/apprentissage)
- Persistance metadata pour Quiz, Exercice, Pratique
- `academy-skills-agent` enrichi avec metadata dans RAG
- Jeu de test complet pour Ammar Khadraoui

### RESTE A FAIRE (5 plans approuvés non implémentés)

---

## Paquet 1 — ModuleReviewView Premium+++ (5 onglets + auto-génération + persistance)

**Fichier** : `src/components/academy/ModuleReviewView.tsx` — refonte complète

| Onglet | Icone | Contenu |
|--------|-------|---------|
| Mes réponses (défaut) | FileText | Données brutes : réponses quiz sans feedback, texte exercice brut, conversation pratique, leçon lue |
| Résultat | Trophy | Scores, KPIs, feedback IA (strengths/improvements) — l'actuel |
| Évaluation globale | Star | Synthèse IA personnalisée : maîtrise, qualité, recommandations |
| Analyse IA | Sparkles | Patterns d'erreurs, compétences, axes |
| Knowledge Brief | Brain | Concepts clés, liens parcours |

**Auto-génération** : 3 `useEffect` au montage — si `metadata.ai_evaluation/ai_analysis/ai_knowledge` est null → appeler `academy-tutor` → persister dans `academy_progress.metadata` via UPDATE. Plus de boutons "Générer", remplacés par skeletons + "Génération en cours...".

**UI Premium** : Executive cards avec `border-l-4` (emerald/primary/amber), icone gradient, `prose prose-sm leading-relaxed`, timestamp "Généré le..." en footer.

---

## Paquet 2 — IA personnalisée + mode evaluation dans academy-tutor

**Fichier** : `supabase/functions/academy-tutor/index.ts`

- Tous les handlers : injecter prénom + job_title dans le system prompt, tutoyer l'apprenant
- `handleExplain` : charger le profil (actuellement ne le fait pas)
- Nouveau mode `evaluation` dans `handleDebrief` : évaluation globale rédigée couvrant maîtrise, pertinence, points forts, axes, recommandations

---

## Paquet 3 — Migration DB + Edge function document pédagogique

### Migration
```sql
ALTER TABLE academy_paths ADD COLUMN IF NOT EXISTS guide_document jsonb DEFAULT null;

CREATE TABLE academy_document_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  path_id uuid REFERENCES academy_paths(id) ON DELETE CASCADE NOT NULL,
  document_version integer DEFAULT 1,
  sent_at timestamptz DEFAULT now(),
  email text
);
ALTER TABLE academy_document_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sends" ON academy_document_sends FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own sends" ON academy_document_sends FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

### Edge function `academy-path-document`
- Génère un guide pédagogique 4-8 pages (markdown) stocké dans `academy_paths.guide_document`
- Modèle `google/gemini-2.5-flash`
- Input : path info, modules, skills, objectives, aptitudes
- Output : guide structuré (couverture, objectifs, détail modules, débouchés, glossaire)
- `supabase/config.toml` : ajouter `[functions.academy-path-document]`

---

## Paquet 4 — Intégration guide dans les pages parcours

**Fichiers** : `PortalFormationsPath.tsx` + `AcademyPath.tsx`

- Section "Guide pédagogique" affichant `guide_document.content` en markdown
- Bouton "Recevoir par email" (appel edge function pour envoi + INSERT dans `academy_document_sends`)
- Pour parcours incomplets : boutons "Enrichir" / "Rédiger" par section qui appellent l'IA

---

## Ordre d'exécution

1. **Paquet 2** — academy-tutor (personnalisation + mode evaluation) — prérequis pour le reste
2. **Paquet 1** — ModuleReviewView refonte 5 onglets + auto-génération + persistance
3. **Paquet 3** — Migration DB + edge function document
4. **Paquet 4** — Intégration guide dans pages parcours

## Fichiers impactés

| Fichier | Paquet |
|---------|--------|
| `supabase/functions/academy-tutor/index.ts` | 2 |
| `src/components/academy/ModuleReviewView.tsx` | 1 |
| `supabase/functions/academy-path-document/index.ts` | 3 (créer) |
| `supabase/config.toml` | 3 |
| `src/pages/portal/PortalFormationsPath.tsx` | 4 |
| `src/pages/AcademyPath.tsx` | 4 |
| Migration SQL | 3 |

