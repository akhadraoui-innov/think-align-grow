import {
  TableProperties, BarChart3, Percent, PenLine, Scale, Minus, Quote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface QuoteWidget {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  html: string;
}

export const QUOTE_WIDGETS: QuoteWidget[] = [
  {
    id: "investment-table",
    label: "Tableau d'investissement",
    description: "Table 4 colonnes : Poste, Détail, Fréquence, Montant",
    icon: TableProperties,
    html: `<h3>Investissement</h3>
<table>
  <thead><tr><th>Poste</th><th>Détail</th><th>Fréquence</th><th>Montant HT</th></tr></thead>
  <tbody>
    <tr><td>Licence SaaS</td><td>Accès plateforme complète</td><td>Mensuel</td><td>— €</td></tr>
    <tr><td>Setup</td><td>Configuration & onboarding</td><td>One-shot</td><td>— €</td></tr>
    <tr><td>Accompagnement</td><td>Support dédié</td><td>Mensuel</td><td>— €</td></tr>
  </tbody>
</table>`,
  },
  {
    id: "kpi-summary",
    label: "Résumé KPI",
    description: "Tableau synthétique MRR / ARR / Total",
    icon: BarChart3,
    html: `<h3>Synthèse financière</h3>
<table>
  <thead><tr><th>Indicateur</th><th>Valeur</th></tr></thead>
  <tbody>
    <tr><td><strong>MRR</strong></td><td>— €/mois</td></tr>
    <tr><td><strong>ARR</strong></td><td>— €/an</td></tr>
    <tr><td><strong>Total contrat</strong></td><td>— €</td></tr>
  </tbody>
</table>`,
  },
  {
    id: "discount-block",
    label: "Bloc remise",
    description: "Mise en avant d'une remise ou économie",
    icon: Percent,
    html: `<blockquote><p><strong>🎁 Remise engagement</strong> — En s'engageant sur la durée, vous bénéficiez d'une remise de <strong>—%</strong> sur l'abonnement, soit une économie de <strong>— €/an</strong>.</p></blockquote>`,
  },
  {
    id: "signature-block",
    label: "Bloc signature",
    description: "Zone de signature Client / Prestataire",
    icon: PenLine,
    html: `<h3>Acceptation</h3>
<table>
  <thead><tr><th>Client</th><th>Prestataire</th></tr></thead>
  <tbody>
    <tr><td>Nom :</td><td>GROWTHINNOV</td></tr>
    <tr><td>Date :</td><td>Date :</td></tr>
    <tr><td>Signature :</td><td>Signature :</td></tr>
    <tr><td> </td><td> </td></tr>
  </tbody>
</table>`,
  },
  {
    id: "conditions-block",
    label: "Conditions générales",
    description: "Clauses standard pré-remplies",
    icon: Scale,
    html: `<h3>Conditions générales</h3>
<ul>
  <li>Les tarifs sont exprimés en euros hors taxes (HT).</li>
  <li>La facturation débute à la date de signature du bon de commande.</li>
  <li>Paiement à 30 jours date de facture par virement bancaire.</li>
  <li>En cas de résiliation anticipée, les montants restants sont dus.</li>
  <li>La prestation est soumise aux Conditions Générales de Vente en vigueur.</li>
</ul>`,
  },
  {
    id: "separator",
    label: "Séparateur",
    description: "Ligne de séparation décorative",
    icon: Minus,
    html: `<hr>`,
  },
  {
    id: "highlight-block",
    label: "Citation / mise en avant",
    description: "Encadré avec bordure colorée",
    icon: Quote,
    html: `<blockquote><p>Texte mis en avant — modifiez ce contenu selon vos besoins.</p></blockquote>`,
  },
];
