// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !caller) return json({ error: "invalid_session" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Caller must be super_admin
    const { data: callerIsSuper } = await admin.rpc("has_role", {
      _user_id: caller.id,
      _role: "super_admin" as any,
    });
    if (!callerIsSuper) return json({ error: "forbidden" }, 403);

    // Parse + validate body
    const body = await req.json().catch(() => ({}));
    const target_user_id = String(body?.user_id || "").trim();
    const reason = typeof body?.reason === "string" ? body.reason.slice(0, 500) : null;
    const redirect_path = typeof body?.redirect_path === "string"
      ? body.redirect_path
      : "/portal";

    if (!UUID_RE.test(target_user_id)) {
      return json({ error: "invalid_user_id" }, 400);
    }
    if (target_user_id === caller.id) {
      return json({ error: "cannot_impersonate_self" }, 400);
    }

    // Block impersonation of other super_admins
    const { data: targetIsSuper } = await admin.rpc("has_role", {
      _user_id: target_user_id,
      _role: "super_admin" as any,
    });
    if (targetIsSuper) return json({ error: "cannot_impersonate_super_admin" }, 403);

    // Fetch target email
    const { data: targetUser, error: targetErr } = await admin.auth.admin.getUserById(
      target_user_id,
    );
    if (targetErr || !targetUser?.user?.email) {
      return json({ error: "target_not_found" }, 404);
    }
    const targetEmail = targetUser.user.email;

    // Generate magic link (TTL handled by Supabase Auth — typically 1h)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
      options: {
        redirectTo: `${req.headers.get("origin") || ""}/impersonating?path=${encodeURIComponent(redirect_path)}`,
      },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      console.error("[impersonate-user] generateLink failed:", linkErr);
      return json({ error: "link_generation_failed", detail: linkErr?.message }, 500);
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Immutable audit log
    try {
      await admin.rpc("append_audit_log", {
        _action: "impersonation.started",
        _entity_type: "user",
        _entity_id: target_user_id,
        _organization_id: null,
        _payload: {
          executed_by: caller.id,
          executed_by_email: caller.email,
          target_email: targetEmail,
          expires_at: expiresAt,
          reason,
        },
      } as any);
    } catch (e) {
      console.warn("[impersonate-user] audit log failed:", e);
    }

    // GDPR transparency: notify the user being impersonated (best-effort)
    try {
      await admin.rpc("dispatch_email_event", {
        _event: "user.impersonated",
        _organization_id: null,
        _recipient_email: targetEmail,
        _recipient_user_id: target_user_id,
        _dedupe_key: `impersonation:${target_user_id}:${Date.now()}`,
        _variables: {
          firstName: (targetUser.user.user_metadata as any)?.full_name?.split(" ")?.[0] ?? "",
          adminEmail: caller.email,
          impersonatedAt: new Date().toISOString(),
          reason: reason ?? "Support technique",
        },
      } as any);
    } catch (e) {
      console.warn("[impersonate-user] notification email failed:", e);
    }

    return json({
      success: true,
      action_link: linkData.properties.action_link,
      target_email: targetEmail,
      expires_at: expiresAt,
    });
  } catch (e: any) {
    console.error("[impersonate-user] unexpected:", e);
    return json({ error: "internal_error", detail: e?.message ?? String(e) }, 500);
  }
});
