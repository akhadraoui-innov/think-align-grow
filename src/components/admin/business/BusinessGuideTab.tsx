import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Map, DollarSign, ShoppingCart, Gem, TrendingUp, Target, AlertTriangle, BookOpen } from "lucide-react";

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
    <p className="text-xs text-foreground leading-relaxed">{children}</p>
  </div>
);

const sections = [
  {
    id: "howto",
    icon: BookOpen,
    title: "Mode d'emploi du module",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p><strong className="text-foreground">Workflow recommandé :</strong></p>
        <ol className="list-decimal ml-4 space-y-1.5">
          <li><strong>Vue d'ensemble (BMC)</strong> — Posez le Business Model Canvas global. C'est votre ancre stratégique.</li>
          <li><strong>Offre</strong> — Définissez les modules activés, leur delivery (SaaS / CaaS) et le scoring par segment.</li>
          <li><strong>Pricing</strong> — Choisissez le modèle de tarification, configurez les rôles & plans, les crédits, les setup fees et les services.</li>
          <li><strong>Channels</strong> — Répartissez les canaux d'acquisition, leurs coûts et taux de conversion.</li>
          <li><strong>Marché</strong> — Dimensionnez TAM/SAM/SOM, analysez les segments, les concurrents et la SWOT.</li>
          <li><strong>Partenaires</strong> — Structurez les tiers de partenariat, le pipeline et les projections d'expansion géo.</li>
          <li><strong>Enterprise</strong> — Qualifiez les prospects MEDDIC, configurez les use cases sectoriels.</li>
          <li><strong>Simulateur</strong> — Lancez les projections financières sur 36 mois, l'analyse de sensibilité et les scénarios.</li>
        </ol>
        <Tip>Chaque onglet est dynamique — les données que vous saisissez sont réutilisées par les autres onglets et le simulateur.</Tip>
      </div>
    ),
  },
  {
    id: "gtm",
    icon: Map,
    title: "Framework Go-to-Market",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p className="text-foreground font-semibold">ICP → Channels → Messaging → Launch → Iterate</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-2">
          {[
            { step: "ICP", desc: "Ideal Customer Profile — qui a le plus mal, le plus de budget et le cycle le plus court ?" },
            { step: "Channels", desc: "Où sont-ils ? Inbound, outbound, partenaires, événements — choisir 2-3 max au démarrage." },
            { step: "Messaging", desc: "Quel pain point résolvez-vous en 1 phrase ? Adaptez par persona (DG vs DRH vs DSI)." },
            { step: "Launch", desc: "MVP → Early adopters → Case studies → Scale. Ne pas chercher le marché large trop tôt." },
            { step: "Iterate", desc: "Mesurer CAC, LTV, payback. Si CAC > LTV/3, réajuster le channel mix." },
          ].map(s => (
            <Card key={s.step} className="border-border">
              <CardContent className="p-3">
                <Badge variant="secondary" className="text-[10px] mb-1.5">{s.step}</Badge>
                <p className="text-[11px]">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tip>Concentrez 80% de l'effort commercial sur 1-2 segments ICP au démarrage. Le reste viendra par effet de halo.</Tip>
      </div>
    ),
  },
  {
    id: "revenue",
    icon: DollarSign,
    title: "Revenue Management — Quel modèle choisir ?",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <table className="w-full border border-border rounded-lg overflow-hidden text-[11px]">
          <thead><tr className="bg-muted/50"><th className="p-2 text-left font-medium text-foreground">Modèle</th><th className="p-2 text-left font-medium text-foreground">Quand ?</th><th className="p-2 text-left font-medium text-foreground">Avantage clé</th><th className="p-2 text-left font-medium text-foreground">Risque</th></tr></thead>
          <tbody>
            <tr className="border-t border-border/50"><td className="p-2 font-medium text-foreground">Seat-based</td><td className="p-2">Équipes stables, budget prévisible</td><td className="p-2">MRR garanti</td><td className="p-2">Shelfware, frein adoption</td></tr>
            <tr className="border-t border-border/50"><td className="p-2 font-medium text-foreground">Usage-based</td><td className="p-2">Usage variable, POC, startups</td><td className="p-2">Aligné valeur</td><td className="p-2">Revenus imprévisibles</td></tr>
            <tr className="border-t border-border/50"><td className="p-2 font-medium text-foreground">Hybride</td><td className="p-2">ETI, grands comptes, scale</td><td className="p-2">Stabilité + upside</td><td className="p-2">Complexité pricing</td></tr>
            <tr className="border-t border-border/50"><td className="p-2 font-medium text-foreground">CaaS</td><td className="p-2">Transformation, cabinets conseil</td><td className="p-2">Ticket élevé, relation</td><td className="p-2">Scalabilité limitée</td></tr>
          </tbody>
        </table>
        <Tip>Le modèle hybride (base + crédits) est le meilleur compromis pour la plupart des cas B2B. Commencez par là et ajustez par segment.</Tip>
      </div>
    ),
  },
  {
    id: "models",
    icon: ShoppingCart,
    title: "Modèles de vente — Les 5 combinaisons",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "SaaS pur", desc: "Self-service, acquisition inbound, faible CAC. Idéal pour les solo/team.", rev: "MRR + crédits" },
            { name: "SaaS + Conseil", desc: "Plateforme + missions ponctuelles. La valeur est dans l'accompagnement initial.", rev: "MRR + setup + services one-shot" },
            { name: "Academy Groupe", desc: "Licence bulk apprenants, prix dégressif. Engagement annuel, valeur dans la certification.", rev: "ARR volume + setup" },
            { name: "CaaS", desc: "La techno au service du conseil. Le consultant utilise la plateforme comme outil de mission.", rev: "Forfait projet + licence" },
            { name: "Partnership / White-label", desc: "Revente par des partenaires. Commission + licence. Scalabilité maximale.", rev: "Commission + licence white-label" },
          ].map(m => (
            <Card key={m.name} className="border-border">
              <CardContent className="p-3">
                <p className="text-foreground font-semibold text-xs">{m.name}</p>
                <p className="text-[11px] mt-1">{m.desc}</p>
                <Badge variant="outline" className="text-[9px] mt-2">{m.rev}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tip>Ne vendez jamais un seul modèle. Adaptez la combinaison au prospect : un grand compte veut du CaaS, une PME du SaaS pur.</Tip>
      </div>
    ),
  },
  {
    id: "value",
    icon: Gem,
    title: "Où se crée la valeur ajoutée ?",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p className="text-foreground font-semibold">La valeur n'est pas toujours dans l'abonnement</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-border">
            <CardContent className="p-3">
              <p className="text-foreground font-semibold text-xs">💎 Setup (one-shot)</p>
              <p className="text-[11px] mt-1">Audit IA, intégration SSO, migration, formation admins. Parfois le setup vaut plus que 12 mois d'abo.</p>
              <p className="text-[10px] text-primary mt-2">Marge : 60-80%</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3">
              <p className="text-foreground font-semibold text-xs">🔑 Abonnement (récurrent)</p>
              <p className="text-[11px] mt-1">Les managers/admins paient plus cher (79-199€) car ils pilotent. Les users paient peu (9-29€) mais en volume.</p>
              <p className="text-[10px] text-primary mt-2">Clé : pricing par rôle, pas par plan unique</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3">
              <p className="text-foreground font-semibold text-xs">⚡ Usage (crédits)</p>
              <p className="text-[11px] mt-1">Les crédits IA capturent la valeur marginale. Chaque action IA a un coût réel (tokens) et un prix vendu (crédits).</p>
              <p className="text-[10px] text-primary mt-2">Marge par action : 70-90%</p>
            </CardContent>
          </Card>
        </div>
        <Tip>Pour les users à faible valeur perçue, proposez un annuel bas + crédits à l'usage. Pour les managers, un mensuel premium avec crédits inclus. La valeur perçue doit guider le prix.</Tip>
      </div>
    ),
  },
  {
    id: "scale",
    icon: TrendingUp,
    title: "Scalabilité SaaS — KPIs critiques",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { kpi: "NRR", target: "> 110%", desc: "Net Revenue Retention — expansion > churn" },
            { kpi: "Magic Number", target: "> 0.75", desc: "Efficacité commerciale — $ revenu / $ sales" },
            { kpi: "Rule of 40", target: "> 40%", desc: "Growth rate + margin > 40% = healthy" },
            { kpi: "LTV/CAC", target: "> 3x", desc: "Lifetime Value / Coût d'acquisition" },
          ].map(k => (
            <Card key={k.kpi} className="border-border">
              <CardContent className="p-3 text-center">
                <p className="text-foreground font-bold text-lg">{k.kpi}</p>
                <Badge variant="secondary" className="text-[10px] mt-1">{k.target}</Badge>
                <p className="text-[10px] mt-2">{k.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tip>Si votre NRR est {'<'} 100%, concentrez-vous sur la rétention avant l'acquisition. Chaque client perdu coûte 5x plus à remplacer qu'à retenir.</Tip>
      </div>
    ),
  },
  {
    id: "meddic",
    icon: Target,
    title: "Qualification MEDDIC — Scoring Enterprise",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>Le framework MEDDIC qualifie les opportunités Enterprise sur 6 critères (score 1-10) :</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { letter: "M", name: "Metrics", desc: "Quels KPIs le client veut améliorer ?" },
            { letter: "E", name: "Economic Buyer", desc: "Qui signe le chèque ?" },
            { letter: "D", name: "Decision Criteria", desc: "Sur quels critères évaluent-ils ?" },
            { letter: "D", name: "Decision Process", desc: "Quel est le processus de décision ?" },
            { letter: "I", name: "Identify Pain", desc: "Quel problème urgent résolvez-vous ?" },
            { letter: "C", name: "Champion", desc: "Qui pousse en interne pour vous ?" },
          ].map((m, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-3">
                <Badge className="text-[10px] mb-1">{m.letter}</Badge>
                <p className="text-foreground font-semibold text-xs">{m.name}</p>
                <p className="text-[10px] mt-1">{m.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tip>Un deal Enterprise sans Champion identifié a 80% de chances d'échouer. Trouvez votre sponsor interne avant de rédiger la proposition.</Tip>
      </div>
    ),
  },
  {
    id: "risks",
    icon: AlertTriangle,
    title: "Risques marché IA — Navigation de l'incertitude",
    content: (
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { risk: "Hausse des coûts tokens", strategy: "Multi-provider (OpenAI + Gemini + open-source), cache sémantique, négociation volume" },
            { risk: "Commoditisation des agents IA", strategy: "La valeur est dans le contenu propriétaire (400+ cartes, 35 secteurs), pas la techno" },
            { risk: "Build vs Buy chez les clients", strategy: "Démontrer le TCO réel du build : 6-12 mois de dev, maintenance, mise à jour des modèles" },
            { risk: "AI Act (réglementation EU)", strategy: "Conformité comme avantage compétitif — documentation, transparence, certifications" },
          ].map((r, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-3">
                <p className="text-foreground font-semibold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-destructive" />{r.risk}
                </p>
                <p className="text-[11px] mt-1.5">{r.strategy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tip>Le plus grand risque n'est pas la techno — c'est de ne pas avoir assez de traction commerciale avant que les LMS établis n'ajoutent l'IA. Vélocité {">"} perfection.</Tip>
      </div>
    ),
  },
];

export function BusinessGuideTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Guide stratégique</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Documentation de référence — GTM, pricing, scalabilité, qualification</p>
      </div>
      <Accordion type="multiple" defaultValue={["howto"]} className="space-y-2">
        {sections.map(s => (
          <AccordionItem key={s.id} value={s.id} className="border border-border rounded-lg px-4 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline gap-2">
              <span className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-primary" />
                {s.title}
              </span>
            </AccordionTrigger>
            <AccordionContent>{s.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
