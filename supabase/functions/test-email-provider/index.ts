// Test connection of an email provider config
// Verifies credentials by performing a lightweight provider-specific check.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Missing Authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { config_id } = await req.json();
    if (!config_id) {
      return new Response(JSON.stringify({ ok: false, error: "config_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, serviceKey);

    const { data: cfg, error: cfgErr } = await admin
      .from("email_provider_configs")
      .select("id, provider_code, from_email, credentials_encrypted, organization_id")
      .eq("id", config_id)
      .single();
    if (cfgErr || !cfg) throw new Error("Config introuvable");

    // Permission gate: SaaS team for global configs, org admin for org configs
    const { data: isSaas } = await admin.rpc("is_saas_team", { _user_id: user.id });
    if (!cfg.organization_id && !isSaas) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let creds: any = {};
    if (cfg.credentials_encrypted) {
      const { data: dec } = await admin.rpc("decrypt_email_credentials", {
        _encrypted: cfg.credentials_encrypted,
        _key: "growthinnov_default_key_v1",
      });
      try { creds = JSON.parse(dec || "{}"); } catch { creds = {}; }
    }

    let ok = false;
    let detail = "";

    switch (cfg.provider_code) {
      case "lovable": {
        const key = Deno.env.get("LOVABLE_API_KEY");
        ok = !!key;
        detail = ok ? "Lovable AI Gateway accessible" : "LOVABLE_API_KEY manquant";
        break;
      }
      case "resend": {
        const k = creds.api_key;
        if (!k) { detail = "API key manquante"; break; }
        const r = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${k}` },
        });
        ok = r.ok;
        detail = ok ? "Resend authentifié" : `Resend: HTTP ${r.status}`;
        break;
      }
      case "sendgrid": {
        const k = creds.api_key;
        if (!k) { detail = "API key manquante"; break; }
        const r = await fetch("https://api.sendgrid.com/v3/user/profile", {
          headers: { Authorization: `Bearer ${k}` },
        });
        ok = r.ok;
        detail = ok ? "SendGrid authentifié" : `SendGrid: HTTP ${r.status}`;
        break;
      }
      case "smtp": {
        ok = !!(creds.host && creds.port && creds.username);
        detail = ok ? "Paramètres SMTP présents (test réel à l'envoi)" : "Champs SMTP incomplets";
        break;
      }
      default:
        detail = `Provider ${cfg.provider_code} non testable`;
    }

    // Circuit breaker status
    const { data: cbOk } = await admin.rpc("check_circuit_breaker", { _provider_code: cfg.provider_code });

    await admin.rpc("append_audit_log", {
      _action: "email.provider.test",
      _entity_type: "email_provider_config",
      _entity_id: cfg.id,
      _organization_id: cfg.organization_id,
      _payload: { ok, detail, provider: cfg.provider_code },
    });

    return new Response(JSON.stringify({
      ok,
      detail,
      circuit_breaker: cbOk === false ? "open" : "closed",
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
