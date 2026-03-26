

# Practice Studio dans l'Administration

## Objectif
Ajouter un bouton "Tester le Practice Studio" sur la page de detail module admin (`/admin/academy/modules/:id`) qui ouvre le composant `AcademyPractice` en plein ecran dans un Dialog, permettant aux admins de tester l'experience exacte de l'apprenant.

## Probleme actuel
Le bouton "Preview apprenant" existant (ligne 169) affiche uniquement le contenu Markdown et un apercu statique du quiz. Il n'integre pas du tout le Practice Studio (chat IA). L'admin n'a aucun moyen de tester une session de pratique sans se connecter cote apprenant.

## Plan d'implementation

### 1. Ajouter un mode "admin preview" au composant AcademyPractice

Modifier `src/components/academy/AcademyPractice.tsx` pour accepter une prop optionnelle `previewMode?: boolean` :
- Quand `previewMode = true` : ne pas persister les sessions en base, ne pas exiger `enrollmentId`, utiliser un bandeau "Mode test admin" en haut
- Le chat fonctionne normalement (appel edge function, streaming, phases, evaluation) mais sans ecriture dans `academy_practice_sessions` et sans decompte de credits

### 2. Ajouter le bouton et le Dialog dans AdminAcademyModuleDetail

Dans `src/pages/admin/AdminAcademyModuleDetail.tsx` :
- Ajouter un state `practiceTestOpen`
- Ajouter un bouton "Tester Practice Studio" (icone Play) a cote de "Preview apprenant", visible uniquement quand `mod.module_type === 'practice'` et qu'au moins une practice existe
- Ouvrir un Dialog fullscreen (`max-w-5xl h-[90vh]`) contenant `<AcademyPractice moduleId={id} previewMode />`
- Le Dialog inclut un bandeau jaune "Mode test — Les echanges ne sont pas enregistres"

### 3. Enrichir la Preview existante

Dans le Dialog "Preview apprenant" existant (ligne 424), ajouter la preview de l'exercice et de la pratique (actuellement seuls contenu + quiz sont affiches). Afficher un apercu statique de la config practice (scenario, phases, dimensions d'evaluation) pour une vue rapide sans lancer le chat.

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/academy/AcademyPractice.tsx` | Ajouter prop `previewMode`, conditionner la persistance |
| `src/pages/admin/AdminAcademyModuleDetail.tsx` | Bouton "Tester Practice Studio" + Dialog fullscreen |

