import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, code } = await req.json();
    if (!phone || !code || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth) {
      const token = auth.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const codeHash = await sha256Hex(code + ":" + phone);

    const { data: rows, error } = await supabase
      .from("phone_otps")
      .select("id, expires_at, consumed_at, attempts")
      .eq("phone", phone)
      .eq("code_hash", codeHash)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    const row = rows?.[0];
    if (!row) {
      return new Response(JSON.stringify({ success: false, error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ success: false, error: "Code expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("phone_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    // If we know the user, persist phone + verified flag on profile
    if (userId) {
      await supabase
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("user_id", userId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-phone-otp error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});