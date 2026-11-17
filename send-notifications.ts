// Supabase Edge Function: send-notifications
// Email automatiche ai dipendenti (via Resend):
//  - richiesta ricevuta / approvata / approvata parzialmente / negata /
//    modificata / revocata / eliminata  (chiamata dal trigger su leave_requests)
//  - promemoria fattura mensile e sollecito (chiamata da pg_cron)
//  - email di prova (chiamata da un admin dal portale)
//
// Secrets richiesti (Edge Functions → Secrets):
//   RESEND_API_KEY   chiave API di resend.com
//   MAIL_FROM        es. "Marathonbet HR <hr@marathonbet.it>" (dominio verificato su Resend)
//   NOTIFY_SECRET    stessa stringa salvata nel Vault come 'notify_secret'
//   PORTAL_URL       es. https://hrmarathon.vercel.app   (opzionale)
//   NOTIFY_ADMINS    "false" per non avvisare gli admin delle nuove richieste (opzionale)
//   MAIL_REPLY_TO    indirizzo per le risposte (opzionale)
//
// Deploy con "Verify JWT" DISATTIVATO: la funzione controlla da sola
// il segreto (chiamate dal database) o il token di un admin (email di prova).

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PORTAL_URL = Deno.env.get("PORTAL_URL") || "https://hrmarathon.vercel.app";
const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto",
  "settembre", "ottobre", "novembre", "dicembre"];

type Leave = {
  id: string; employee_id: string; type: string; start_date: string; end_date: string;
  working_days: number; status: string; notes?: string; half_day?: boolean;
};
type Profile = { id: string; email: string; full_name: string; role: string; status: string;
  email_notifications?: boolean; invoicing_enabled?: boolean };

const fmtDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
const fmtDays = (n: number) => String(Number(n)).replace(".", ",");
const ymLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const typeLabel = (t: string) => ({ Ferie: "ferie", Permesso: "permesso", Malattia: "malattia" }[t] || t.toLowerCase());
const period = (r: Leave) => r.start_date === r.end_date
  ? `il ${fmtDate(r.start_date)}${r.half_day ? " (mezza giornata)" : ""}`
  : `dal ${fmtDate(r.start_date)} al ${fmtDate(r.end_date)}`;
const daysTxt = (r: Leave) => `${fmtDays(r.working_days)} ${Number(r.working_days) === 1 ? "giorno lavorativo" : "giorni lavorativi"}`;

function layout(title: string, name: string, paragraphs: string[], rows: [string, string][] = []) {
  const table = rows.length ? `
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      ${rows.map(([k, v]) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eceef3;color:#5b6475;width:40%">${esc(k)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eceef3;color:#121826;font-weight:600">${esc(v)}</td></tr>`).join("")}
    </table>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f5f8;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#121826">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e6e8ee">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5b6475;margin-bottom:8px">Marathonbet Leave Control</div>
      <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
      <p style="margin:0 0 12px">Ciao ${esc(name)},</p>
      ${paragraphs.map((p) => `<p style="margin:0 0 12px;line-height:1.5">${p}</p>`).join("")}
      ${table}
      <p style="margin:20px 0 0"><a href="${PORTAL_URL}" style="display:inline-block;background:#121826;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Apri il portale</a></p>
    </div>
    <p style="font-size:12px;color:#8a92a3;text-align:center;margin-top:16px">Email automatica del portale HR Marathonbet Italia. Per domande rispondi all'HR.</p>
  </div></body></html>`;
}

async function sendMail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("MAIL_FROM");
  if (!key || !from) throw new Error("RESEND_API_KEY o MAIL_FROM non configurati");
  const replyTo = Deno.env.get("MAIL_REPLY_TO");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function deliver(db: SupabaseClient, p: Profile, kind: string, refKey: string, subject: string, html: string) {
  if (p.email_notifications === false || p.status !== "active") {
    await db.from("notification_log").insert({ employee_id: p.id, recipient: p.email, kind, ref_key: refKey, subject, status: "skipped" });
    return { to: p.email, status: "skipped" };
  }
  try {
    await sendMail(p.email, subject, html);
    await db.from("notification_log").insert({ employee_id: p.id, recipient: p.email, kind, ref_key: refKey, subject, status: "sent" });
    return { to: p.email, status: "sent" };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.from("notification_log").insert({ employee_id: p.id, recipient: p.email, kind, ref_key: refKey, subject, status: "error", error });
    return { to: p.email, status: "error", error };
  }
}

// ---------------------------------------------------------------------
// Richieste di assenza
// ---------------------------------------------------------------------
async function handleLeave(db: SupabaseClient, body: any) {
  const op: string = body.op;
  const rec: Leave | null = body.record;
  const old: Leave | null = body.old_record;
  const r = (rec || old)!;
  const { data: emp } = await db.from("profiles").select("*").eq("id", r.employee_id).single();
  if (!emp) return { skipped: "profilo non trovato" };
  const name = (emp.full_name || "").split(" ")[0] || emp.full_name;
  const what = typeLabel(r.type);
  const out: unknown[] = [];

  const datesChanged = rec && old && (rec.start_date !== old.start_date || rec.end_date !== old.end_date ||
    Number(rec.working_days) !== Number(old.working_days) || rec.type !== old.type);
  const rowsOf = (x: Leave, statusTxt: string): [string, string][] => [
    ["Tipo", x.type], ["Periodo", x.start_date === x.end_date ? fmtDate(x.start_date) : `${fmtDate(x.start_date)} → ${fmtDate(x.end_date)}`], ["Giorni", fmtDays(x.working_days)], ["Stato", statusTxt],
  ];

  let kind = "", subject = "", html = "";
  if (op === "INSERT" && rec) {
    kind = "request_received";
    subject = `Richiesta di ${what} ricevuta (${fmtDate(rec.start_date)})`;
    html = layout("Richiesta ricevuta", name, [
      `abbiamo ricevuto la tua richiesta di <strong>${esc(what)}</strong> ${period(rec)} (${daysTxt(rec)}).`,
      "Riceverai un'altra email quando l'HR l'avrà gestita.",
    ], rowsOf(rec, "In attesa di approvazione"));
  } else if (op === "UPDATE" && rec && old) {
    if (old.status === "Pending" && rec.status === "Approved") {
      kind = "approved";
      if (datesChanged) {
        subject = `Richiesta di ${what} approvata parzialmente`;
        html = layout("Richiesta approvata parzialmente", name, [
          `la tua richiesta di <strong>${esc(what)}</strong> ${period(old)} è stata <strong>approvata in parte</strong>.`,
          `Periodo approvato: <strong>${period(rec)}</strong> (${daysTxt(rec)}). I giorni esclusi non sono stati concessi.`,
        ], rowsOf(rec, "Approvata"));
      } else {
        subject = `Richiesta di ${what} approvata ✓`;
        html = layout("Richiesta approvata", name, [
          `la tua richiesta di <strong>${esc(what)}</strong> ${period(rec)} è stata <strong>approvata</strong>.`,
        ], rowsOf(rec, "Approvata"));
      }
    } else if (rec.status === "Rejected" && old.status !== "Rejected") {
      kind = "rejected";
      subject = `Richiesta di ${what} non approvata`;
      html = layout("Richiesta non approvata", name, [
        `la tua richiesta di <strong>${esc(what)}</strong> ${period(rec)} <strong>non è stata approvata</strong>.`,
        "Per chiarimenti contatta l'HR.",
      ], rowsOf(rec, "Non approvata"));
    } else if (rec.status === "Revoked" && old.status !== "Revoked") {
      kind = "revoked";
      subject = `Assenza revocata: ${rec.type} ${fmtDate(rec.start_date)}`;
      html = layout("Assenza revocata", name, [
        `l'assenza per <strong>${esc(what)}</strong> ${period(rec)} è stata <strong>revocata</strong> dall'HR.`,
        "I giorni tornano disponibili nel tuo saldo.",
      ], rowsOf(rec, "Revocata"));
    } else if (datesChanged || rec.status !== old.status) {
      kind = "modified";
      const stato = { Pending: "In attesa", Approved: "Approvata", Rejected: "Non approvata", Revoked: "Revocata" }[rec.status] || rec.status;
      subject = `Richiesta di ${what} modificata`;
      html = layout("Richiesta modificata", name, [
        `la tua richiesta di <strong>${esc(what)}</strong> è stata modificata dall'HR.`,
        datesChanged ? `Prima: ${period(old)} (${daysTxt(old)}). Ora: <strong>${period(rec)}</strong> (${daysTxt(rec)}).` : "",
      ].filter(Boolean), rowsOf(rec, stato));
    }
  } else if (op === "DELETE" && old && (old.status === "Pending" || old.status === "Approved")) {
    kind = "deleted";
    subject = `Richiesta di ${what} eliminata`;
    html = layout("Richiesta eliminata", name, [
      `la tua richiesta di <strong>${esc(what)}</strong> ${period(old)} è stata eliminata dall'HR.`,
    ]);
  }

  // Il dipendente non riceve email per le azioni fatte da lui stesso, tranne la conferma di invio
  if (kind && (kind === "request_received" || body.actor !== r.employee_id)) {
    out.push(await deliver(db, emp, kind, r.id, subject, html));
  }

  // Avviso agli admin per le nuove richieste
  if (op === "INSERT" && rec && Deno.env.get("NOTIFY_ADMINS") !== "false") {
    const { data: admins } = await db.from("profiles").select("*").eq("role", "admin").eq("status", "active");
    for (const a of admins || []) {
      if (a.id === body.actor || a.id === rec.employee_id) continue;
      out.push(await deliver(db, a, "admin_new_request", rec.id,
        `Nuova richiesta: ${emp.full_name} – ${rec.type} ${fmtDate(rec.start_date)}`,
        layout("Nuova richiesta da approvare", (a.full_name || "").split(" ")[0], [
          `<strong>${esc(emp.full_name)}</strong> ha chiesto <strong>${esc(what)}</strong> ${period(rec)} (${daysTxt(rec)}).`,
          rec.notes ? `Note: ${esc(rec.notes)}` : "",
        ].filter(Boolean), rowsOf(rec, "In attesa"))));
    }
  }
  return { sent: out };
}

// ---------------------------------------------------------------------
// Promemoria fattura
// ---------------------------------------------------------------------
async function handleInvoiceReminder(db: SupabaseClient, mode: "upcoming" | "overdue", onlyIds?: string[]) {
  const now = new Date();
  const ref = mode === "overdue" ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)) : now;
  const ym = `${ref.getUTCFullYear()}-${String(ref.getUTCMonth() + 1).padStart(2, "0")}`;
  const kind = mode === "overdue" ? "invoice_overdue" : "invoice_reminder";

  let q = db.from("profiles").select("*").eq("status", "active").eq("invoicing_enabled", true);
  if (onlyIds?.length) q = q.in("id", onlyIds);
  const { data: people, error } = await q;
  if (error) throw error;

  const { data: vals } = await db.from("payslip_validations").select("employee_id").eq("month", `${ym}-01`);
  const validated = new Set((vals || []).map((v: { employee_id: string }) => v.employee_id));
  const { data: already } = await db.from("notification_log").select("employee_id")
    .eq("kind", kind).eq("ref_key", ym).eq("status", "sent");
  const done = new Set((already || []).map((v: { employee_id: string }) => v.employee_id));

  const out: unknown[] = [];
  for (const p of people || []) {
    if (validated.has(p.id) || (!onlyIds && done.has(p.id))) continue;
    const name = (p.full_name || "").split(" ")[0];
    const label = ymLabel(ym);
    const subject = mode === "overdue"
      ? `Sollecito: fattura di ${label} non ancora validata`
      : `Promemoria: prepara la fattura di ${label}`;
    const html = mode === "overdue"
      ? layout("Fattura da completare", name, [
          `la fattura di <strong>${label}</strong> risulta ancora <strong>da validare</strong>.`,
          "Apri il tab <strong>Fatture</strong> del portale, controlla giorni e importo e completa i dati, così l'HR può validarla.",
        ])
      : layout("Promemoria fattura", name, [
          `il mese di <strong>${label}</strong> sta per chiudersi: ricordati di preparare la fattura.`,
          "Nel tab <strong>Fatture</strong> del portale trovi la simulazione con giorni lavorati e importo: compila numero e descrizione e genera il PDF.",
        ]);
    out.push(await deliver(db, p, kind, ym, subject, html));
  }
  return { month: ym, mode, sent: out };
}

// ---------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Metodo non consentito" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({}));

  // Autorizzazione: segreto condiviso (database / cron) oppure admin attivo (portale)
  const secret = Deno.env.get("NOTIFY_SECRET");
  const fromDb = Boolean(secret) && req.headers.get("x-notify-secret") === secret;
  let adminId: string | null = null;
  if (!fromDb) {
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Non autorizzato" }, 401);
    const { data: me } = await db.from("profiles").select("role, status").eq("id", user.id).single();
    if (me?.role !== "admin" || me?.status !== "active") return json({ error: "Solo gli admin" }, 403);
    adminId = user.id;
  }

  try {
    if (body.event === "leave" && fromDb) return json(await handleLeave(db, body));
    if (body.event === "invoice_reminder") {
      const mode = body.mode === "overdue" ? "overdue" : "upcoming";
      const ids = Array.isArray(body.employee_ids) ? body.employee_ids.map(String) : undefined;
      return json(await handleInvoiceReminder(db, mode, adminId ? ids : undefined));
    }
    if (body.event === "test" && adminId) {
      const { data: p } = await db.from("profiles").select("*").eq("id", String(body.employee_id || adminId)).single();
      if (!p) return json({ error: "Utente non trovato" }, 404);
      const res = await deliver(db, { ...p, email_notifications: true }, "test", null as unknown as string,
        "Email di prova – Marathonbet Leave Control",
        layout("Email di prova", (p.full_name || "").split(" ")[0], [
          "questa è un'email di prova del portale HR: le notifiche funzionano correttamente.",
          "Riceverai email quando invii una richiesta, quando viene approvata, negata o modificata, e un promemoria per la fattura mensile.",
        ]));
      return json(res, (res as { status: string }).status === "error" ? 500 : 200);
    }
    return json({ error: "Evento non riconosciuto" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
