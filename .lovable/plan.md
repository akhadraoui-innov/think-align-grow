## Régression identifiée

**Cause racine** : la migration de hardening Lot 7 (`20260423103833_bbbce425...sql`) a passé le bucket `academy-assets` en **privé** :
```sql
UPDATE storage.buckets SET public = false WHERE id = 'academy-assets';
```

**Conséquence** :
- 9 parcours ont des URLs stockées sous la forme `https://.../storage/v1/object/public/academy-assets/covers/<id>.jpg`
- Ces URLs renvoient maintenant 400/403 → toutes les images (admin + portal) sont cassées
- Les 18 fichiers existent bien dans le bucket, le problème est uniquement l'accessibilité publique
- Les 10 autres parcours n'ont jamais eu de cover générée (`cover_image_url` vide)

**Impact** : `AdminAcademyPaths`, `PortalAcademiePaths`, `PortalFormations` (toute card de parcours).

## Décision

Repasser `academy-assets` en **bucket public en lecture**, tout en gardant l'écriture restreinte à la SaaS team. C'est la posture habituelle pour des assets de présentation (covers de parcours visibles dès la page d'inscription dans certains contextes).

Alternative écartée : migrer tous les composants vers `createSignedUrl` + cache. Lourd, casse les URLs déjà stockées en DB, et n'apporte aucune valeur sécurité réelle (les covers ne sont pas sensibles).

## Migration prévue

```sql
-- Repasser le bucket en public (lecture)
UPDATE storage.buckets SET public = true WHERE id = 'academy-assets';

-- Recréer la policy SELECT publique (anon + auth) pour covers/
DROP POLICY IF EXISTS "academy_assets_authenticated_read" ON storage.objects;

CREATE POLICY "academy_assets_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'academy-assets');

-- Les policies INSERT/UPDATE/DELETE restent SaaS-team only (inchangées)
```

## Vérifications post-migration

1. Tester en preview `/portal/academie/paths` et `/admin/academy/paths` : les 9 covers existantes doivent réapparaître
2. Confirmer que les 10 parcours sans cover affichent toujours leur fallback (gradient + initiale)
3. Vérifier que `supabase--linter` ne génère pas de nouveau warning critique

## Documentation

- Patch note `docs/releases/v2.9.4-hotfix-academy-covers.md` (régression Lot 7 corrigée)
- Mettre à jour `.lovable/memory/security/operational-hardening.md` pour préciser que `academy-assets` est public en lecture (cas d'usage : covers visibles)
- Index `docs/releases/README.md`

## Hors périmètre

- Régénération automatique des covers manquantes (10 parcours) — à arbitrer séparément
- Migration vers signed URLs — non justifiée pour ce bucket