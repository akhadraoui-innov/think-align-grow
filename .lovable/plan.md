

# Suite v2.6.1 — Lots E1 → E4 séquentiels

Exécution dans l'ordre recommandé : **E1 (Sécurité Enterprise) → E2 (Délivrabilité) → E3 (Notifications & UX) → E4 (Health & Observabilité)**.

Chaque lot est livré, audité, puis on enchaîne sur le suivant.

---

## Lot E1 — Sécurité & Compliance Enterprise

**Objectif** : fermer les 3 chantiers sécurité critiques restants, débloquer commercialisation Enterprise.

### Backend (BDD + migrations)
- Table `audit_logs_immutable(id, prev_hash, current_hash, actor_id, organization_id, action, entity_type, entity_id, payload jsonb, created_at)` — append-only, RLS read-only pour SaaS team.
- Trigger `BEFORE INSERT` qui calcule `current_hash = sha256(prev_hash || row_payload)` ; `prev_hash` lu depuis dernière ligne ou `'GENESIS'`.
- Refus de tout `UPDATE`/`DELETE` via policy + revoke privileges.
- Fonction `verify_audit_chain_integrity()` retournant `{valid: bool, broken_at: uuid}` pour vue admin.
- Fonction `is_url_allowed(url text)` : parse host, refuse IPs privées (10/8, 172.16/12, 192.168/16, 127/8, ::1, link-local), refuse `localhost`, valide contre table `webhook_allowlist_domains`.
- Hook dans `dispatch_email_event` et tout `net.http_post` sortant : `IF NOT is_url_allowed(target) THEN RAISE EXCEPTION`.

### Edge Functions
- `trigger-email/index.ts` : ajouter sanitization HTML stricte avant envoi (allowlist tags via DOMPurify-equivalent Deno : `<a href>`, `<p>`, `<br>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<img src alt>`, `<table>`, `<tr>`, `<td>`, `<h1-h6>`). Bloque `<script>`, `<iframe>`, `on*=`, `javascript:`.
- Détecteur anti-phishing : flag les emails contenant URL avec text-link ≠ href-domain (`<a href="evil.com">paypal.com</a>`), homoglyphes Unicode courants (Cyrillic `а` vs Latin `a`), URLs raccourcies non-allowlistées.
- Si flag → log dans `email_security_flags` + bloque envoi (admin doit valider).

### Frontend (admin)
- Page `/admin/audit` : liste paginée `audit_logs_immutable` avec filtres (actor, action, date, entity_type), badge "Chaîne intègre" en haut (vert/rouge selon `verify_audit_chain_integrity()`), export CSV.
- Onglet "Allowlist webhooks" dans `/admin/settings` : CRUD `webhook_allowlist_domains` (super_admin only).
- Onglet "Security flags" dans `AdminEmails` : liste emails bloqués pour phishing suspect, bouton "Valider et envoyer" / "Confirmer blocage".

### Audit E1
Linter Supabase 0 finding • test chaîne hash (insertion + verify) • test SSRF (tentative `http://169.254.169.254` → bloquée) • test sanitization (script inline → stripped).

---

## Lot E2 — Délivrabilité avancée

**Objectif** : bounces réels Resend/SendGrid → `suppressed_emails` automatique, priority lanes pgmq.

### Backend
- Table `email_webhook_secrets(provider_code, secret, created_at)` chiffrée via vault.
- Migration : ajout colonnes `priority text default 'transactional'` et `dispatched_at` à `pgmq_email_queue` ; index `(priority, enqueued_at)`.
- 3 queues pgmq : `email_transactional`, `email_marketing`, `email_bulk` (création via `email_domain--setup_email_infra` patterns).
- RPC `enqueue_email_priority(payload, priority)` qui route vers la bonne queue.

### Edge Functions
- **Nouvelle** `email-events/index.ts` (publique, `verify_jwt = false`) :
  - Détecte provider via header (`svix-signature` / `resend-signature` / `x-twilio-email-event-webhook-signature`).
  - Vérifie HMAC selon doc provider.
  - Mappe events : `bounce.hard` / `complaint` / `unsubscribe` → INSERT `suppressed_emails` ; `delivered` / `opened` / `clicked` → UPDATE `email_automation_runs.opened_at|clicked_at|delivered_at`.
- `process-email-queue/index.ts` : drainage prioritaire `transactional → marketing → bulk` (boucle 3 reads séquentielles).
- `trigger-email` : utilise `enqueue_email_priority` selon `template.category`.

### Frontend
- `EmailProvidersTab.tsx` : section "Webhook entrant" affichant URL `https://[project].supabase.co/functions/v1/email-events?provider=resend` + secret généré + bouton "Régénérer" + instructions copier-coller pour chaque provider.
- `EmailReliabilityTab.tsx` : ajout panneau "Priority lanes" avec 3 jauges (backlog par queue) + débit observé.

### Audit E2
Test webhook Resend signé/non-signé • bounce test → suppressed_emails • envoi 100 marketing + 5 transactional → vérifier que les 5 transactional partent en premier.

---

## Lot E3 — Notifications in-app & Command Palette

**Objectif** : remplacer pastille décorative par vraies notifications realtime, ajouter Cmd+K global.

### Backend
- Table `notifications(id, user_id, organization_id, type, title, body, link, severity, read_at, created_at)` + RLS user-scoped (`user_id = auth.uid()`).
- Activer realtime publication.
- Triggers DB sur événements clés :
  - `welcome` (after insert profiles)
  - `org.suspended` / `org.reactivated` (after update organizations.status)
  - `quota.warning` (after insert email_quota_usage si > 80%)
  - `certificate.earned` (after insert academy_certificates)
  - `email.failed` (after insert email_send_log si status='dlq')
- Fonction `mark_notifications_read(ids uuid[])`.

### Frontend
- Hook `useNotifications()` : query + canal realtime `notifications:user_id=eq.{uid}`, auto-add nouvelles.
- Composant `NotificationsDropdown.tsx` (header portail + admin) : badge count unread, liste 20 dernières, click → navigate `link` + mark read, "Tout marquer lu".
- `CommandPalette.tsx` (déjà existant partiellement) : étendre actions (recherche templates, automations, users, orgs ; commandes IA ; navigation rapide). Bind global `Cmd+K` / `Ctrl+K` dans `AdminShell` et `PortalShell`.

### Audit E3
Insertion notif via SQL → apparaît temps réel sans refresh • Cmd+K ouvre palette sur toutes pages • permissions RLS testées (user A ne voit pas notifs user B).

---

## Lot E4 — Health Dashboard global & Observabilité

**Objectif** : étendre `EmailReliabilityTab` à vue système complète.

### Backend
- Fonction `get_system_health()` retournant JSON :
  - `providers[]` (depuis `get_email_provider_health`)
  - `cron_jobs[]` (depuis `get_email_cron_health`)
  - `linter_findings_count` (count direct)
  - `pgmq_backlogs[]` (par queue)
  - `secrets_status[]` (vault keys présents)
  - `brand_assets_status` (logo upload présent)
  - `audit_chain_valid` (depuis `verify_audit_chain_integrity`)
- Fonction `get_edge_function_metrics(hours int)` : P50/P95 latence depuis `analytics_query` agrégé.

### Frontend
- Page `/admin/health` (nouvelle route, lien dans `AdminSidebar`) :
  - 6 cartes status (providers, cron, DB linter, queues, secrets, audit chain) avec badges vert/orange/rouge.
  - Sparklines uptime providers 30j.
  - Tableau métriques P50/P95 par edge function.
  - Refresh auto 30s.
- Bandeau sticky en haut de `AdminShell` si finding critique (`error` linter ou `audit_chain_invalid` ou provider down).

### Audit E4
Toutes cartes affichent données réelles • simuler provider down → bandeau apparaît • metrics edge functions cohérents avec logs.

---

## Documentation & Mémoires (à chaque lot)

- `docs/releases/v2.6.1-lot-E{n}.md`
- Mises à jour mémoires : `compliance/audit-log-immutable`, `architecture/circuit-breakers`, `architecture/system-health-dashboard`, `features/in-app-notifications`, `features/email-deliverability-engineering`.

---

## Démarrage

On démarre par **Lot E1 (Sécurité Enterprise)** dès approbation. Audit en fin de E1, puis enchaînement automatique sur E2, E3, E4.

