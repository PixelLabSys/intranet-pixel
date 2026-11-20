// Agrega un nuevo administrador solo con su correo (sin enviar invitación). Corre en el servidor de Supabase: SUPABASE_SERVICE_ROLE_KEY nunca llega al navegador.
// Solo puede invocarla un administrador (public.can_write()).
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });

  const { data: allowed, error: permErr } = await caller.rpc("can_write");
  if (permErr || allowed !== true) return json({ error: "No autorizado" }, 403);
  const { data: who } = await caller.auth.getUser();

  let email = "";
  try { email = String((await req.json()).email ?? "").trim().toLowerCase(); } catch { /* cuerpo inválido */ }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Correo inválido" }, 400);

  const admin = createClient(url, service, { auth: { persistSession: false } });

  // Se crea (o se reutiliza) el usuario ya confirmado y SIN contraseña: no se envía ningún correo.
  // La persona entra con "Continuar con Google" usando ese mismo correo; el registro público sigue cerrado.
  let userId: string | null = null;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created?.user) userId = created.user.id;
  else if (createErr && /regist|exist|already/i.test(createErr.message ?? "")) {
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const hit = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
      if (hit) userId = hit.id;
      if (!list || list.users.length < 200) break;
    }
  }
  if (!userId) return json({ error: "No se pudo agregar a esa persona" }, 400);

  const { error: insErr } = await admin.from("admins").upsert({ user_id: userId, email, added_by: who?.user?.id ?? null }, { onConflict: "user_id" });
  if (insErr) return json({ error: "No se pudo registrar al administrador" }, 500);
  return json({ ok: true, email });
});
