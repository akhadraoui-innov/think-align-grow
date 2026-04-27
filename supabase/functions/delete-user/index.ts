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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    // Identify caller
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !caller) return json({ error: "invalid_session" }, 401);

    // Service role for privileged ops
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Caller must be super_admin
    const { data: callerIsSuper } = await admin.rpc("has_role", {
      _user_id: caller.id,
      _role: "super_admin" as any,
    });
    if (!callerIsSuper) return json({ error: "forbidden" }, 403);

    // Rate limiting : 5 suppressions / heure / super_admin
    const { data: rl } = await admin.rpc("check_rate_limit", {
      _user_id: caller.id,
      _action_key: "delete-user",
      _max_calls: 5,
      _window_minutes: 60,
    } as any);
    if (rl && (rl as any).allowed === false) {
      return json({ error: "rate_limit_exceeded", detail: rl }, 429);
    }

    // Parse + validate body
    const body = await req.json().catch(() => ({}));
    const target_user_id = String(body?.user_id || "").trim();
    const mode = body?.mode === "hard_delete" ? "hard_delete" : "anonymize";

    if (!UUID_RE.test(target_user_id)) {
      return json({ error: "invalid_user_id" }, 400);
    }
    if (target_user_id === caller.id) {
      return json({ error: "cannot_delete_self" }, 400);
    }

    // Block deletion of any super_admin (protect founder & co-admins)
    const { data: targetIsSuper } = await admin.rpc("has_role", {
      _user_id: target_user_id,
      _role: "super_admin" as any,
    });
    if (targetIsSuper) return json({ error: "cannot_delete_super_admin" }, 403);

    // 1. Build RGPD archive (best-effort; never block deletion)
    let archive: any = null;
    try {
      const { data: emailExport } = await admin.rpc("export_user_email_data", {
        _user_id: target_user_id,
      });
      const { data: profile } = await admin
        .from("profiles")
        .select("*")
        .eq("user_id", target_user_id)
        .maybeSingle();
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", target_user_id);
      const { data: memberships } = await admin
        .from("organization_members")
        .select("organization_id, role, created_at")
        .eq("user_id", target_user_id);
      archive = {
        exported_at: new Date().toISOString(),
        user_id: target_user_id,
        profile,
        roles,
        organization_memberships: memberships,
        email_data: emailExport,
      };
    } catch (e) {
      console.warn("[delete-user] archive build failed:", e);
    }

    // 2. Anonymize email-related data
    try {
      await admin.rpc("erase_user_email_data", { _user_id: target_user_id });
    } catch (e) {
      console.warn("[delete-user] erase_user_email_data failed:", e);
    }

    // 3. Anonymize profile (keep row to preserve historical FKs)
    await admin
      .from("profiles")
      .update({
        display_name: "Utilisateur supprimé",
        email: null,
        avatar_url: null,
        job_title: null,
        phone: null,
        bio: null,
        linkedin_url: null,
        location: null,
        status: "deleted",
      } as any)
      .eq("user_id", target_user_id);

    // 4. Strip access (roles, memberships, notifications)
    await admin.from("user_roles").delete().eq("user_id", target_user_id);
    await admin.from("organization_members").delete().eq("user_id", target_user_id);
    // Optional tables — ignore errors if not present
    try { await admin.from("team_members").delete().eq("user_id", target_user_id); } catch { }
    try { await admin.from("notifications").delete().eq("user_id", target_user_id); } catch { }

    // 5. Hard delete from auth if requested
    if (mode === "hard_delete") {
      const { error: delErr } = await admin.auth.admin.deleteUser(target_user_id);
      if (delErr) {
        console.error("[delete-user] auth.admin.deleteUser failed:", delErr);
        return json({ error: "auth_delete_failed", detail: delErr.message, archive }, 500);
      }
    }

    // 6. Immutable audit log
    try {
      await admin.rpc("append_audit_log", {
        _action: "user.deleted",
        _entity_type: "user",
        _entity_id: target_user_id,
        _organization_id: null,
        _payload: { mode, executed_by: caller.id },
      } as any);
    } catch (e) {
      console.warn("[delete-user] audit log failed:", e);
    }

    return json({ success: true, mode, archive });
  } catch (e: any) {
    console.error("[delete-user] unexpected error:", e);
    return json({ error: "internal_error", detail: e?.message ?? String(e) }, 500);
  }
});
