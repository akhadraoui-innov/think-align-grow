

# Phase 0 — Audit des donnees Academy

## Chiffres cles

| Metrique | Valeur | Diagnostic |
|----------|--------|-----------|
| Parcours total | 10 | OK |
| Parcours publies | 8 | OK |
| Parcours avec 0 modules | **4** | **Probleme** — 4 parcours publies sont des coquilles vides |
| Parcours publies sans contenu | **6** | **Critique** — 6/8 parcours publies n'ont aucun contenu genere |
| Noms dupliques | **8** | **Probleme** — 4 noms de parcours existent en double |
| Modules total | 30 | OK |
| Modules orphelins | 0 | OK |
| Contenus remplis | 39 | Seulement 2 parcours ont du contenu reel |
| Quiz | 7 | Seulement 2 parcours ont des quiz |
| Exercices | 5 | Contenu riche et bien redige |
| Pratiques | 6 | Scenarios IA detailles et fonctionnels |
| Fonctions | 20 | OK |
| Personae | 6 | OK |
| Campagnes | 6 | Toutes sur 1 seule org (Growthinnov), 3 doublons |
| Enrollments | 2 | Quasi zero usage reel |
| Completions | 0 | Aucune completion enregistree |
| Progress records | 0 | Aucun tracking de progression |
| Certificats | 0 | Normal (aucune completion) |
| Utilisateurs total | 1 | Un seul user (admin) |
| Function users | 0 | Aucun user assigne a une fonction |

## Frictions identifiees

### 1. Donnees fantomes (critique)
4 parcours publies sont des doublons vides (meme noms que d'autres parcours). Ils polluent le catalogue apprenant. Il faut les supprimer ou les depublier.

### 2. Parcours publies sans contenu (critique)
6 parcours sur 8 sont publies mais n'ont AUCUN contenu genere. Un apprenant qui s'inscrit tombe sur des modules vides. Seuls "Premiers Pas avec l'IA Generative" (6 contenus) et "Cadrer la Strategie IA pour le COMEX" (4 contenus) ont du contenu.

### 3. Campagnes doublonnees
3 campagnes sur 6 sont des doublons (memes noms). Pas de batch enrollment — 1 seul enrollment lie a une campagne.

### 4. Zero progression
Malgre 2 enrollments, 0 progress records. Soit le tracking ne fonctionne pas, soit personne n'a ouvert un module.

## Recommandation immediate

Avant tout developpement, **nettoyer les donnees** :
1. Supprimer les 4 parcours doublons vides (ceux avec 0 modules)
2. Depublier les parcours sans contenu (les repasser en draft)
3. Supprimer les 3 campagnes doublons
4. Generer le contenu des parcours restants avant de les republier

Puis passer a **Phase 1 — Debloquer** : CRUD admin exercices/pratiques + batch enrollments campagnes.

Souhaitez-vous que je procede au nettoyage des donnees fantomes, ou directement a Phase 1 ?

