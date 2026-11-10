// Supabase Edge Function: admin-create-user
// Crea un utente (Auth + riga in "profiles") — chiamabile SOLO da un admin loggato.
// Deploy:  supabase functions deploy admin-create-user
// (SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sono già disponibili come env nelle Edge Functions)

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

  // 1) Identifica chi chiama tramite il suo token
  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) return json({ error: "Non autenticato" }, 401);

  // 2) Verifica che sia admin
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: me } = await admin.from("profiles").select("role, status").eq("id", user.id).single();
  if (me?.role !== "admin" || me?.status !== "active") return json({ error: "Solo gli admin possono creare utenti" }, 403);

  // 3) Valida input
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const full_name = String(body.full_name ?? "").trim();
  const role = body.role === "admin" ? "admin" : "employee";
  const annual_quota = Number.isFinite(Number(body.annual_quota)) ? Number(body.annual_quota) : 33;
  const status = "active"; // valori ammessi dal DB: pending | active | disabled

  if (!email || !email.includes("@")) return json({ error: "Email non valida" }, 400);
  if (password.length < 8) return json({ error: "La password deve avere almeno 8 caratteri" }, 400);
  if (!full_name) return json({ error: "Nome obbligatorio" }, 400);

  // 4) Crea l'utente Auth già confermato (niente mail di conferma)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (createErr || !created.user) {
    const msg = /already/i.test(createErr?.message ?? "") ? "Esiste già un utente con questa email" : createErr?.message;
    return json({ error: msg ?? "Errore creazione utente" }, 400);
  }

  // 5) Crea/aggiorna il profilo (upsert: copre il caso di un trigger che lo crea già)
  const { error: profErr } = await admin.from("profiles").upsert({
    id: created.user.id,
    full_name,
    email,
    role,
    status,
    annual_quota,
  });
  if (profErr) {
    await admin.auth.admin.deleteUser(created.user.id); // rollback
    return json({ error: "Profilo non creato: " + profErr.message }, 500);
  }

  return json({ ok: true, id: created.user.id, email });
});
