// Supabase Edge Function: admin-update-user
// Modifica email e/o password di un utente esistente (Auth) e aggiorna
// l'email anche nel profilo. Chiamabile SOLO da un admin attivo.

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
    return json({ error: "Solo gli admin possono modificare le credenziali" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.user_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Utente non valido" }, 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email && !password) return json({ error: "Nessuna modifica indicata" }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Email non valida" }, 400);
  if (password && password.length < 8) return json({ error: "La password deve avere almeno 8 caratteri" }, 400);

  const attrs: Record<string, unknown> = {};
  if (email) { attrs.email = email; attrs.email_confirm = true; }
  if (password) attrs.password = password;

  const { data, error } = await admin.auth.admin.updateUserById(userId, attrs);
  if (error) return json({ error: error.message }, 400);

  if (email) {
    const { error: pErr } = await admin.from("profiles").update({ email }).eq("id", userId);
    if (pErr) return json({ error: `Accesso aggiornato, ma profilo non aggiornato: ${pErr.message}` }, 500);
  }

  return json({ ok: true, email: data.user?.email ?? email });
});
