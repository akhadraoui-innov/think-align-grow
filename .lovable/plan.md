

# Plan — Fix KPIs vides sur la page "Mes Certificats"

## Problème

La base de données stocke `average_score`, `total_hours`, `user_name` dans `certificate_data`, mais `AcademyCertificates.tsx` lit `score`, `total_time_hours`, `holder_name`, `modules_completed`. Ces clés n'existent pas → tout affiche 0.

## Solution

Ajouter des fallbacks dans `AcademyCertificates.tsx` (même correction déjà faite sur `PortalCertificateDetail.tsx`) :

### Ligne 68-70 — KPIs globaux
```
score:            c.certificate_data?.score || c.certificate_data?.average_score || 0
total_time_hours: c.certificate_data?.total_time_hours ?? c.certificate_data?.total_hours ?? 0
modules_completed: c.certificate_data?.modules_completed || c.certificate_data?.modules_detail?.length || 0
```

### Ligne 136 — ScoreGauge dans la card
```
certData.score || certData.average_score || 0
```

### Ligne 143-145 — Détails dans la card
```
modules: certData.modules_completed || certData.modules_detail?.length || 0
heures:  certData.total_time_hours ?? certData.total_hours ?? 0
```

### Ligne ~173 — Dialog certificat (holder_name)
```
certData.holder_name || certData.user_name || profile?.display_name
```

## Fichier impacté

| Fichier | Action |
|---------|--------|
| `src/pages/AcademyCertificates.tsx` | Ajouter fallbacks sur 6 endroits où les champs sont lus |

