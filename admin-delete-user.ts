// Supabase Edge Function: admin-delete-user
// Elimina definitivamente un utente (Auth). Il profilo, le richieste ferie,
// la scheda dipendente e le voci payslip vengono eliminati a cascata.
// Chiamabile SOLO da un admin attivo; un admin non puo' eliminare se stesso.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Metodo non consentito" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) return json({ error: "Non autenticato" }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: me } = await admin.from("profiles").select("role, status").eq("id", user.id).single();
  if (me?.role !== "admin" || me?.status !== "active") {
    return json({ error: "Solo gli admin possono eliminare utenti" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.user_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Utente non valido" }, 400);
  if (userId === user.id) return json({ error: "Non puoi eliminare il tuo stesso account" }, 400);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 400);

  // Nel caso il profilo non fosse collegato a cascata
  await admin.from("profiles").delete().eq("id", userId);

  return json({ ok: true });
});
