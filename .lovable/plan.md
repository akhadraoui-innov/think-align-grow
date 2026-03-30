

# Plan — Certificat professionnel premium + QR code + Vue enrichie

## 1. PDF Certificat — Niveau professionnel

Refonte complète de `CertificateDownload.tsx` pour produire un certificat comparable aux meilleurs centres de formation (HEC, Coursera, Google) :

**Page 1 — Certificat principal (paysage A4)**
- Double bordure dorée avec ornements aux coins (losanges, pas de simples cercles)
- Filigrane subtil en fond (motif géométrique léger)
- Logo GROWTHINNOV centré en haut avec tagline
- "CERTIFICAT DE RÉUSSITE" en grande typographie
- Ligne décorative dorée avec ornements
- "Décerné à" + nom de l'apprenant en grande police élégante
- "Pour avoir complété avec succès le parcours" + nom du parcours
- Bloc stats : score global, modules, heures, niveau
- **QR Code** en bas à droite (URL de vérification `https://think-align-grow.lovable.app/verify/{certificateId}`)
- Pied : date d'émission, numéro unique, signature "Directeur pédagogique GROWTHINNOV"

**Page 2 — Relevé de notes (portrait A4)**
- En-tête GROWTHINNOV
- Tableau détaillé des modules (titre, type, score, durée)
- Score moyen, temps total
- QR code + numéro de certificat

**Bibliothèque QR** : Ajouter `qrcode` (npm) pour générer le QR code en data URL, intégré dans le PDF via `addImage`.

## 2. Vue "Mes certificats" — Refonte complète

Refonte de `PortalFormationsCertificates.tsx` et `AcademyCertificates.tsx` :

**Header enrichi**
- KPIs en haut : nombre de certificats, score moyen global, heures totales de formation, parcours en cours
- Titre plus grand et professionnel

**Liste des certificats**
- Cards plus grandes avec : nom du parcours, score en jauge circulaire, niveau (badge couleur), date, nombre de modules, heures
- Icône de téléchargement directement sur la card (sans ouvrir le dialog)

**Dialog certificat enrichi**
- Preview visuelle du certificat plus grande et fidèle au PDF
- QR code visible dans la preview
- Numéro de certificat affiché
- Boutons : Télécharger PDF, Copier le lien de vérification
- Détail par module avec barres de progression plus visuelles

## 3. Fichiers impactés

| Fichier | Action |
|---------|--------|
| `package.json` | Ajouter dépendance `qrcode` |
| `src/components/academy/CertificateDownload.tsx` | Refonte complète — PDF 2 pages, QR code, design premium |
| `src/pages/portal/PortalFormationsCertificates.tsx` | Refonte — KPIs header, cards enrichies, dialog amélioré, QR code visible |
| `src/pages/AcademyCertificates.tsx` | Même refonte pour le cabinet |

## 4. Ordre d'exécution

1. Installer `qrcode` (types inclus)
2. Refondre `CertificateDownload.tsx` — PDF premium 2 pages + QR
3. Refondre `PortalFormationsCertificates.tsx` — KPIs + cards + dialog
4. Refondre `AcademyCertificates.tsx` — miroir portail

