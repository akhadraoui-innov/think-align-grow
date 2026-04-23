import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Webhook, RefreshCw, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PROJECT_REF = "yucwxukikfianvaokebs";

const PROVIDERS = [
  {
    code: "resend",
    label: "Resend",
    docsUrl: "https://resend.com/docs/dashboard/webhooks/introduction",
    instructions: [
      "Aller dans Resend → Dashboard → Webhooks → Add Endpoint.",
      "Coller l'URL ci-dessous comme Endpoint URL.",
      "Sélectionner les évènements : email.delivered, email.bounced, email.complained, email.opened, email.clicked.",
      "Resend génère un secret commençant par whsec_… → cliquer Régénérer ici puis le configurer dans Resend.",
    ],
  },
  {
    code: "sendgrid",
    label: "SendGrid",
    docsUrl: "https://docs.sendgrid.com/for-developers/tracking-events/event",
    instructions: [
      "Aller dans SendGrid → Settings → Mail Settings → Event Webhook.",
      "Coller l'URL ci-dessous comme HTTP Post URL.",
      "Activer Signed Event Webhook avec HMAC-SHA256.",
      "Coller le secret généré ci-dessous et cocher tous les évènements souhaités.",
    ],
  },
  {
    code: "smtp",
    label: "Generic SMTP/Webhook",
    docsUrl: "",
    instructions: [
      "Pour les fournisseurs SMTP custom, configurer l'envoi d'évènements via webhook avec header X-Signature.",
      "Le serveur calcule HMAC-SHA256(secret, body) et envoie en hex.",
    ],
  },
];

export function EmailWebhookReceiverPanel({ organizationId }: { organizationId: string | null }) {
  const [activeTab, setActiveTab] = useState("resend");
  const [copied, setCopied] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [rotating, setRotating] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: secrets = [], isLoading } = useQuery({
    queryKey: ["email-webhook-secrets", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_webhook_secrets")
        .select("*")
        .order("provider_code");
      if (error) throw error;
      return data;
    },
  });

  const buildUrl = (code: string) => {
    const base = `https://${PROJECT_REF}.supabase.co/functions/v1/email-events?provider=${code}`;
    return organizationId ? `${base}&organization_id=${organizationId}` : base;
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copié");
    setTimeout(() => setCopied(null), 1500);
  };

  const handleRotate = async (providerCode: string) => {
    setRotating(providerCode);
    try {
      const { data, error } = await supabase.rpc("rotate_email_webhook_secret", {
        _provider_code: providerCode,
        _organization_id: organizationId,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["email-webhook-secrets"] });
      toast.success("Secret généré", {
        description: "Pensez à le configurer chez le fournisseur immédiatement — il ne sera plus affiché en clair après navigation.",
      });
      // Reveal once
      setRevealed((r) => ({ ...r, [providerCode]: true }));
      // Force display the new secret
      if (data) {
        await navigator.clipboard.writeText(data as string);
      }
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    } finally {
      setRotating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Webhook className="h-4 w-4 text-primary" />
          Webhook entrant — Bounces & Engagement
        </CardTitle>
        <CardDescription>
          Configurez chez chaque fournisseur l'URL ci-dessous pour recevoir bounces, plaintes et désinscriptions
          en temps réel. Les adresses qui rebondissent sont automatiquement ajoutées à la liste de suppression.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {PROVIDERS.map((p) => (
              <TabsTrigger key={p.code} value={p.code}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PROVIDERS.map((provider) => {
            const secret = secrets.find(
              (s) => s.provider_code === provider.code && s.organization_id === organizationId,
            );
            const url = buildUrl(provider.code);
            const isRevealed = revealed[provider.code];

            return (
              <TabsContent key={provider.code} value={provider.code} className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-medium">URL du webhook</label>
                  <div className="flex gap-2 mt-1">
                    <Input value={url} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(url, `${provider.code}-url`)}
                    >
                      {copied === `${provider.code}-url` ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Secret HMAC</label>
                    {secret && (
                      <span className="text-[10px] text-muted-foreground">
                        Dernière rotation : {new Date(secret.last_rotated_at).toLocaleString("fr-FR")}
                      </span>
                    )}
                  </div>
                  {isLoading ? (
                    <div className="h-9 w-full bg-muted/50 rounded animate-pulse mt-1" />
                  ) : secret ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={isRevealed ? secret.secret : "•".repeat(48)}
                        readOnly
                        className="font-mono text-xs"
                        type={isRevealed ? "text" : "password"}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRevealed((r) => ({ ...r, [provider.code]: !r[provider.code] }))}
                      >
                        {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(secret.secret, `${provider.code}-secret`)}
                      >
                        {copied === `${provider.code}-secret` ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate(provider.code)}
                        disabled={rotating === provider.code}
                      >
                        <RefreshCw
                          className={`h-3 w-3 mr-1 ${rotating === provider.code ? "animate-spin" : ""}`}
                        />
                        Régénérer
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">Aucun secret configuré</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleRotate(provider.code)}
                        disabled={rotating === provider.code}
                      >
                        <RefreshCw
                          className={`h-3 w-3 mr-1 ${rotating === provider.code ? "animate-spin" : ""}`}
                        />
                        Générer un secret
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium">Instructions de configuration</p>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                    {provider.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  {provider.docsUrl && (
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Documentation officielle ↗
                    </a>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
