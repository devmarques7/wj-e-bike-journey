import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Action = "set_active" | "delete";
type Role = "admin" | "staff" | "customer" | "guest";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const userId = String(body.user_id ?? "").trim();
    const action = String(body.action ?? "") as Action;
    if (!userId) return json({ error: "user_id required" }, 400);
    if (userId === callerId) return json({ error: "You cannot modify your own account here" }, 400);

    if (action === "set_active") {
      const active = body.active !== false;
      const upd = await admin.auth.admin.updateUserById(userId, {
        ban_duration: active ? "none" : "876000h",
      } as any);
      if (upd.error) return json({ error: upd.error.message }, 500);
      await admin.from("profiles").update({ is_active: active }).eq("user_id", userId);
      return json({ success: true, is_active: active });
    }

    if (action === "delete") {
      // Best-effort cleanup of related rows
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.from("member_invitations").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("user_id", userId);
      const del = await admin.auth.admin.deleteUser(userId);
      if (del.error) return json({ error: del.error.message }, 500);
      return json({ success: true, deleted: true });
    }

    if (action === "update_credentials") {
      const email = body.email ? String(body.email).trim() : undefined;
      const password = body.password ? String(body.password) : undefined;
      if (!email && !password) return json({ error: "Provide email or password" }, 400);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Invalid email" }, 400);
      if (password && password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
      const attrs: Record<string, unknown> = {};
      if (email) attrs.email = email;
      if (password) attrs.password = password;
      const upd = await admin.auth.admin.updateUserById(userId, attrs as any);
      if (upd.error) return json({ error: upd.error.message }, 500);
      if (email) await admin.from("profiles").update({ email }).eq("user_id", userId);
      return json({ success: true, email_updated: !!email, password_updated: !!password });
    }

    if (action === "update_role") {
      const role = String(body.role ?? "") as Role;
      if (!["admin", "staff", "customer", "guest"].includes(role)) {
        return json({ error: "Invalid role" }, 400);
      }
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.from("user_roles").insert({ user_id: userId, role });
      return json({ success: true, role });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}