

## Analyse PRD vs État actuel — Manques, Améliorations, Évolutions

### Ce qui est implémenté (Sprints 1-8) ✅

Tout ce qui est listé dans le PRD est bien en place : Dashboard admin, CRUD Orgs/Users/Toolkits/Workshops, Design Innovation, Billing, Logs, Settings IA, Profil utilisateur, OrgSwitcher, crédits, quotas, quiz persisté.

---

### Ce qui manque ou est incomplet

#### 1. Paramètres — Page trop limitée

La page `/admin/settings` ne gère que la configuration IA (fournisseur, modèles, prompts). Il manque :

- **Paramètres généraux plateforme** : nom, logo, couleurs, URL, mentions légales
- **Paramètres email** : templates de notification (invitation workshop, reset password, bienvenue)
- **Paramètres de sécurité** : politique de mots de passe, durée de session, 2FA
- **Configuration des rôles** : description des rôles, permissions associées (actuellement hardcodé dans `usePermissions`)
- **Maintenance** : mode maintenance, message personnalisé

#### 2. Profil utilisateur — Trop basique

La page `/profile` n'édite que 3 champs (nom, poste, département). La DB supporte bien plus (ajoutés au Sprint 3) :

- **Champs manquants en édition** : service, pôle, niveau hiérarchique, manager, bio, LinkedIn, localisation, téléphone, email secondaire, intérêts, objectifs
- **Avatar** : pas d'upload (juste initiales)
- **Historique** : pas de vue des workshops passés, challenges, cartes favorites
- **Notifications** : aucune préférence de notification

#### 3. Dashboard admin — Trop sommaire

4 stats + 1 graphique + activité récente. Il manque :

- **Tendances** : courbes d'évolution (utilisateurs, orgs, crédits) sur 30/90 jours
- **Top utilisateurs** : classement par XP, crédits dépensés, sessions
- **Taux de conversion** : inscriptions → première session → récurrence
- **Alertes** : quotas bientôt atteints, abonnements expirant, utilisateurs inactifs
- **Santé plateforme** : edge functions en erreur, temps de réponse IA

#### 4. Dashboard utilisateur — Inexistant

Il n'y a pas de vrai dashboard utilisateur. La page d'accueil (`/`) est une landing marketing statique. Un utilisateur connecté devrait voir :

- **Résumé personnel** : crédits, XP, progression
- **Workshops récents** : les siens + invitations
- **Challenges en cours** : progression
- **Recommandations** : cartes non vues, toolkits à explorer
- **Activité récente** : ses actions

#### 5. Gestion des permissions côté UI

`usePermissions` existe mais n'est utilisé nulle part dans l'admin. Toutes les pages admin sont accessibles à tout membre SaaS team. Il faudrait :

- Masquer les entrées sidebar selon les permissions
- Désactiver les actions non autorisées (ex: un `customer_lead` ne devrait pas pouvoir modifier les toolkits)
- Afficher un message "accès interdit" si navigation directe

#### 6. Gestion des quotas côté admin

Les quotas sont enforced côté utilisateur mais :

- Pas de vue admin montrant les quotas vs usage par org
- Pas d'alerte quand une org approche ses limites
- Pas de possibilité d'ajuster les quotas par org (uniquement par plan)

#### 7. Workshops admin — Vue minimale

La page `/admin/workshops` est un tableau simple sans :

- Fiche détaillée d'un workshop (participants, canvas, réponses, livrables)
- Statistiques par workshop (durée, engagement)
- Actions (archiver, dupliquer, exporter)

#### 8. Invitations et onboarding

- Pas de flux d'invitation d'utilisateur à une org (email avec lien)
- Pas de parcours d'onboarding pour un nouvel utilisateur
- Pas de gestion des invitations en attente

#### 9. Notifications

Aucun système de notification :

- Pas de notifications in-app
- Pas d'emails transactionnels
- Pas de préférences de notification

#### 10. Export et reporting

- Export CSV des logs existe, mais pas d'export pour les autres données
- Pas de rapports périodiques (hebdo/mensuel)
- Pas d'export PDF des livrables workshop

---

### Plan d'évolutions prioritaires

| Priorité | Évolution | Effort |
|----------|-----------|--------|
| **P0** | Dashboard utilisateur (remplacer landing si connecté) | Moyen |
| **P0** | Profil enrichi (tous les champs DB + avatar) | Faible |
| **P1** | Appliquer `usePermissions` dans l'admin sidebar + pages | Faible |
| **P1** | Dashboard admin enrichi (tendances, alertes, tops) | Moyen |
| **P1** | Fiche workshop admin détaillée | Moyen |
| **P1** | Vue quotas/usage par org dans admin | Faible |
| **P2** | Paramètres plateforme (au-delà de l'IA) | Moyen |
| **P2** | Système d'invitations par email | Élevé |
| **P2** | Notifications in-app | Élevé |
| **P3** | Onboarding guidé nouvel utilisateur | Moyen |
| **P3** | Export PDF livrables | Moyen |
| **P3** | Rapports périodiques | Élevé |

### Fichiers impactés (P0-P1)

| Fichier | Changement |
|---------|-----------|
| `src/pages/Index.tsx` | Afficher dashboard si connecté, landing si guest |
| `src/pages/Profile.tsx` | Ajouter tous les champs, upload avatar, historique |
| `src/components/admin/AdminSidebar.tsx` | Filtrer items selon `usePermissions` |
| `src/pages/admin/AdminDashboard.tsx` | Ajouter tendances, alertes, tops |
| `src/pages/admin/AdminSettings.tsx` | Ajouter onglets Général, Sécurité, Rôles |
| `src/pages/admin/AdminWorkshops.tsx` | Route détail + fiche workshop |
| `src/components/admin/OrgUsageTab.tsx` | Ajouter vue quotas vs usage réel |

