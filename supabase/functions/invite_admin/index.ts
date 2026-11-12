// Invita a un nuevo administrador. Corre en el servidor de Supabase: SUPABASE_SERVICE_ROLE_KEY nunca llega al navegador.
// Solo puede invocarla un administrador con sesión MFA (public.can_write()).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const redirectTo = Deno.env.get("ADMIN_URL"); // fijo en el servidor: no se acepta del cliente
  if (!redirectTo) return json({ error: "Falta configurar ADMIN_URL en el servidor" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });

  const { data: allowed, error: permErr } = await caller.rpc("can_write");
  if (permErr || allowed !== true) return json({ error: "No autorizado" }, 403);
  const { data: who } = await caller.auth.getUser();

  let email = "";
  try { email = String((await req.json()).email ?? "").trim().toLowerCase(); } catch { /* cuerpo inválido */ }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Correo inválido" }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (invErr || !invited?.user) {
    return json({ error: invErr?.message?.includes("registered")
      ? "Ese correo ya tiene una cuenta. Pídele a Alejo que la agregue como administradora desde Supabase."
      : "No se pudo enviar la invitación" }, 400);
  }
  const { error: insErr } = await admin.from("admins").insert({ user_id: invited.user.id, email, added_by: who?.user?.id ?? null });
  if (insErr) return json({ error: "Invitación enviada pero no se pudo registrar al administrador" }, 500);
  return json({ ok: true, email });
});
