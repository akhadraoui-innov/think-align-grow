
# Academy — Roadmap Stratégique Révisée

## Phase 0 — Mesurer (1 jour)
- Audit données DB : parcours, modules, enrollments, taux completion
- Identifier frictions existantes (bugs, contenus vides, timeouts)
- **Métrique** : baseline chiffrée avant toute modification

## Phase 1 — Débloquer les fonctionnalités mortes (3-4 jours)
- CRUD admin Exercices (table `academy_exercises` existe, zéro UI)
- CRUD admin Pratiques (table `academy_practices` existe, zéro UI)
- Campagnes : inscriptions batch (inscrire tous les membres d'une org en 1 clic)
- **Métrique** : 100% des types de modules créables depuis l'admin

## Phase 2 — Qualité du contenu généré (2-3 jours)
- Prompts de génération plus contextuels, zéro ASCII art
- Illustrations isométriques premium (style Navy/Gold/Cyan)
- Fallback robuste si génération image échoue (placeholder gracieux)
- **Métrique** : contenu généré sans marqueurs bruts ni schemas cassés

## Phase 3 — UX chirurgicale apprenant (3-4 jours)
- Catalogue : images de couverture + section "En cours"
- Lecteur : espacement typographique + images full-width + callouts premium
- Quiz : animation confetti sur completion du quiz (pas par question)
- **Métrique** : temps moyen par session, taux completion module

## Phase 4 — Scale (quand nécessaire)
- Tracking analytics complet (graphiques, export, alertes décrochage)
- Certificats (admin + apprenant + PDF)
- Dashboard apprenant personnel (stats, heatmap, recommandations)
- **Métrique** : NPS apprenant, taux certification

## Risques techniques identifiés
1. **Timeouts génération** : séquentiel 25 appels IA = 5-10min → prévoir queue/polling
2. **Stockage images** : pas de compression/nettoyage → politique de rétention
3. **Versioning contenu** : re-génération écrase tout → historique snapshots
4. **Contenus existants** : ASCII art déjà généré non rétro-mis à jour

## Règles d'exécution
- Max 3 livrables par phase
- Chaque livrable a un périmètre figé et testable
- On mesure avant d'embellir
- On débloque avant d'optimiser
