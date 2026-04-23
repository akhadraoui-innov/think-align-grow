---
name: Email security flags & SSRF guard
description: Sanitization HTML stricte, détection de phishing et allowlist SSRF pour protéger les envois email et appels webhook
type: feature
---

Trois protections sécurité enterprise :

**1. Sanitization HTML emails** (`_shared/email-security.ts`) :
- Allowlist tags : `a, p, br, strong, em, ul, ol, li, img, table, tr, td, h1-h6, span, div`
- Bloque `<script>`, `<iframe>`, `on*=`, `javascript:`
- Appelée dans `trigger-email/index.ts` avant chaque envoi

**2. Détection anti-phishing** :
- Anchor text vs href domain mismatch (`<a href="evil">paypal.com</a>`)
- Homoglyphes Cyrilliques/Latins
- URL shorteners non-allowlistés
- Si flag → INSERT dans `email_security_flags` + bloque envoi
- UI : onglet "Security" dans `/admin/emails` permet d'approuver ou confirmer le blocage
- RPC `review_email_security_flag(_flag_id, _decision, _notes)`

**3. SSRF guard** (`is_url_allowed(text)`) :
- Bloque IPs privées (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16), localhost, link-local IPv6
- Vérifie contre `webhook_allowlist_domains(domain, is_active, match_suffix)`
- `match_suffix=true` autorise tous les sous-domaines
- UI : onglet "Allowlist webhooks" dans `/admin/settings`
