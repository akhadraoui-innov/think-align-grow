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

const ALLOWED_ROLES = ["owner", "admin", "member", "lead", "facilitator", "manager", "guest"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "missing_auth" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "invalid_session" }, 401);

    const body = await req.json().catch(() => ({}));
    const { email, role, organization_id, resend_token } = body as {
      email?: string;
      role?: string;
      organization_id?: string;
      resend_token?: string;
    };

    if (!email || !organization_id || !role) {
      return json({ error: "missing_fields" }, 400);
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return json({ error: "invalid_role" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Vérifie que l'appelant est admin de l'org OU SaaS team
    const { data: isAdmin } = await admin.rpc("is_org_admin", { _user_id: user.id, _org_id: organization_id });
    const { data: isSaas } = await admin.rpc("is_saas_team", { _user_id: user.id });
    if (!isAdmin && !isSaas) {
      return json({ error: "forbidden" }, 403);
    }

    let token: string;
    let invitationId: string;

    if (resend_token) {
      const { data: existing, error: findErr } = await admin
        .from("organization_invitations")
        .select("*")
        .eq("token", resend_token)
        .maybeSingle();
      if (findErr || !existing) return json({ error: "invitation_not_found" }, 404);
      token = existing.token;
      invitationId = existing.id;

      // Reset expiration
      await admin
        .from("organization_invitations")
        .update({ expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() })
        .eq("id", invitationId);
    } else {
      // Crée une nouvelle invitation
      const { data: created, error: insertErr } = await admin
        .from("organization_invitations")
        .insert({
          organization_id,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
        })
        .select()
        .single();
      if (insertErr) return json({ error: insertErr.message }, 500);
      token = created.token;
      invitationId = created.id;
    }

    // Récupère le nom de l'organisation et inviteur
    const { data: org } = await admin.from("organizations").select("name").eq("id", organization_id).maybeSingle();
    const { data: inviter } = await admin.from("profiles").select("display_name, email").eq("user_id", user.id).maybeSingle();

    const acceptUrl = `https://heeplab.com/invitation/${token}`;

    // Tente d'envoyer un email via l'infra transactionnelle si disponible
    let emailSent = false;
    try {
      const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "organization-invitation",
          recipientEmail: email,
          idempotencyKey: `org-invite-${invitationId}`,
          templateData: {
            organizationName: org?.name ?? "votre organisation",
            inviterName: inviter?.display_name ?? inviter?.email ?? "Un administrateur",
            role,
            acceptUrl,
          },
        },
      });
      emailSent = !sendErr;
    } catch (_) {
      emailSent = false;
    }

    return json({ success: true, invitation_id: invitationId, token, accept_url: acceptUrl, email_sent: emailSent });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
