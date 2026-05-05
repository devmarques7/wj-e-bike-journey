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
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string" || !/^\+[1-9]\d{6,14}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "Invalid phone (E.164 expected)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Identify caller (optional - if user is authed)
    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth) {
      const token = auth.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256Hex(code + ":" + phone);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insErr } = await supabase.from("phone_otps").insert({
      user_id: userId,
      phone,
      code_hash: codeHash,
      expires_at: expiresAt,
    });
    if (insErr) throw insErr;

    // Send via WhatsApp Cloud API
    const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const WA_TEMPLATE = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "verification_code";

    let waResult: any = { skipped: true };
    let devCode: string | undefined;

    if (WA_TOKEN && WA_PHONE_ID) {
      const to = phone.replace(/^\+/, "");
      const waResp = await fetch(
        `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WA_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
              name: WA_TEMPLATE,
              language: { code: "en" },
              components: [
                {
                  type: "body",
                  parameters: [{ type: "text", text: code }],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [{ type: "text", text: code }],
                },
              ],
            },
          }),
        }
      );
      waResult = await waResp.json();
      if (!waResp.ok) {
        console.error("WhatsApp send failed", waResp.status, waResult);
        // Surface code in dev so flow is testable even if template not approved yet
        devCode = code;
      }
    } else {
      console.warn("WhatsApp creds missing, returning code in response (dev mode)");
      devCode = code;
    }

    return new Response(
      JSON.stringify({ success: true, dev_code: devCode, wa: waResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-phone-otp error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});