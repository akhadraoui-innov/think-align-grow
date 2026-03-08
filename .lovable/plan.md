

# 🚀 Hack & Show — Plateforme Stratégique Interactive

## Concept
Une app mobile-first au design bold et coloré (inspiré du Dribbble : couleurs vives par pilier, cards arrondies, typographie forte, gradients), qui transforme le toolkit Hack & Show en une expérience de serious game stratégique alimentée par l'IA.

---

## 🎨 Design System
- **Palette colorée par pilier** : chaque pilier (Thinking, Business, Innovation, Finance, etc.) a sa couleur signature avec gradient — rouge/rose, jaune/or, bleu, vert, violet…
- **Cards 3D arrondies** avec ombres douces, animations de flip/reveal
- **Typographie bold** : titres imposants, corps lisible
- **Navigation bottom-bar mobile** avec icônes animées
- **Dark mode** supporté

---

## 📱 Pages & Fonctionnalités

### 1. Landing / Onboarding
- Hero animé "L'Innovation est un Chaos. Structurez-la."
- Présentation rapide des 4 phases (Fondations, Modèle, Croissance, Exécution)
- CTA : Explorer gratuitement / Créer un compte

### 2. Exploration des Cartes (public)
- Navigation par **pilier** (10 piliers) et par **phase** (4 phases)
- Chaque carte : flip animation révélant Définition → Action → KPI → Pertinence
- Filtres par thème, recherche textuelle
- Badge de progression visible pour les utilisateurs connectés

### 3. Plans de Jeu Interactifs (public + compte)
- Les 10 scénarios du toolkit présentés comme des "missions"
- Parcours guidé étape par étape avec les cartes combinées
- Mode "Facilitateur" : timer intégré, notes collaboratives
- **Compte requis** pour sauvegarder sa progression

### 4. 🎮 Serious Game — "Strategy Lab" (compte requis)
- **Auto-évaluation** : quiz par pilier pour mesurer sa maturité entrepreneuriale
- **Radar chart** de compétences (Recharts)
- **Défis hebdomadaires** : une situation business à résoudre avec les bonnes cartes
- **Score & classement** gamifié (XP, badges, niveaux)
- Parcours adaptatif selon le profil (startup, corporate, coach)

### 5. 🤖 Générateurs IA (crédits)
- **Générateur de réflexion stratégique** : décrivez votre situation → l'IA propose un plan de jeu avec les cartes pertinentes
- **Générateur de livrables** : pitch deck, SWOT, business model canvas, plan d'action — générés à partir de vos réponses guidées
- **Coach IA conversationnel** : chatbot qui challenge vos hypothèses en utilisant le framework Hack & Show
- **Système de crédits** : X crédits gratuits/mois, puis achat de crédits supplémentaires

### 6. Dashboard Utilisateur (compte requis)
- Projets sauvegardés avec leurs plans de jeu
- Historique des livrables générés
- Radar de maturité évolutif
- Crédits restants et historique d'utilisation

### 7. Admin / Back-office
- Gestion des utilisateurs et inscriptions
- Suivi des crédits consommés
- Analytics d'usage (cartes les plus consultées, parcours populaires)
- Gestion du contenu des cartes via Supabase

---

## 🔧 Backend (Supabase / Lovable Cloud)

### Base de données
- **cards** : contenu des 200+ cartes (pilier, phase, définition, action, KPI, indicateurs)
- **pillars** & **phases** : structure du toolkit
- **game_plans** : les 10+ scénarios avec leurs séquences de cartes
- **profiles** : données utilisateur (nom, avatar, type : startup/corporate/coach)
- **user_roles** : table séparée pour les rôles (admin, user, premium)
- **user_progress** : scores, badges, niveaux, quiz complétés
- **user_projects** : projets sauvegardés avec plans de jeu personnalisés
- **generated_deliverables** : livrables IA sauvegardés
- **credits** : solde et historique de consommation
- **challenges** : défis hebdomadaires

### Auth
- Email + Google sign-in
- Accès public pour exploration, compte requis pour features avancées

### Edge Functions
- Générateur de réflexion IA (Lovable AI)
- Générateur de livrables IA
- Coach IA conversationnel (streaming)
- Gestion des crédits (déduction à chaque appel IA)

### Paiements
- Stripe pour l'achat de crédits supplémentaires

---

## 📋 Plan d'implémentation (par étapes)

**Étape 1** — Design system + Landing page + Navigation mobile
**Étape 2** — Base de données (cartes, piliers, phases) + Exploration des cartes
**Étape 3** — Auth + Profils + Dashboard utilisateur
**Étape 4** — Plans de jeu interactifs avec parcours guidés
**Étape 5** — Serious Game (quiz, radar, scoring, badges)
**Étape 6** — Générateurs IA + système de crédits
**Étape 7** — Stripe pour crédits payants
**Étape 8** — Admin back-office + analytics

