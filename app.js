// =====================================================================
// Marathonbet Leave Control - client
// =====================================================================

const SUPABASE_CONFIG = {
  url: "https://dnyoefjtbkjqtyvitiif.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueW9lZmp0YmtqcXR5dml0aWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1ODM4NjUsImV4cCI6MjA5MjE1OTg2NX0.rWX1-cD8BRv5wt6_BdB--GQ1d1OkVHw87STLnXRTL0I"
};

const DEFAULT_QUOTA = 33;

const state = {
  activeView: "history",
  periodPreset: "currentYear",
  periodStart: "",
  periodEnd: "",
  session: null,
  profile: null,
  employees: [],
  allUsers: [],
  requests: [],
  historyRows: [],
  // schede dipendente
  payData: {},            // employee_id -> riga employee_pay
  selectedEmployeeId: "",
  payMonth: "",           // "YYYY-MM"
  payItems: [],           // voci del mese selezionato
  payItemsAll: [],        // tutte le voci del dipendente selezionato
  validations: [],        // mesi validati del dipendente selezionato
  leaveAdj: {},           // "employeeId|anno" -> giorni godute azzerati
  myValidations: [],      // fatture validate del dipendente loggato ("La mia scheda")
  myItems: [],            // voci extra (rimborsi ecc.) del dipendente loggato
  myMonth: "",            // mese della simulazione in "La mia scheda" (YYYY-MM)
  drafts: {},             // "employeeId|YYYY-MM" -> dati fattura compilati (tabella invoice_drafts)
  draftsAvailable: true   // false se la tabella invoice_drafts non esiste ancora
};

const refs = {
  body: document.body,

  // auth
  authScreen: el("authScreen"),
  tabLogin: el("tabLogin"),
  tabSignup: el("tabSignup"),
  loginForm: el("loginForm"),
  loginEmail: el("loginEmail"),
  loginPassword: el("loginPassword"),
  loginStatus: el("loginStatus"),
  signupForm: el("signupForm"),
  signupName: el("signupName"),
  signupEmail: el("signupEmail"),
  signupPassword: el("signupPassword"),
  signupStatus: el("signupStatus"),
  configBanner: el("configBanner"),

  // pending
  pendingScreen: el("pendingScreen"),
  pendingName: el("pendingName"),
  pendingLogout: el("pendingLogout"),

  // app
  appContent: el("appContent"),
  logoutButton: el("logoutButton"),
  roleSwitch: el("roleSwitch"),
  myCard: el("myCard"),
  myStatus: el("myStatus"),
  previewBanner: el("previewBanner"),
  previewExit: el("previewExit"),
  previewAs: el("previewAs"),
  previewText: el("previewText"),
  userChip: el("userChip"),
  navButtons: [...document.querySelectorAll(".nav-item")],
  panels: [...document.querySelectorAll(".view-panel")],

  // dashboard
  metricsGrid: el("metricsGrid"),
  pendingList: el("pendingList"),
  teamSummary: el("teamSummary"),
  pendingBadge: el("pendingBadge"),
  usersBadge: el("usersBadge"),

  // period
  periodPreset: el("periodPreset"),
  periodStart: el("periodStart"),
  periodEnd: el("periodEnd"),

  // request form
  requestForm: el("requestForm"),
  employeeSelect: el("employeeSelect"),
  leaveType: el("leaveType"),
  startDate: el("startDate"),
  endDate: el("endDate"),
  requestNotes: el("requestNotes"),
  requestStatus: el("requestStatus"),
  workingDaysInfo: el("workingDaysInfo"),
  quotaChip: el("quotaChip"),

  // approvals
  approvalQueue: el("approvalQueue"),

  // history
  historyTableBody: el("historyTableBody"),
  filterStatus: el("filterStatus"),
  filterEmployee: el("filterEmployee"),
  historyStart: el("historyStart"),
  historyEnd: el("historyEnd"),
  exportCsvButton: el("exportCsvButton"),

  // team
  teamTable: el("teamTable"),

  // users
  usersTableBody: el("usersTableBody"),
  createUserForm: el("createUserForm"),
  newUserName: el("newUserName"),
  newUserEmail: el("newUserEmail"),
  newUserPassword: el("newUserPassword"),
  newUserRole: el("newUserRole"),
  newUserQuota: el("newUserQuota"),
  createUserStatus: el("createUserStatus"),

  // schede dipendente
  empSelect: el("empSelect"),
  empDirectory: el("empDirectory"),
  empDetail: el("empDetail"),
  empBack: el("empBack"),
  dirMetrics: el("dirMetrics"),
  dirSearch: el("dirSearch"),
  dirDept: el("dirDept"),
  dirCount: el("dirCount"),
  dirBody: el("dirBody"),
  dirMonthHead: el("dirMonthHead"),
  empEmpty: el("empEmpty"),
  empSheet: el("empSheet"),
  empName: el("empName"),
  empMeta: el("empMeta"),
  kpiRate: el("kpiRate"),
  kpiRateBox: el("kpiRateBox"),
  empRateBox: el("empRateBox"),
  kpiRateLabel: el("kpiRateLabel"),
  empPayType: el("empPayType"),
  empRateLabel: el("empRateLabel"),
  empRateSub: el("empRateSub"),
  kpiSalary: el("kpiSalary"),
  kpiLeave: el("kpiLeave"),
  empForm: el("empForm"),
  empJobTitle: el("empJobTitle"),
  empDepartment: el("empDepartment"),
  departmentList: el("departmentList"),
  empContractStart: el("empContractStart"),
  empSalary: el("empSalary"),
  empRate: el("empRate"),
  empRateHint: el("empRateHint"),
  empQuota: el("empQuota"),
  empNotes: el("empNotes"),
  empBillingName: el("empBillingName"),
  empBillingEmail: el("empBillingEmail"),
  empBillingAddress: el("empBillingAddress"),
  empTaxId: el("empTaxId"),
  empBankHolder: el("empBankHolder"),
  empBankName: el("empBankName"),
  empIban: el("empIban"),
  empIbanHint: el("empIbanHint"),
  empBic: el("empBic"),
  empStatus: el("empStatus"),
  leaveYearLabel: el("leaveYearLabel"),
  leaveTotal: el("leaveTotal"),
  leaveTotalDetail: el("leaveTotalDetail"),
  leaveUsed: el("leaveUsed"),
  leavePending: el("leavePending"),
  leaveRemaining: el("leaveRemaining"),
  leaveBar: el("leaveBar"),
  leaveOther: el("leaveOther"),
  payMonth: el("payMonth"),
  payPrint: el("payPrint"),
  payGenerate: el("payGenerate"),
  payBody: el("payBody"),
  payTotal: el("payTotal"),
  payDaysDetail: el("payDaysDetail"),
  payItemForm: el("payItemForm"),
  payItemKind: el("payItemKind"),
  payItemDays: el("payItemDays"),
  payItemDaysWrap: el("payItemDaysWrap"),
  payItemAmount: el("payItemAmount"),
  payItemAmountWrap: el("payItemAmountWrap"),
  payItemDesc: el("payItemDesc"),
  payStatus: el("payStatus"),
  payValidation: el("payValidation"),
  payInvoiceForm: el("payInvoiceForm"),
  payInvNumber: el("payInvNumber"),
  payInvDesc: el("payInvDesc"),
  payInvDays: el("payInvDays"),
  payInvDaysWrap: el("payInvDaysWrap"),
  payInvDaysHint: el("payInvDaysHint"),
  payInvTotal: el("payInvTotal"),
  payInvTotalHint: el("payInvTotalHint"),
  leaveResetUsed: el("leaveResetUsed"),
  leaveUndoReset: el("leaveUndoReset"),
  leaveResetPending: el("leaveResetPending"),
  invYearLabel: el("invYearLabel"),
  invYearValidated: el("invYearValidated"),
  invYearCount: el("invYearCount"),
  invYearOpen: el("invYearOpen"),
  invAllTime: el("invAllTime"),
  invAllTimeCount: el("invAllTimeCount"),
  invBody: el("invBody"),
  invTotSim: el("invTotSim"),
  invTotVal: el("invTotVal"),

  // template
  metricTemplate: el("metricCardTemplate")
};

function el(id) { return document.getElementById(id); }

const supabaseClient = createSupabaseClient();

initialize();

// =====================================================================
// BOOTSTRAP
// =====================================================================

async function initialize() {
  hydratePeriodInputs();
  bindEvents();

  if (!supabaseClient) {
    refs.configBanner.classList.remove("hidden");
    setStatus(refs.loginStatus, "Configurazione Supabase mancante. Vedi console.", "error");
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setStatus(refs.loginStatus, `Errore sessione: ${error.message}`, "error");
    return;
  }

  await handleSession(data.session);

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    await handleSession(session);
  });
}

function createSupabaseClient() {
  const ok =
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.url.includes("YOUR_SUPABASE_URL") &&
    !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

  if (!ok || !window.supabase?.createClient) return null;
  return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

// =====================================================================
// EVENTS
// =====================================================================

function bindEvents() {
  // Auth tabs
  refs.tabLogin.addEventListener("click", () => switchAuthTab("login"));
  refs.tabSignup.addEventListener("click", () => switchAuthTab("signup"));

  refs.loginForm.addEventListener("submit", handleLogin);
  refs.signupForm.addEventListener("submit", handleSignup);
  refs.logoutButton.addEventListener("click", handleLogout);
  refs.pendingLogout.addEventListener("click", handleLogout);

  // Admin: anteprima "vista dipendente" e ritorno
  refs.roleSwitch.addEventListener("click", () => setEmployeePreview(!state.previewEmployee));
  refs.previewExit.addEventListener("click", () => setEmployeePreview(false));
  refs.previewAs.addEventListener("change", () => {
    state.previewAsId = refs.previewAs.value;
    state.myMonth = "";
    syncRoleUI();
    populateEmployeeOptions();
    render();
    if (state.activeView === "mycard") loadMyCard();
  });

  // La mia scheda: scarica PDF di una fattura validata
  refs.myCard.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-my-pdf]");
    if (btn) downloadMyInvoice(btn.dataset.myPdf, btn);
    const gen = e.target.closest("#myGenerate");
    if (gen) generateMyInvoice(gen);
    const undo = e.target.closest("[data-my-unvalidate]");
    if (undo) cancelMyValidation(undo);
  });
  // La mia scheda: simulazione fattura (mese, numero, descrizione)
  refs.myCard.addEventListener("input", (e) => {
    if (!state.profile) return;
    if (e.target.id === "myMonth") {
      if (!e.target.value) return;
      state.myMonth = e.target.value;
      renderMySim();
    } else {
      const key = { myInvNumber: "number", myInvDesc: "description", myInvDays: "days", myInvTotal: "total" }[e.target.id];
      if (!key || mySimData().validated) return;
      setPayOverride(viewerId(), state.myMonth, { [key]: e.target.value.trim() });
      renderMySim();
    }
  });

  // Main nav + inline link-buttons with data-view-target
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.viewTarget;
      if (state.activeView === "employees") openDirectory();
      if (state.activeView === "mycard") loadMyCard();
      syncViewUI();
    });
  });

  // Request form
  refs.requestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitRequest();
  });

  [refs.startDate, refs.endDate].forEach((input) => {
    input.addEventListener("input", updateWorkingDaysPreview);
  });

  // History filters
  [refs.filterStatus, refs.filterEmployee, refs.historyStart, refs.historyEnd].forEach((input) => {
    if (input) input.addEventListener("input", renderHistory);
  });

  refs.exportCsvButton.addEventListener("click", exportCsv);

  // Admin: crea utente
  if (refs.createUserForm) refs.createUserForm.addEventListener("submit", handleCreateUser);

  // Admin: schede dipendente
  bindEmployeeSheetEvents();

  // Period
  refs.periodPreset.addEventListener("change", handlePresetChange);
  refs.periodStart.addEventListener("input", handleCustomPeriodChange);
  refs.periodEnd.addEventListener("input", handleCustomPeriodChange);

  // Calendario team
  document.getElementById("calPrev")?.addEventListener("click", () => shiftCalendar(-1));
  document.getElementById("calNext")?.addEventListener("click", () => shiftCalendar(1));
  document.getElementById("calToday")?.addEventListener("click", () => { state.calYm = ""; renderCalendar(); });
  document.getElementById("calDept")?.addEventListener("change", renderCalendar);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || state.periodPreset === "custom") return;
    if (state.periodEnd !== toISODate(new Date())) handlePresetChange();
  });
}

function switchAuthTab(which) {
  const isLogin = which === "login";
  refs.tabLogin.classList.toggle("is-active", isLogin);
  refs.tabSignup.classList.toggle("is-active", !isLogin);
  refs.loginForm.classList.toggle("hidden", !isLogin);
  refs.signupForm.classList.toggle("hidden", isLogin);
}

// =====================================================================
// AUTH
// =====================================================================

async function handleLogin(event) {
  event.preventDefault();
  if (!supabaseClient) return;

  setStatus(refs.loginStatus, "Accesso in corso…");
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: refs.loginEmail.value.trim(),
    password: refs.loginPassword.value
  });

  if (error) {
    setStatus(refs.loginStatus, friendlyAuthError(error), "error");
  } else {
    setStatus(refs.loginStatus, "");
  }
}

async function handleSignup(event) {
  event.preventDefault();
  if (!supabaseClient) return;

  const name = refs.signupName.value.trim();
  const email = refs.signupEmail.value.trim();
  const password = refs.signupPassword.value;

  if (!name || !email || password.length < 6) {
    setStatus(refs.signupStatus, "Compila tutti i campi (password min. 6 caratteri).", "error");
    return;
  }

  setStatus(refs.signupStatus, "Registrazione in corso…");

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });

  if (error) {
    setStatus(refs.signupStatus, friendlyAuthError(error), "error");
    return;
  }

  // Aggiorna full_name nella tabella profiles nel caso il trigger abbia
  // usato il fallback (split email). Se la sessione e' gia' attiva l'RLS lo permette.
  if (data?.user?.id) {
    await supabaseClient
      .from("profiles")
      .update({ full_name: name })
      .eq("id", data.user.id);
  }

  setStatus(
    refs.signupStatus,
    "Registrazione completata. Il tuo account attende l'approvazione di un admin.",
    "success"
  );
  refs.signupForm.reset();
}

async function handleLogout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  setStatus(refs.loginStatus, "Logout eseguito.", "success");
}

function friendlyAuthError(error) {
  const msg = error?.message || "Errore.";
  if (/invalid login/i.test(msg))      return "Email o password errati.";
  if (/already registered/i.test(msg)) return "Questa email è già registrata.";
  if (/rate limit/i.test(msg))         return "Troppi tentativi. Riprova tra qualche minuto.";
  return msg;
}

// =====================================================================
// SESSION HANDLING
// =====================================================================

async function handleSession(session) {
  state.session = session;

  if (!session) {
    resetToAuthScreen();
    return;
  }

  const profile = await loadProfile(session.user.id);

  if (!profile) {
    // trigger non ancora eseguito? ricarico tra un istante
    resetToAuthScreen();
    setStatus(refs.loginStatus,
      "Profilo non trovato. Riprova tra qualche secondo o contatta l'admin.", "error");
    return;
  }

  state.profile = normalizeProfile(profile);

  if (state.profile.status === "pending") {
    showPendingScreen();
    return;
  }

  if (state.profile.status === "disabled") {
    await supabaseClient.auth.signOut();
    setStatus(refs.loginStatus, "Account disattivato. Contatta l'HR.", "error");
    return;
  }

  // active
  showApp();
  state.previewEmployee = false;
  state.activeView = state.profile.role === "admin" ? "dashboard" : "request";
  syncRoleUI();
  syncViewUI();
  await refreshData();
}

function resetToAuthScreen() {
  state.profile = null;
  state.employees = [];
  state.allUsers = [];
  state.requests = [];
  refs.authScreen.classList.remove("hidden");
  refs.pendingScreen.classList.add("hidden");
  refs.appContent.classList.add("hidden");
  refs.logoutButton.classList.add("hidden");
  refs.userChip.textContent = "Non connesso";
  refs.body.classList.remove("role-admin", "role-employee");
  state.previewEmployee = false;
  refs.roleSwitch.classList.add("hidden");
  refs.previewBanner.classList.add("hidden");
  state.previewAsId = "";
  switchAuthTab("login");
}

function showPendingScreen() {
  refs.authScreen.classList.add("hidden");
  refs.appContent.classList.add("hidden");
  refs.pendingScreen.classList.remove("hidden");
  refs.logoutButton.classList.add("hidden");
  refs.pendingName.textContent = state.profile?.fullName || "";
  refs.userChip.textContent = state.profile?.fullName || "";
}

function showApp() {
  refs.authScreen.classList.add("hidden");
  refs.pendingScreen.classList.add("hidden");
  refs.appContent.classList.remove("hidden");
  refs.logoutButton.classList.remove("hidden");
  refs.userChip.textContent = state.profile.fullName;
}

async function loadProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, full_name, email, role, status, annual_quota")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

function normalizeProfile(profile) {
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    status: profile.status || "active",
    annualQuota: profile.annual_quota ?? DEFAULT_QUOTA
  };
}

// =====================================================================
// DATA FETCH
// =====================================================================

async function refreshData() {
  if (!state.profile) return;
  setStatus(refs.requestStatus, "");

  const [profilesResult, requestsResult] = await Promise.all([
    fetchProfiles(),
    fetchRequests()
  ]);

  if (profilesResult.error) {
    console.error(profilesResult.error);
  } else {
    state.allUsers  = profilesResult.data.map(normalizeProfile);
    state.employees = state.allUsers.filter((u) => u.status === "active");
  }

  if (requestsResult.error) {
    console.error(requestsResult.error);
  } else {
    state.requests = requestsResult.data.map(normalizeRequest);
  }

  if (state.profile.role === "admin") {
    const [payResult, adjResult] = await Promise.all([
      fetchEmployeePay(),
      supabaseClient.from("leave_adjustments").select("employee_id, year, used_offset")
    ]);
    if (payResult.error) {
      console.error(payResult.error);
    } else {
      state.payData = Object.fromEntries(payResult.data.map((r) => [r.employee_id, r]));
    }
    if (adjResult.error) {
      console.error(adjResult.error);
    } else {
      state.leaveAdj = Object.fromEntries(adjResult.data.map((r) => [`${r.employee_id}|${r.year}`, Number(r.used_offset) || 0]));
    }
  }

  if (state.profile.role === "admin") await loadDrafts();

  populateEmployeeOptions();
  render();

  if (state.profile.role === "admin") await loadPayItems();
}

async function fetchProfiles() {
  return supabaseClient
    .from("profiles")
    .select("id, full_name, email, role, status, annual_quota")
    .order("full_name", { ascending: true });
}

async function fetchRequests() {
  return supabaseClient
    .from("leave_requests")
    .select("id, employee_id, type, start_date, end_date, working_days, status, notes, created_at")
    .order("created_at", { ascending: false });
}

function normalizeRequest(r) {
  return {
    id: r.id,
    employeeId: r.employee_id,
    type: r.type,
    startDate: r.start_date,
    endDate: r.end_date,
    workingDays: r.working_days,
    status: r.status,
    notes: r.notes || "",
    createdAt: r.created_at
  };
}

// =====================================================================
// PERIOD
// =====================================================================

function hydratePeriodInputs() {
  const today = new Date();
  state.periodStart = `${today.getFullYear()}-01-01`;
  state.periodEnd = toISODate(today);
  refs.periodPreset.value = state.periodPreset;
  refs.periodStart.value = state.periodStart;
  refs.periodEnd.value = state.periodEnd;
  applyPeriodCustomClass();
}

function handlePresetChange() {
  const today = new Date();
  state.periodPreset = refs.periodPreset.value;

  if (state.periodPreset === "currentYear") {
    state.periodStart = `${today.getFullYear()}-01-01`;
    state.periodEnd = toISODate(today);
  } else if (state.periodPreset === "last12Months") {
    const start = new Date(today);
    start.setFullYear(today.getFullYear() - 1);
    start.setDate(start.getDate() + 1);
    state.periodStart = toISODate(start);
    state.periodEnd = toISODate(today);
  }

  refs.periodStart.value = state.periodStart;
  refs.periodEnd.value = state.periodEnd;
  applyPeriodCustomClass();
  render();
}

function handleCustomPeriodChange() {
  state.periodPreset = "custom";
  refs.periodPreset.value = "custom";
  state.periodStart = refs.periodStart.value;
  state.periodEnd = refs.periodEnd.value;
  applyPeriodCustomClass();
  render();
}

function applyPeriodCustomClass() {
  refs.body.classList.toggle("period-custom", state.periodPreset === "custom");
}

// =====================================================================
// ROLE / VIEW UI
// =====================================================================

// Ruolo usato per l'interfaccia: un admin può vedere il portale "come dipendente".
// I permessi reali (dati caricati, funzioni admin) restano quelli del suo profilo.
function uiRole() {
  if (!state.profile) return null;
  return state.profile.role === "admin" && state.previewEmployee ? "employee" : state.profile.role;
}

// Dipendente di cui si sta guardando il portale: se stessi, oppure quello
// scelto dall'admin in "Vista dipendente".
function viewerId() {
  if (!state.profile) return null;
  return state.previewEmployee && state.previewAsId ? state.previewAsId : state.profile.id;
}

function viewerProfile() {
  return getEmployeeById(viewerId()) || state.profile;
}

function setEmployeePreview(on) {
  if (state.profile?.role !== "admin") return;
  state.previewEmployee = Boolean(on);
  state.activeView = state.previewEmployee ? "request" : "dashboard";
  syncRoleUI();
  syncViewUI();
  populateEmployeeOptions();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =====================================================================
// LA MIA SCHEDA (dipendente, sola lettura)
// =====================================================================

function myEmployee() {
  const p = viewerProfile();
  return getEmployeeById(p.id) || { id: p.id, fullName: p.fullName, email: p.email, annualQuota: p.annualQuota };
}

async function loadMyCard() {
  if (!supabaseClient || !state.profile) return;
  const me = viewerId();
  setStatus(refs.myStatus, "");

  if (state.profile.role !== "admin") {
    const [card, adj] = await Promise.all([
      supabaseClient.rpc("my_employee_card"),
      supabaseClient.from("leave_adjustments").select("employee_id, year, used_offset").eq("employee_id", me)
    ]);
    if (card.error) {
      setStatus(refs.myStatus, /my_employee_card|function/i.test(card.error.message)
        ? "La scheda non è ancora disponibile: l'HR deve completare la configurazione del portale."
        : card.error.message, "error");
    } else if (card.data && card.data[0]) {
      state.payData = { ...state.payData, [me]: { employee_id: me, ...card.data[0] } };
    }
    if (!adj.error) adj.data.forEach((r) => { state.leaveAdj[`${r.employee_id}|${r.year}`] = Number(r.used_offset) || 0; });
  }

  const [val, items] = await Promise.all([
    supabaseClient.from("payslip_validations").select("*")
      .eq("employee_id", me).order("month", { ascending: false }),
    supabaseClient.from("payslip_items").select("id, month, kind, description, days, amount")
      .eq("employee_id", me).order("created_at", { ascending: true })
  ]);
  state.myValidations = val.error ? [] : val.data;
  state.myItems = items.error ? [] : items.data;
  if (state.profile.role !== "admin") await loadDrafts(me);
  renderMyCard();
}

// Simulazione fattura del dipendente loggato per il mese scelto
function mySimData() {
  const me = myEmployee();
  const pay = getPay(me.id);
  if (!state.myMonth) state.myMonth = currentYm();
  const ym = state.myMonth;
  const validation = state.myValidations.find((v) => v.month.slice(0, 7) === ym);
  const saved = state.payItemsAll;
  state.payItemsAll = state.myItems || [];
  const ps = computePayslip(me, pay, ym);
  state.payItemsAll = saved;
  const v = validation || {
    amount: ps.total,
    daily_rate: Math.round(ps.rate * 100) / 100,
    worked_days: ps.worked,
    details: {
      pay_type: ps.payType,
      invoice_number: ps.invoiceNo || invoiceNumber(ym),
      description: ps.description || "",
      base: Math.round(ps.base * 100) / 100,
      items: ps.items.map((i) => ({ kind: i.kind, description: i.description, days: i.days, amount: i.amount }))
    }
  };
  return { me, pay, ym, ps, v, validated: Boolean(validation) };
}

function renderMySim() {
  const body = document.getElementById("mySimBody");
  if (!body || !state.profile) return;
  const { pay, ym, ps, v, validated } = mySimData();
  const d = v.details || {};

  const num = document.getElementById("myInvNumber");
  const desc = document.getElementById("myInvDesc");
  const days = document.getElementById("myInvDays");
  const total = document.getElementById("myInvTotal");
  const keep = (input, value) => { if (document.activeElement !== input) input.value = value; };
  keep(num, validated ? (d.invoice_number || "") : ps.invoiceNo);
  keep(desc, validated ? (d.description || "") : ps.description);
  keep(days, validated ? (d.days_edited ? String(v.worked_days) : "") : (ps.daysEdited ? String(ps.worked) : ""));
  keep(total, validated ? (d.total_edited ? String(v.amount) : "") : (ps.totalEdited ? String(ps.total) : ""));
  num.placeholder = invoiceNumber(ym);
  desc.placeholder = defaultInvoiceDescription(ym, ps.payType !== "fixed");
  days.placeholder = fmtDays(ps.computedWorked);
  total.placeholder = ps.computedTotal.toFixed(2);
  document.getElementById("myInvDaysHint").textContent = `Calcolati: ${fmtDays(ps.computedWorked)} (vuoto = automatico)`;
  document.getElementById("myInvTotalHint").textContent = `Calcolato: ${fmtEur(ps.computedTotal)} (vuoto = automatico)`;
  document.getElementById("myInvDaysWrap").classList.toggle("hidden", ps.payType === "fixed");
  num.disabled = desc.disabled = days.disabled = total.disabled = validated;

  const lines = invoiceLinesEn(v, ym);
  const daysNote = ps.payType === "fixed"
    ? `Salario annuo ${fmtEur(pay.annualSalary)} ÷ 12. Ferie, permessi e malattia non riducono la fattura.`
    : `Giorni lavorativi ${ps.workingDays} − ferie ${fmtDays(ps.ferie)} − permessi ${fmtDays(ps.permessi)} − malattia ${fmtDays(ps.malattia)} = ${fmtDays(ps.computedWorked)} giorni lavorati.`;
  const missing = [!pay.iban && "IBAN", !pay.billingAddress && "indirizzo"].filter(Boolean);

  body.innerHTML = `
    <div class="validation-box ${validated ? "validated" : ""}">
      <div>
        <strong>${validated ? `✓ ${monthName(ym)} validato dall'HR: ${fmtEur(v.amount)}` : `${monthName(ym)}: da validare`}</strong>
        <span class="metric-detail">${validated
          ? "Importo definitivo. Per correggere i dati annulla la validazione: l'HR dovrà validare di nuovo."
          : "Compila numero, descrizione, giorni e importo: l'HR li vede e valida il mese."}</span>
        ${validated && v.sent_at ? `<span class="metric-detail sent-line">✉ Inviata il ${formatDate(v.sent_at)}</span>` : ""}
      </div>
      ${validated ? `<button type="button" class="action-button neutral" data-my-unvalidate="${v.id}">Annulla validazione</button>` : ""}
    </div>
    <div class="table-wrap">
      <table class="payslip-table">
        <thead><tr><th>Descrizione</th><th class="num">Q.tà</th><th class="num">Tariffa</th><th class="num">Importo</th></tr></thead>
        <tbody>
          ${lines.map((l) => `
            <tr>
              <td>${escapeHtml(l.desc)}</td>
              <td class="num">${fmtDays(l.qty)}</td>
              <td class="num">${fmtEur(l.rate)}</td>
              <td class="num">${fmtEur(l.amount)}</td>
            </tr>`).join("")}
        </tbody>
        <tfoot><tr class="pay-total"><td>Totale</td><td></td><td></td><td class="num">${fmtEur(v.amount)}</td></tr></tfoot>
      </table>
    </div>
    <p class="metric-detail">${daysNote} Intestata a ${INVOICE_BILL_TO.name}.</p>
    ${missing.length ? `<p class="dir-warn">Mancano nella tua scheda: ${missing.join(", ")}. Chiedi all'HR di completarla prima di emettere la fattura.</p>` : ""}`;

  const gen = document.getElementById("myGenerate");
  if (gen) gen.disabled = !(Number(v.amount) > 0);
}

async function cancelMyValidation(btn) {
  const v = state.myValidations.find((x) => String(x.id) === String(btn.dataset.myUnvalidate));
  if (!v) return;
  const ym = v.month.slice(0, 7);
  const sentNote = v.sent_at ? `\n\nATTENZIONE: la fattura risulta già inviata il ${formatDate(v.sent_at)}.` : "";
  if (!confirm(`Annullare la validazione di ${monthName(ym)} (${fmtEur(v.amount)})?\n\nPotrai correggere i dati della fattura; poi l'HR dovrà validare di nuovo il mese.${sentNote}`)) return;
  btn.disabled = true;
  const { data, error } = await supabaseClient.from("payslip_validations")
    .delete().eq("id", v.id).eq("employee_id", viewerId()).select("id");
  if (error || !data?.length) {
    btn.disabled = false;
    return setStatus(refs.myStatus, error
      ? `Validazione non annullata: ${error.message}`
      : "Validazione non annullata: funzione non ancora attiva, contatta l'HR.", "error");
  }
  // Riporta nei campi i dati che erano stati validati, così si possono correggere
  const d = v.details || {};
  setPayOverride(viewerId(), ym, {
    number: d.invoice_number || "",
    description: d.description || "",
    days: d.days_edited ? String(v.worked_days) : "",
    total: d.total_edited ? String(v.amount) : ""
  });
  await loadMyCard();
  setStatus(refs.myStatus, `Validazione di ${monthName(ym)} annullata: ora puoi correggere i dati.`, "success");
}

async function generateMyInvoice(btn) {
  const { me, pay, ym, v } = mySimData();
  if (!(Number(v.amount) > 0)) return;
  btn.disabled = true;
  setStatus(refs.myStatus, "");
  try {
    const doc = await buildInvoicePdf({ employee: me, pay, v, ym });
    const surname = (pay.billingName || me.fullName).trim().split(/\s+/).pop().replace(/[^\w-]/g, "");
    doc.save(`${invoiceNumberOf(v, ym).replace(/[^\w.-]+/g, "_")}_${surname}.pdf`);
  } catch (err) {
    setStatus(refs.myStatus, `PDF non generato: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
}

function renderMyCard() {
  if (!refs.myCard || !state.profile) return;
  const me = myEmployee();
  const hasCard = Boolean(state.payData[me.id]);
  const pay = getPay(me.id);
  const fixed = pay.payType === "fixed";
  const year = new Date().getFullYear();
  const lb = computeLeaveBalance(me, pay, year);
  const pct = lb.total ? Math.min(100, Math.round((lb.used / lb.total) * 100)) : 0;
  const dash = (v) => (v ? escapeHtml(v) : `<span class="muted">-</span>`);

  const kpis = hasCard ? (fixed
    ? `<div><span class="metric-label">Salario annuo</span><strong>${pay.annualSalary ? fmtEur(pay.annualSalary) : "-"}</strong></div>`
    : `<div><span class="metric-label">Daily rate</span><strong>${pay.dailyRate ? fmtEur(pay.dailyRate) : "-"}</strong></div>
       <div><span class="metric-label">Salario annuo</span><strong>${pay.annualSalary ? fmtEur(pay.annualSalary) : "-"}</strong></div>`) : "";

  const yearTotal = state.myValidations
    .filter((v) => v.month.startsWith(String(year)))
    .reduce((s, v) => s + Number(v.amount || 0), 0);

  const invoices = state.myValidations.length ? `
    <div class="table-wrap">
      <table class="my-invoices">
        <thead><tr><th>Mese</th><th>N. fattura</th><th class="num">Importo</th><th>Stato</th><th></th></tr></thead>
        <tbody>
          ${state.myValidations.map((v) => {
            const ym = v.month.slice(0, 7);
            return `
              <tr>
                <td>${monthName(ym)}</td>
                <td>${escapeHtml(invoiceNumberOf(v, ym))}</td>
                <td class="num">${fmtEur(v.amount)}</td>
                <td>${v.sent_at
                  ? `<span class="badge Approved">Inviata</span> <span class="dir-sub">il ${formatDate(v.sent_at)}</span>`
                  : `<span class="badge neutral">Validata</span>`}</td>
                <td class="num"><button type="button" class="ghost-button" data-my-pdf="${v.id}">Scarica PDF</button></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>` : `<p class="empty-state">Nessuna fattura validata finora.</p>`;

  refs.myCard.innerHTML = `
    <article class="card emp-identity">
      <div>
        <h2>${escapeHtml(me.fullName)}</h2>
        <p class="meta-line">${[pay.jobTitle, pay.department, me.email, pay.contractStart ? `dal ${formatDate(pay.contractStart)}` : null]
          .filter(Boolean).map(escapeHtml).join(" · ")}</p>
      </div>
      <div class="emp-kpis">
        ${kpis}
        <div><span class="metric-label">Ferie residue</span><strong>${fmtDays(lb.remaining)} gg</strong></div>
      </div>
    </article>

    ${hasCard ? "" : `<article class="card empty-state">La tua scheda contrattuale non è ancora stata compilata dall'HR.</article>`}

    <div class="two-col">
      <article class="card">
        <div class="card-head"><h3>Saldo ferie <span class="muted">${year}</span></h3></div>
        <div class="leave-grid">
          <div class="metric-card"><span class="metric-label">Totale spettante</span><strong class="metric-value">${fmtDays(lb.total)} gg</strong>
            <span class="metric-detail">${lb.months < 12 ? `Pro-rata ${lb.months}/12 di ${lb.quota} gg` : `Quota annua ${lb.quota} gg`}</span></div>
          <div class="metric-card"><span class="metric-label">Godute</span><strong class="metric-value">${fmtDays(lb.used)} gg</strong><span class="metric-detail">Ferie approvate</span></div>
          <div class="metric-card"><span class="metric-label">In attesa</span><strong class="metric-value">${fmtDays(lb.pending)} gg</strong><span class="metric-detail">Da approvare</span></div>
          <div class="metric-card"><span class="metric-label">Residue</span><strong class="metric-value ${lb.remaining < 0 ? "negative" : ""}">${fmtDays(lb.remaining)} gg</strong><span class="metric-detail">Totale − godute</span></div>
        </div>
        <div class="progress-track"><div class="progress-bar" style="width:${pct}%"></div></div>
        <p class="metric-detail">Altre assenze approvate nell'anno: Permessi ${fmtDays(lb.permessi)} gg · Malattia ${fmtDays(lb.malattia)} gg</p>
      </article>

      <article class="card">
        <div class="card-head"><h3>Dati di fatturazione</h3></div>
        <dl class="my-dl">
          <dt>Intestatario</dt><dd>${dash(pay.billingName || me.fullName)}</dd>
          <dt>Indirizzo</dt><dd>${dash(pay.billingAddress)}</dd>
          <dt>P.IVA / C.F.</dt><dd>${dash(pay.taxId)}</dd>
          <dt>Email fatture</dt><dd>${dash(pay.billingEmail || me.email)}</dd>
          <dt>Intestatario conto</dt><dd>${dash(pay.bankHolder || pay.billingName)}</dd>
          <dt>Banca</dt><dd>${dash(pay.bankName)}</dd>
          <dt>IBAN</dt><dd>${pay.iban ? escapeHtml(formatIban(pay.iban)) : `<span class="muted">-</span>`}</dd>
          <dt>BIC / SWIFT</dt><dd>${dash(pay.bic)}</dd>
        </dl>
        <p class="metric-detail">Dati errati o mancanti? Scrivi all'HR per aggiornarli.</p>
      </article>
    </div>

    <article class="card" id="mySimCard">
      <div class="card-head">
        <h3>Simula / genera fattura</h3>
        <div class="payslip-tools">
          <input type="month" id="myMonth" value="${state.myMonth || currentYm()}" />
          <button type="button" class="primary-button" id="myGenerate">Genera fattura</button>
        </div>
      </div>
      <form class="pay-item-form pay-invoice-form" autocomplete="off" onsubmit="return false">
        <label>
          <span>Numero fattura</span>
          <input type="text" id="myInvNumber" />
        </label>
        <label class="grow">
          <span>Descrizione attività</span>
          <input type="text" id="myInvDesc" />
        </label>
        <label id="myInvDaysWrap">
          <span>Giorni lavorati</span>
          <input type="number" id="myInvDays" min="0" max="31" step="0.5" />
          <small class="metric-detail" id="myInvDaysHint"></small>
        </label>
        <label>
          <span>Importo totale (€)</span>
          <input type="number" id="myInvTotal" min="0" step="0.01" />
          <small class="metric-detail" id="myInvTotalHint"></small>
        </label>
      </form>
      <div id="mySimBody"></div>
    </article>

    <article class="card">
      <div class="card-head">
        <h3>Le mie fatture</h3>
        <span class="muted">Totale ${year}: ${fmtEur(yearTotal)}</span>
      </div>
      ${invoices}
    </article>`;
  renderMySim();
}

async function downloadMyInvoice(id, btn) {
  const v = state.myValidations.find((x) => String(x.id) === String(id));
  if (!v) return;
  const me = myEmployee();
  const pay = getPay(me.id);
  const ym = v.month.slice(0, 7);
  btn.disabled = true;
  try {
    const doc = await buildInvoicePdf({ employee: me, pay, v, ym });
    const surname = (pay.billingName || me.fullName).trim().split(/\s+/).pop().replace(/[^\w-]/g, "");
    doc.save(`${invoiceNumberOf(v, ym).replace(/[^\w.-]+/g, "_")}_${surname}.pdf`);
  } catch (err) {
    setStatus(refs.myStatus, `PDF non generato: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
}

function populateEmployeeOptions() {
  if (!state.profile) return;

  const visible = uiRole() === "admin"
    ? state.employees
    : state.employees.filter((e) => e.id === viewerId());

  const options = visible
    .map((e) => `<option value="${e.id}">${escapeHtml(e.fullName)}</option>`)
    .join("");

  refs.employeeSelect.innerHTML = options;
  if (refs.filterEmployee) {
    refs.filterEmployee.innerHTML = `<option value="all">Tutti</option>${options}`;
  }

  if (uiRole() !== "admin") {
    refs.employeeSelect.value = viewerId();
    refs.employeeSelect.disabled = true;
  } else {
    refs.employeeSelect.disabled = false;
  }
}

function syncRoleUI() {
  const role = uiRole();
  const isRealAdmin = state.profile?.role === "admin";
  refs.roleSwitch.classList.toggle("hidden", !isRealAdmin);
  refs.roleSwitch.textContent = state.previewEmployee ? "Torna ad admin" : "Vista dipendente";
  refs.previewBanner.classList.toggle("hidden", !(isRealAdmin && state.previewEmployee));
  if (isRealAdmin && state.previewEmployee) {
    if (state.previewAsId && !getEmployeeById(state.previewAsId)) state.previewAsId = "";
    const current = viewerId();
    refs.previewAs.innerHTML = [...state.employees]
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "it"))
      .map((e) => `<option value="${e.id}" ${e.id === current ? "selected" : ""}>${escapeHtml(e.fullName)}${e.id === state.profile.id ? " (tu)" : ""}</option>`)
      .join("");
    const self = current === state.profile.id;
    refs.previewText.innerHTML = `<strong>Vista dipendente</strong> · stai vedendo il portale come lo vede ${self ? "un dipendente, con i tuoi dati" : `<strong>${escapeHtml(viewerProfile().fullName)}</strong>`}. Le richieste inviate sono reali${self ? "" : " e a suo nome"}.`;
  }
  const allowed = role === "admin"
    ? ["dashboard", "approvals", "history", "team", "calendar", "employees", "users"]
    : ["request", "mycard", "history"];

  if (role && !allowed.includes(state.activeView)) {
    state.activeView = role === "admin" ? "dashboard" : "request";
  }

  refs.body.classList.toggle("role-admin", role === "admin");
  refs.body.classList.toggle("role-employee", role === "employee");
}

function syncViewUI() {
  refs.navButtons.forEach((b) => {
    b.classList.toggle("is-active", b.dataset.viewTarget === state.activeView);
  });
  refs.panels.forEach((p) => {
    p.classList.toggle("is-active", p.dataset.view === state.activeView);
  });
}

// =====================================================================
// RENDER
// =====================================================================

function render() {
  renderMetrics();
  renderPendingLists();
  renderHistory();
  renderTeam();
  renderCalendar();
  renderUsers();
  renderEmployeeSheet();
  renderQuotaChip();
  if (state.activeView === "mycard") renderMyCard();
  updateWorkingDaysPreview();
  updateBadges();
}

function updateBadges() {
  const pendingReq = state.requests.filter((r) => r.status === "Pending").length;
  refs.pendingBadge.textContent = pendingReq;
  refs.pendingBadge.classList.toggle("hidden", pendingReq === 0);

  const pendingUsr = state.allUsers.filter((u) => u.status === "pending").length;
  refs.usersBadge.textContent = pendingUsr;
  refs.usersBadge.classList.toggle("hidden", pendingUsr === 0);
}

function getEmployeeById(id) {
  return state.allUsers.find((u) => u.id === id);
}

function getActivePeriod() {
  return {
    start: refs.periodStart.value || state.periodStart,
    end:   refs.periodEnd.value   || state.periodEnd
  };
}

function requestOverlapsPeriod(req, period) {
  if (!period.start || !period.end) return true;
  return !(req.endDate < period.start || req.startDate > period.end);
}

function getRequestsInPeriod() {
  const period = getActivePeriod();
  return state.requests.filter((r) => requestOverlapsPeriod(r, period));
}

function renderMetrics() {
  if (!refs.metricsGrid) return;
  const scoped = getRequestsInPeriod();
  const approved = scoped.filter((r) => r.status === "Approved");
  const pending  = scoped.filter((r) => r.status === "Pending");
  const rejected = scoped.filter((r) => r.status === "Rejected");
  const totalDays = approved.reduce((s, r) => s + r.workingDays, 0);
  const employeesOnLeave = new Set(approved.map((r) => r.employeeId)).size;

  const metrics = [
    { label: "Richieste totali",     value: scoped.length,       detail: "Nel periodo selezionato" },
    { label: "Pendenti",             value: pending.length,       detail: "In attesa di decisione" },
    { label: "Giorni approvati",     value: totalDays,            detail: "Solo giorni lavorativi" },
    { label: "Dipendenti coinvolti", value: employeesOnLeave,     detail: "Con ferie approvate" },
    { label: "Rifiutate",            value: rejected.length,      detail: "Richieste respinte" }
  ];

  refs.metricsGrid.innerHTML = "";
  metrics.forEach((m) => {
    const card = refs.metricTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".metric-label").textContent  = m.label;
    card.querySelector(".metric-value").textContent  = m.value;
    card.querySelector(".metric-detail").textContent = m.detail;
    refs.metricsGrid.appendChild(card);
  });
}

function renderPendingLists() {
  const pending = state.requests
    .filter((r) => r.status === "Pending")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  refs.pendingList.innerHTML = pending.length
    ? pending.slice(0, 5).map((r) => requestCardMarkup(r, false)).join("")
    : emptyStateMarkup("Nessuna richiesta pendente.");

  refs.approvalQueue.innerHTML = pending.length
    ? pending.map((r) => requestCardMarkup(r, true)).join("")
    : emptyStateMarkup("La coda approvazioni è vuota.");

  refs.approvalQueue.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateRequestStatus(btn.dataset.id, btn.dataset.action);
    });
  });
}

function requestCardMarkup(request, withActions) {
  const employee = getEmployeeById(request.employeeId);
  const name = employee?.fullName || "Dipendente";
  const sub = employee?.email || "";
  return `
    <article class="request-item">
      <div class="request-item-head">
        <div>
          <h4>${escapeHtml(name)}</h4>
          <p class="meta-line">${escapeHtml(request.type)} · ${formatDate(request.startDate)} → ${formatDate(request.endDate)}</p>
          <p class="meta-line">${request.workingDays} giorni lavorativi${sub ? ` · ${escapeHtml(sub)}` : ""}</p>
          ${request.notes ? `<p class="meta-line">📝 ${escapeHtml(request.notes)}</p>` : ""}
        </div>
        <span class="badge ${request.status}">${request.status}</span>
      </div>
      ${withActions ? `
        <div class="request-actions">
          <button class="action-button approve" data-id="${request.id}" data-action="Approved">Approva</button>
          <button class="action-button reject"  data-id="${request.id}" data-action="Rejected">Rifiuta</button>
        </div>` : ""}
    </article>
  `;
}

function emptyStateMarkup(text) {
  return `<p class="empty-state">${escapeHtml(text)}</p>`;
}

async function updateRequestStatus(id, status) {
  const { error } = await supabaseClient
    .from("leave_requests")
    .update({ status })
    .eq("id", id);
  if (error) {
    alert(`Errore: ${error.message}`);
    return;
  }
  await refreshData();
}

// =====================================================================
// REQUEST SUBMIT
// =====================================================================

async function submitRequest() {
  if (!state.profile) return;

  const employeeId = refs.employeeSelect.value || viewerId();
  const startDate  = refs.startDate.value;
  const endDate    = refs.endDate.value;
  const workingDays = countWorkingDays(startDate, endDate);

  if (!employeeId || !startDate || !endDate || workingDays <= 0) {
    setStatus(refs.requestStatus,
      "Inserisci un intervallo valido con almeno un giorno lavorativo.", "error");
    return;
  }

  const overlap = state.requests.find((r) =>
    r.employeeId === employeeId &&
    (r.status === "Pending" || r.status === "Approved") &&
    r.startDate <= endDate && r.endDate >= startDate);
  if (overlap) {
    setStatus(refs.requestStatus,
      `Esiste già una richiesta (${overlap.type}, ${overlap.status === "Pending" ? "in attesa" : "approvata"}) dal ${formatDate(overlap.startDate)} al ${formatDate(overlap.endDate)} che si sovrappone a queste date.`, "error");
    return;
  }

  setStatus(refs.requestStatus, "Invio richiesta…");

  const { error } = await supabaseClient.from("leave_requests").insert({
    employee_id: employeeId,
    type: refs.leaveType.value,
    start_date: startDate,
    end_date: endDate,
    working_days: workingDays,
    status: "Pending",
    notes: refs.requestNotes.value.trim()
  });

  if (error) {
    setStatus(refs.requestStatus, `Invio non riuscito: ${error.message}`, "error");
    return;
  }

  refs.requestForm.reset();
  refs.employeeSelect.value = employeeId;
  setStatus(refs.requestStatus,
    `Richiesta inviata. Giorni lavorativi: ${workingDays}.`, "success");
  updateWorkingDaysPreview();
  await refreshData();
}

function updateWorkingDaysPreview() {
  const s = refs.startDate.value;
  const e = refs.endDate.value;
  if (!s || !e) {
    refs.workingDaysInfo.textContent = "Seleziona un intervallo per calcolare i giorni lavorativi.";
    return;
  }
  const d = countWorkingDays(s, e);
  refs.workingDaysInfo.textContent = d > 0
    ? `${d} giorni lavorativi calcolati automaticamente.`
    : "L'intervallo non contiene giorni lavorativi validi.";
}

// Festività nazionali italiane (Pasqua/Pasquetta calcolate; San Francesco dal 2026)
const holidayCache = {};
function italianHolidays(year) {
  if (holidayCache[year]) return holidayCache[year];
  // Pasqua (algoritmo di Meeus/Jones/Butcher)
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day, 12);
  const easterMonday = new Date(easter); easterMonday.setDate(easter.getDate() + 1);
  const map = {
    [`${year}-01-01`]: "Capodanno",
    [`${year}-01-06`]: "Epifania",
    [toISODate(easter)]: "Pasqua",
    [toISODate(easterMonday)]: "Lunedì dell'Angelo",
    [`${year}-04-25`]: "Festa della Liberazione",
    [`${year}-05-01`]: "Festa del Lavoro",
    [`${year}-06-02`]: "Festa della Repubblica",
    [`${year}-08-15`]: "Ferragosto",
    [`${year}-11-01`]: "Ognissanti",
    [`${year}-12-08`]: "Immacolata",
    [`${year}-12-25`]: "Natale",
    [`${year}-12-26`]: "Santo Stefano"
  };
  if (year >= 2026) map[`${year}-10-04`] = "San Francesco d'Assisi";
  return (holidayCache[year] = map);
}

function holidayName(iso) {
  return italianHolidays(Number(iso.slice(0, 4)))[iso] || "";
}

function isWorkingDay(iso) {
  const dow = new Date(`${iso}T12:00:00`).getDay();
  return dow !== 0 && dow !== 6 && !holidayName(iso);
}

function countWorkingDays(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const cursor = new Date(`${startDate}T12:00:00`);
  const end    = new Date(`${endDate}T12:00:00`);
  let count = 0;
  while (cursor <= end) {
    if (isWorkingDay(toISODate(cursor))) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function renderQuotaChip() {
  if (!refs.quotaChip || !state.profile) return;
  const viewer = viewerProfile();
  const approvedDays = state.requests
    .filter((r) => r.employeeId === viewer.id && r.status === "Approved")
    .filter((r) => r.startDate.startsWith(String(new Date().getFullYear())))
    .reduce((s, r) => s + r.workingDays, 0);
  const remaining = Math.max(0, viewer.annualQuota - approvedDays);
  refs.quotaChip.textContent = `Quota residua: ${remaining}/${viewer.annualQuota} gg`;
}

// =====================================================================
// HISTORY
// =====================================================================

function renderHistory() {
  const statusFilter   = refs.filterStatus.value;
  const employeeFilter = refs.filterEmployee?.value || "all";
  const startFilter    = refs.historyStart.value;
  const endFilter      = refs.historyEnd.value;

  const isEmployee = uiRole() !== "admin";

  state.historyRows = state.requests
    .filter((r) => isEmployee ? r.employeeId === viewerId() : true)
    .filter((r) => statusFilter === "all" ? true : r.status === statusFilter)
    .filter((r) => employeeFilter === "all" ? true : r.employeeId === employeeFilter)
    .filter((r) => !startFilter ? true : r.startDate >= startFilter)
    .filter((r) => !endFilter   ? true : r.endDate   <= endFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  refs.historyTableBody.innerHTML = state.historyRows.length
    ? state.historyRows.map((r) => {
        const emp = getEmployeeById(r.employeeId);
        return `
          <tr>
            <td>${escapeHtml(emp?.fullName || "-")}</td>
            <td>${escapeHtml(r.type)}</td>
            <td>${formatDate(r.startDate)} → ${formatDate(r.endDate)}</td>
            <td>${r.workingDays}</td>
            <td><span class="badge ${r.status}">${r.status}</span></td>
            <td>${formatDate(r.createdAt)}</td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="6" class="empty-state">Nessun risultato.</td></tr>`;
}

// =====================================================================
// CALENDARIO TEAM
// =====================================================================

const LEAVE_CLASS = { Ferie: "cal-ferie", Permesso: "cal-permesso", Malattia: "cal-malattia" };

function shiftCalendar(delta) {
  const [y, m] = (state.calYm || currentYm()).split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1, 12);
  state.calYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById("calGrid");
  if (!grid || state.profile?.role !== "admin") return;
  const ym = state.calYm || currentYm();
  const { start, end } = monthBounds(ym);
  document.getElementById("calTitle").textContent = monthName(ym);

  const days = [];
  for (const c = new Date(`${start}T12:00:00`); toISODate(c) <= end; c.setDate(c.getDate() + 1)) {
    const iso = toISODate(c);
    days.push({ iso, n: c.getDate(), dow: c.getDay(), hol: holidayName(iso), work: isWorkingDay(iso) });
  }

  // Filtro reparto
  const deptSel = document.getElementById("calDept");
  const deptOf = (id) => getPay(id).department || "Senza reparto";
  const depts = [...new Set(state.employees.map((e) => deptOf(e.id)))].sort((a, b) => a.localeCompare(b, "it"));
  const cur = deptSel.value;
  deptSel.innerHTML = `<option value="">Tutti i reparti</option>` +
    depts.map((d) => `<option value="${escapeHtml(d)}" ${d === cur ? "selected" : ""}>${escapeHtml(d)}</option>`).join("");

  const emps = state.employees
    .filter((e) => !cur || deptOf(e.id) === cur)
    .sort((a, b) => deptOf(a.id).localeCompare(deptOf(b.id), "it") || a.fullName.localeCompare(b.fullName, "it"));

  const reqs = state.requests.filter((r) =>
    (r.status === "Approved" || r.status === "Pending") && r.startDate <= end && r.endDate >= start);
  const absenceOn = (empId, iso) => reqs.find((r) => r.employeeId === empId && r.startDate <= iso && r.endDate >= iso);

  // Sovrapposizioni: 2+ persone dello stesso reparto assenti nello stesso giorno lavorativo
  const clashes = [];
  const clashDays = new Set();
  days.filter((d) => d.work).forEach((d) => {
    const byDept = {};
    state.employees.forEach((e) => {
      if (absenceOn(e.id, d.iso)) (byDept[deptOf(e.id)] ||= []).push(e.fullName);
    });
    Object.entries(byDept).forEach(([dept, names]) => {
      if (names.length > 1) { clashes.push({ iso: d.iso, dept, names }); clashDays.add(d.iso); }
    });
  });

  const head = `<tr><th class="cal-name">Dipendente</th>${days.map((d) =>
    `<th class="${d.work ? "" : "cal-off"} ${clashDays.has(d.iso) ? "cal-clash" : ""}" title="${escapeHtml(d.hol || "")}">
       <span class="cal-dow">${"DLMMGVS"[d.dow]}</span>${d.n}</th>`).join("")}</tr>`;

  let lastDept = null;
  const body = emps.map((e) => {
    const dept = deptOf(e.id);
    const sep = dept !== lastDept ? `<tr class="cal-dept"><td colspan="${days.length + 1}">${escapeHtml(dept)}</td></tr>` : "";
    lastDept = dept;
    const cells = days.map((d) => {
      const r = absenceOn(e.id, d.iso);
      if (!r || !d.work) return `<td class="${d.work ? "" : "cal-off"}"></td>`;
      const pend = r.status === "Pending";
      return `<td class="${LEAVE_CLASS[r.type] || ""} ${pend ? "cal-pending" : ""}"
                  title="${escapeHtml(`${e.fullName} · ${r.type}${pend ? " (in attesa)" : ""} · ${formatDate(r.startDate)} – ${formatDate(r.endDate)}`)}"></td>`;
    }).join("");
    return `${sep}<tr><td class="cal-name">${escapeHtml(e.fullName)}</td>${cells}</tr>`;
  }).join("");

  grid.innerHTML = `<table class="cal-table"><thead>${head}</thead><tbody>${body ||
    `<tr><td colspan="${days.length + 1}" class="empty-state">Nessun dipendente.</td></tr>`}</tbody></table>`;

  const hols = days.filter((d) => d.hol);
  document.getElementById("calHolidays").textContent = hols.length
    ? `Festività: ${hols.map((d) => `${d.n} ${d.hol}`).join(", ")}`
    : "";

  document.getElementById("calClashes").innerHTML = clashes.length
    ? `<strong>Sovrapposizioni nello stesso reparto</strong><ul>${clashes.map((c) =>
        `<li>${formatDate(c.iso)} · ${escapeHtml(c.dept)}: ${c.names.map(escapeHtml).join(", ")}</li>`).join("")}</ul>`
    : `<span class="muted">Nessuna sovrapposizione nello stesso reparto questo mese.</span>`;
}

// =====================================================================
// TEAM
// =====================================================================

function renderTeam() {
  // Stesso calcolo della scheda dipendente: solo Ferie approvate, quota
  // pro-rata dall'inizio contratto, al netto degli azzeramenti. Anno = fine periodo.
  const year = Number((state.periodEnd || toISODate(new Date())).slice(0, 4));

  const rows = state.employees.map((employee) => {
    const lb = computeLeaveBalance(employee, getPay(employee.id), year);
    const used = fmtDays(lb.used);
    const quota = fmtDays(lb.total);
    const ratio = lb.total > 0 ? Math.min(100, Math.round((lb.used / lb.total) * 100)) : 0;
    const remaining = fmtDays(lb.remaining);
    return { employee, used, remaining, ratio, quota };
  });

  refs.teamSummary.innerHTML = rows.length
    ? rows.slice(0, 5).map(teamRowMarkup).join("")
    : emptyStateMarkup("Nessun dipendente attivo.");

  refs.teamTable.innerHTML = rows.length
    ? rows.map(teamRowMarkup).join("")
    : emptyStateMarkup("Nessun dipendente attivo.");
}

function teamRowMarkup({ employee, used, remaining, ratio, quota }) {
  return `
    <article class="team-row">
      <div class="team-row-head">
        <div>
          <h4>${escapeHtml(employee.fullName)}</h4>
          <p class="meta-line">${escapeHtml(employee.email)}</p>
        </div>
        <strong>${used}/${quota} gg</strong>
      </div>
      <div class="progress-track">
        <div class="progress-bar" style="width:${ratio}%"></div>
      </div>
      <div class="team-stats">
        <span>Usati: ${used} gg</span>
        <span>Residui: ${remaining} gg</span>
        <span>${ratio}% quota</span>
      </div>
    </article>`;
}

// =====================================================================
// USERS (admin)
// =====================================================================

function renderUsers() {
  if (!refs.usersTableBody) return;

  if (!state.allUsers.length) {
    refs.usersTableBody.innerHTML =
      `<tr><td colspan="6" class="empty-state">Nessun utente.</td></tr>`;
    return;
  }

  // pending prima, poi alfabetico
  const sorted = [...state.allUsers].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  refs.usersTableBody.innerHTML = sorted.map((u) => {
    const isSelf = u.id === state.profile.id;
    return `
      <tr data-user-id="${u.id}">
        <td>${escapeHtml(u.fullName)}${isSelf ? ' <span class="muted">(tu)</span>' : ""}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>
          <select class="inline-select" data-field="role" ${isSelf ? "disabled" : ""}>
            <option value="employee" ${u.role === "employee" ? "selected" : ""}>Employee</option>
            <option value="admin"    ${u.role === "admin"    ? "selected" : ""}>Admin</option>
          </select>
        </td>
        <td>
          <input type="number" min="0" max="365" class="inline-input"
                 data-field="annual_quota" value="${u.annualQuota}" />
        </td>
        <td><span class="badge ${u.status}">${u.status}</span></td>
        <td>
          <div class="user-actions">
            ${u.status === "pending" ? `
              <button class="action-button approve" data-user-action="activate">Approva</button>
              <button class="action-button reject"  data-user-action="disable">Rifiuta</button>
            ` : u.status === "active" ? `
              <button class="action-button neutral" data-user-action="save">Salva</button>
              ${isSelf ? "" : `<button class="action-button reject" data-user-action="disable">Disattiva</button>`}
            ` : `
              <button class="action-button approve" data-user-action="activate">Riattiva</button>
            `}
            ${isSelf ? "" : `<button class="action-button reject" data-user-action="delete" title="Elimina definitivamente">Elimina</button>`}
          </div>
        </td>
      </tr>`;
  }).join("");

  refs.usersTableBody.querySelectorAll("[data-user-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest("tr");
      const userId = row.dataset.userId;
      const action = btn.dataset.userAction;
      await handleUserAction(userId, action, row);
    });
  });
}

async function deleteUser(userId, name) {
  const ok = confirm(
    `ELIMINARE DEFINITIVAMENTE ${name}?\n\n` +
    "Verranno cancellati anche: richieste ferie, scheda dipendente e voci busta paga.\n" +
    "L'operazione non si può annullare. Se vuoi solo bloccare l'accesso usa \"Disattiva\"."
  );
  if (!ok) return;

  const { error } = await supabaseClient.functions.invoke("admin-delete-user", { body: { user_id: userId } });
  if (error) {
    let message = error.message;
    try {
      const details = await error.context?.json?.();
      if (details?.error) message = details.error;
    } catch (_) { /* risposta non JSON */ }
    if (/Failed to send|not found|404/i.test(message)) {
      message = "Funzione 'admin-delete-user' non raggiungibile: verifica che sia pubblicata su Supabase.";
    }
    alert(`Errore: ${message}`);
    return;
  }
  await refreshData();
}

async function handleUserAction(userId, action, row) {
  const user = state.allUsers.find((u) => u.id === userId);
  const name = user ? `${user.fullName} (${user.email})` : "questo utente";

  if (action === "delete") return deleteUser(userId, name);

  if (action === "disable" && user?.status === "active" &&
      !confirm(`Disattivare ${name}?\n\nNon potrà più accedere al portale. Dati e storico restano salvati e puoi riattivarlo quando vuoi.`)) {
    return;
  }

  const role  = row.querySelector('[data-field="role"]').value;
  const quota = parseInt(row.querySelector('[data-field="annual_quota"]').value, 10);
  const patch = {};

  if (action === "activate") {
    patch.status = "active";
    patch.role = role;
    if (!Number.isNaN(quota) && quota >= 0) patch.annual_quota = quota;
  } else if (action === "disable") {
    patch.status = "disabled";
  } else if (action === "save") {
    patch.role = role;
    if (!Number.isNaN(quota) && quota >= 0) patch.annual_quota = quota;
  }

  const { error } = await supabaseClient
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (error) {
    alert(`Errore: ${error.message}`);
    return;
  }
  await refreshData();
}

// =====================================================================
// EXPORT
// =====================================================================

function exportCsv() {
  const rows = [[
    "Dipendente", "Email", "Tipo", "Data inizio", "Data fine",
    "Giorni lavorativi", "Stato", "Note", "Creata"
  ]];

  state.historyRows.forEach((r) => {
    const emp = getEmployeeById(r.employeeId);
    rows.push([
      emp?.fullName || "",
      emp?.email || "",
      r.type,
      r.startDate,
      r.endDate,
      r.workingDays,
      r.status,
      (r.notes || "").replaceAll('"', '""'),
      r.createdAt
    ]);
  });

  const csv = rows.map((row) => row.map((c) => `"${String(c ?? "")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marathonbet-leave-${toISODate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// =====================================================================
// UTILITIES
// =====================================================================

// =====================================================================
// ADMIN: CREA UTENTE (via Edge Function "admin-create-user")
// =====================================================================

async function handleCreateUser(event) {
  event.preventDefault();
  if (!supabaseClient || state.profile?.role !== "admin") return;

  const submitButton = refs.createUserForm.querySelector('button[type="submit"]');
  const payload = {
    full_name: refs.newUserName.value.trim(),
    email: refs.newUserEmail.value.trim(),
    password: refs.newUserPassword.value,
    role: refs.newUserRole.value,
    annual_quota: Number(refs.newUserQuota.value || DEFAULT_QUOTA)
  };

  submitButton.disabled = true;
  setStatus(refs.createUserStatus, "Creazione in corso…");

  try {
    const { data, error } = await supabaseClient.functions.invoke("admin-create-user", { body: payload });

    if (error) {
      let message = error.message;
      try {
        const details = await error.context?.json?.();
        if (details?.error) message = details.error;
      } catch (_) { /* risposta non JSON */ }
      if (/Failed to send|not found|404/i.test(message)) {
        message = "Funzione 'admin-create-user' non raggiungibile: verifica che sia pubblicata su Supabase.";
      }
      setStatus(refs.createUserStatus, message, "error");
      return;
    }

    setStatus(refs.createUserStatus, `Utente ${data?.email || payload.email} creato e attivo.`, "success");
    refs.createUserForm.reset();
    refs.newUserQuota.value = DEFAULT_QUOTA;
    await refreshData();
  } catch (err) {
    setStatus(refs.createUserStatus, `Errore: ${err.message}`, "error");
  } finally {
    submitButton.disabled = false;
  }
}

// =====================================================================
// ADMIN: SCHEDE DIPENDENTE + SIMULAZIONE PAYSLIP
// =====================================================================

// Principio: daily rate × 228 giorni = salario annuo lordo.
// Si pagano solo i giorni lavorati: le ferie non sono retribuite, quindi chi
// gode tutte le ferie (es. 2026: 261 gg lavorativi − 33 ferie = 228) incassa
// esattamente il salario annuo indicato.
const ANNUAL_PAID_DAYS = 228;

// Giorni lavorativi (lun-ven) dell'anno
function workingDaysInYear(year) {
  return countWorkingDays(`${year}-01-01`, `${year}-12-31`);
}

// Il daily rate è il dato inserito; il salario annuo = daily rate × 228.
function effectiveRate(pay, _year) {
  return pay.dailyRate;
}

function annualFromRate(rate) {
  return Math.round((Number(rate) || 0) * ANNUAL_PAID_DAYS * 100) / 100;
}

function prevDay(iso) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}
const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const fmtEur = (v) => eur.format(Number(v) || 0);
const fmtDays = (v) => (Math.round((Number(v) || 0) * 100) / 100).toLocaleString("it-IT");

function bindEmployeeSheetEvents() {
  if (!refs.empSelect) return;

  const now = new Date();
  state.payMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  refs.payMonth.value = state.payMonth;

  refs.empBack.addEventListener("click", openDirectory);
  refs.dirSearch.addEventListener("input", renderDirectory);
  refs.dirDept.addEventListener("change", renderDirectory);
  const openFromRow = (target) => {
    const row = target.closest("tr[data-emp]");
    if (row) openEmployee(row.dataset.emp);
  };
  refs.dirBody.addEventListener("click", (e) => openFromRow(e.target));
  refs.dirBody.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFromRow(e.target); }
  });

  refs.empSelect.addEventListener("change", async () => {
    state.selectedEmployeeId = refs.empSelect.value;
    state.payItemsAll = [];
    state.validations = [];
    setStatus(refs.empStatus, "");
    setStatus(refs.payStatus, "");
    renderEmployeeSheet();
    await loadPayItems();
  });

  refs.payMonth.addEventListener("change", async () => {
    if (!refs.payMonth.value) return;
    state.payMonth = refs.payMonth.value;
    setStatus(refs.payStatus, "");
    renderEmployeeSheet();
  });

  refs.empForm.addEventListener("submit", saveEmployeeSheet);

  // Dati fattura del mese: numero, descrizione attività, giorni lavorati
  refs.payInvoiceForm.addEventListener("submit", (e) => e.preventDefault());
  [["payInvNumber", "number"], ["payInvDesc", "description"], ["payInvDays", "days"], ["payInvTotal", "total"]].forEach(([id, key]) => {
    refs[id].addEventListener("input", () => {
      const ctx = state.lastPayslip;
      if (!ctx || ctx.validation) return;
      setPayOverride(ctx.employee.id, state.payMonth, { [key]: refs[id].value.trim() });
      renderEmployeeSheet();
    });
  });

  refs.empRate.addEventListener("input", syncSalaryField);
  refs.empSalary.addEventListener("input", syncSalaryField);
  refs.empPayType.addEventListener("change", syncSalaryField);
  refs.empIban.addEventListener("input", syncIbanHint);
  refs.empIban.addEventListener("blur", () => { refs.empIban.value = formatIban(refs.empIban.value); });

  refs.payItemKind.addEventListener("change", syncPayItemForm);
  refs.payItemForm.addEventListener("submit", addPayItem);
  refs.payPrint.addEventListener("click", printPayslip);
  refs.payGenerate.addEventListener("click", generateInvoice);

  refs.leaveResetUsed.addEventListener("click", resetUsedLeave);
  refs.leaveUndoReset.addEventListener("click", undoLeaveReset);
  refs.leaveResetPending.addEventListener("click", resetPendingLeave);

  refs.payValidation.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-validation]");
    if (!btn) return;
    const action = btn.dataset.validation;
    if (action === "validate") validateMonth();
    else if (action === "send") sendInvoice();
    else unvalidateMonth();
  });

  refs.invBody.addEventListener("click", async (event) => {
    const row = event.target.closest("[data-month]");
    if (!row) return;
    state.payMonth = row.dataset.month;
    refs.payMonth.value = state.payMonth;
    setStatus(refs.payStatus, "");
    renderEmployeeSheet();
    refs.payValidation.closest(".card").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  refs.payBody.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-delete-item]");
    if (!btn) return;
    if (getValidation(state.payMonth)) return setStatus(refs.payStatus, "Mese validato: annulla la validazione per modificarlo.", "error");
    if (!confirm("Eliminare questa voce?")) return;
    const { error } = await supabaseClient.from("payslip_items").delete().eq("id", btn.dataset.deleteItem);
    if (error) return setStatus(refs.payStatus, payTableError(error), "error");
    await loadPayItems();
  });

  syncPayItemForm();
}

async function fetchEmployeePay() {
  return supabaseClient
    .from("employee_pay")
    .select("*");
}

function payTableError(error) {
  const msg = error?.message || "";
  // Colonna mancante -> script non ancora eseguito (o eseguito in versione vecchia)
  const col = msg.match(/'([a-z_]+)' column of '([a-z_]+)'/i) || msg.match(/column [a-z_]+\.([a-z_]+) does not exist/i);
  if (col) {
    const scriptFor = {
      billing_email: "supabase_billing.sql", billing_name: "supabase_billing.sql", billing_address: "supabase_billing.sql",
      tax_id: "supabase_billing.sql", bank_holder: "supabase_billing.sql", bank_name: "supabase_billing.sql",
      iban: "supabase_billing.sql", bic_swift: "supabase_billing.sql", pay_type: "supabase_billing.sql",
      sent_at: "supabase_billing.sql", sent_to: "supabase_billing.sql"
    };
    const script = scriptFor[col[1]] || "l'ultimo script SQL del repository";
    return `Database da aggiornare: manca il campo "${col[1]}". Esegui ${script} nel SQL Editor di Supabase.`;
  }
  const table = msg.match(/relation "?(?:public\.)?([a-z_]+)"? does not exist/i) || msg.match(/table '(?:public\.)?([a-z_]+)'/i);
  if (table) {
    const scriptFor = {
      employee_pay: "supabase_payroll.sql", payslip_items: "supabase_payroll.sql",
      leave_adjustments: "supabase_validations.sql", payslip_validations: "supabase_validations.sql"
    };
    return `Database da aggiornare: manca la tabella "${table[1]}". Esegui ${scriptFor[table[1]] || "lo script SQL indicato nel README"} nel SQL Editor di Supabase.`;
  }
  return msg;
}

function getPay(employeeId) {
  const r = state.payData[employeeId] || {};
  return {
    jobTitle: r.job_title || "",
    department: r.department || "",
    contractStart: r.contract_start || "",
    payType: r.pay_type === "fixed" ? "fixed" : "daily",
    // fisso: salario inserito, daily rate = equivalente giornaliero (÷ 228)
    // daily: daily rate inserito, salario = daily rate × 228
    dailyRate: r.pay_type === "fixed"
      ? (Number(r.annual_salary) || 0) / ANNUAL_PAID_DAYS
      : Number(r.daily_rate) || 0,
    annualSalary: r.pay_type === "fixed" ? Number(r.annual_salary) || 0 : annualFromRate(r.daily_rate),
    notes: r.notes || "",
    billingName: r.billing_name || "",
    billingEmail: r.billing_email || "",
    billingAddress: r.billing_address || "",
    taxId: r.tax_id || "",
    bankHolder: r.bank_holder || "",
    bankName: r.bank_name || "",
    iban: r.iban || "",
    bic: r.bic_swift || ""
  };
}

function monthBounds(ym) {
  const [y, m] = ym.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { year: y, month: m, start, end };
}

// Giorni lavorativi di una richiesta che cadono dentro [from, to]
function clippedWorkingDays(req, from, to) {
  const s = req.startDate > from ? req.startDate : from;
  const e = req.endDate < to ? req.endDate : to;
  return e < s ? 0 : countWorkingDays(s, e);
}

function sumDays(employeeId, from, to, { type, status }) {
  return state.requests
    .filter((r) => r.employeeId === employeeId &&
                   (!type || r.type === type) &&
                   (!status || r.status === status))
    .reduce((sum, r) => sum + clippedWorkingDays(r, from, to), 0);
}

function computeLeaveBalance(employee, pay, year) {
  const quota = employee.annualQuota ?? DEFAULT_QUOTA;
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  // Pro-rata se il contratto inizia durante l'anno (mesi interi dal mese di inizio)
  let months = 12;
  if (pay.contractStart) {
    const [cy, cm] = pay.contractStart.split("-").map(Number);
    if (cy > year) months = 0;
    else if (cy === year) months = 12 - cm + 1;
  }
  const total = Math.round(((quota * months) / 12) * 2) / 2;

  const usedRaw = sumDays(employee.id, from, to, { type: "Ferie", status: "Approved" });
  const offset = state.leaveAdj[`${employee.id}|${year}`] || 0;
  const used = Math.max(usedRaw - offset, 0);
  const pending = sumDays(employee.id, from, to, { type: "Ferie", status: "Pending" });
  const permessi = sumDays(employee.id, from, to, { type: "Permesso", status: "Approved" });
  const malattia = sumDays(employee.id, from, to, { type: "Malattia", status: "Approved" });

  return { quota, months, total, used, usedRaw, offset, pending, permessi, malattia, remaining: total - used };
}

// Dati fattura inseriti a mano per dipendente+mese (finché il mese non è validato;
// alla validazione vengono salvati nello snapshot)
const PAY_OV_KEY = "mbi-pay-overrides";

function readPayOverrides() {
  try { return JSON.parse(localStorage.getItem(PAY_OV_KEY)) || {}; } catch { return {}; }
}

// Dati fattura condivisi HR/dipendente (tabella invoice_drafts). Se la tabella
// non c'è ancora, si usa il salvataggio locale del browser come prima.
async function loadDrafts(employeeId) {
  if (!supabaseClient) return;
  let q = supabaseClient.from("invoice_drafts").select("employee_id, month, invoice_number, description, days, total");
  if (employeeId) q = q.eq("employee_id", employeeId);
  const { data, error } = await q;
  if (error) {
    state.draftsAvailable = !/invoice_drafts|relation|does not exist/i.test(error.message || "");
    console.error(error);
    return;
  }
  state.draftsAvailable = true;
  const next = employeeId
    ? Object.fromEntries(Object.entries(state.drafts).filter(([k]) => !k.startsWith(`${employeeId}|`)))
    : {};
  data.forEach((r) => {
    const d = {
      number: r.invoice_number || "",
      description: r.description || "",
      days: r.days == null ? "" : String(Number(r.days)),
      total: r.total == null ? "" : String(Number(r.total))
    };
    Object.keys(d).forEach((k) => { if (d[k] === "") delete d[k]; });
    next[`${r.employee_id}|${r.month.slice(0, 7)}`] = d;
  });
  state.drafts = next;

  // Admin: porta nel database i dati fattura salvati finora solo in questo browser
  if (!employeeId && state.profile?.role === "admin") {
    Object.entries(readPayOverrides()).forEach(([k, val]) => {
      if (next[k] || !val || !Object.keys(val).length) return;
      const [emp, ym] = k.split("|");
      if (!emp || !/^\d{4}-\d{2}$/.test(ym || "")) return;
      state.drafts[k] = { ...val };
      saveDraft(emp, ym);
    });
  }
}

function getPayOverride(employeeId, ym) {
  const key = `${employeeId}|${ym}`;
  if (state.drafts[key]) return { ...state.drafts[key] };
  return readPayOverrides()[key] || {};
}

const draftTimers = {};

function setPayOverride(employeeId, ym, patch) {
  const key = `${employeeId}|${ym}`;
  const cur = { ...getPayOverride(employeeId, ym), ...patch };
  Object.keys(cur).forEach((k) => { if (cur[k] === "" || cur[k] == null) delete cur[k]; });
  try {
    const all = readPayOverrides();
    if (Object.keys(cur).length) all[key] = cur; else delete all[key];
    localStorage.setItem(PAY_OV_KEY, JSON.stringify(all));
  } catch { /* storage non disponibile */ }
  if (!state.draftsAvailable || !supabaseClient) return;
  state.drafts[key] = cur;
  clearTimeout(draftTimers[key]);
  draftTimers[key] = setTimeout(() => saveDraft(employeeId, ym), 700);
}

async function saveDraft(employeeId, ym) {
  const d = state.drafts[`${employeeId}|${ym}`] || {};
  const month = `${ym}-01`;
  const num = (v) => (v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 100) / 100);
  const empty = !Object.keys(d).length;
  const { error } = empty
    ? await supabaseClient.from("invoice_drafts").delete().eq("employee_id", employeeId).eq("month", month)
    : await supabaseClient.from("invoice_drafts").upsert({
        employee_id: employeeId,
        month,
        invoice_number: d.number || "",
        description: d.description || "",
        days: num(d.days),
        total: num(d.total),
        updated_at: new Date().toISOString(),
        updated_by: state.profile?.id || null
      });
  if (error) {
    console.error(error);
    if (/invoice_drafts|relation|does not exist/i.test(error.message || "")) state.draftsAvailable = false;
    const node = state.activeView === "mycard" ? refs.myStatus : refs.payStatus;
    setStatus(node, `Dati fattura non salvati: ${error.message}`, "error");
  }
}

function computePayslip(employee, pay, ym) {
  const { year, start, end } = monthBounds(ym);
  const rate = effectiveRate(pay, year);
  const effStart = pay.contractStart && pay.contractStart > start ? pay.contractStart : start;
  const notStarted = pay.contractStart && pay.contractStart > end;

  const workingDays = notStarted ? 0 : countWorkingDays(effStart, end);
  const absence = (type) => notStarted ? 0
    : sumDays(employee.id, effStart, end, { type, status: "Approved" });
  const ferie = absence("Ferie");
  const permessi = absence("Permesso");
  const malattia = absence("Malattia");
  const computedWorked = Math.max(workingDays - ferie - permessi - malattia, 0);
  const ov = getPayOverride(employee.id, ym);
  const daysOv = ov.days !== undefined && ov.days !== "" && Number.isFinite(Number(ov.days)) && Number(ov.days) >= 0
    ? Number(ov.days) : null;
  const worked = pay.payType !== "fixed" && daysOv != null ? daysOv : computedWorked;

  // Ferie non retribuite (il daily rate è già calcolato su 228 giorni)
  const paidFerie = 0;
  const unpaidFerie = ferie;

  // Compenso base
  let base, fixedMonthly = 0, fixedRatio = 1;
  if (pay.payType === "fixed") {
    // Fisso: fattura mensile = salario annuo ÷ 12. Assenze non scalate.
    fixedMonthly = Math.round((pay.annualSalary / 12) * 100) / 100;
    fixedRatio = notStarted ? 0 : 1;
    base = fixedMonthly * fixedRatio;
  } else {
    base = worked * rate;
  }
  const ferieAmount = 0;
  const items = itemsForMonth(start);
  const bonus = items.reduce((s, i) => s + Number(i.amount || 0), 0);

  // Importo totale modificato a mano: la differenza va sul compenso base
  const computedTotal = Math.round((base + ferieAmount + bonus) * 100) / 100;
  const totalOv = ov.total !== undefined && ov.total !== "" && Number.isFinite(Number(ov.total)) && Number(ov.total) >= 0
    ? Math.round(Number(ov.total) * 100) / 100 : null;
  if (totalOv != null) base = totalOv - ferieAmount - bonus;

  return {
    payType: pay.payType, fixedMonthly, fixedRatio,
    computedWorked, daysEdited: pay.payType !== "fixed" && daysOv != null,
    invoiceNo: ov.number || "", description: ov.description || "",
    computedTotal, totalEdited: totalOv != null,
    year, rate, start, end, effStart, workingDays, ferie, paidFerie, unpaidFerie,
    permessi, malattia, worked, base, ferieAmount, bonus, items,
    total: totalOv != null ? totalOv : computedTotal
  };
}

function normalizeIban(v) {
  return String(v || "").replace(/\s+/g, "").toUpperCase();
}

function formatIban(v) {
  return normalizeIban(v).replace(/(.{4})/g, "$1 ").trim();
}

// Controllo standard ISO 13616 (mod 97)
function isValidIban(v) {
  const iban = normalizeIban(v);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  if (iban.startsWith("IT") && iban.length !== 27) return false;
  const moved = (iban.slice(4) + iban.slice(0, 4))
    .replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of moved) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

function syncIbanHint() {
  const v = normalizeIban(refs.empIban.value);
  refs.empIbanHint.textContent = !v ? "" : isValidIban(v) ? "✓ IBAN valido" : "IBAN non valido";
  refs.empIbanHint.classList.toggle("ok", Boolean(v) && isValidIban(v));
  refs.empIbanHint.classList.toggle("bad", Boolean(v) && !isValidIban(v));
}

function syncSalaryField() {
  const fixed = refs.empPayType.value === "fixed";
  refs.empRate.readOnly = fixed;
  refs.empRate.tabIndex = fixed ? -1 : 0;
  refs.empSalary.readOnly = !fixed;
  refs.empSalary.tabIndex = fixed ? 0 : -1;

  refs.empRateBox.classList.toggle("hidden", fixed);

  if (fixed) {
    const salary = Number(refs.empSalary.value);
    refs.empRate.value = salary > 0 ? (salary / ANNUAL_PAID_DAYS).toFixed(2) : "";
    refs.empRateHint.textContent = salary > 0
      ? `Fattura mensile: ${fmtEur(salary / 12)} (salario ÷ 12)`
      : "Inserisci il salario annuo";
  } else {
    const rate = Number(refs.empRate.value);
    refs.empRateLabel.textContent = "Daily rate (€)";
    refs.empRateSub.textContent = "";
    refs.empSalary.value = rate > 0 ? annualFromRate(rate).toFixed(2) : "";
    refs.empRateHint.textContent = `Calcolato: daily rate × ${ANNUAL_PAID_DAYS} giorni`;
  }
}

// =====================================================================
// ELENCO DIPENDENTI (home della sezione)
// =====================================================================

function currentYm() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function openDirectory() {
  state.empMode = "list";
  syncEmployeeMode();
  renderDirectory();
  loadDirectoryData();
}

async function openEmployee(id) {
  state.empMode = "detail";
  state.selectedEmployeeId = id;
  state.payItemsAll = [];
  state.validations = [];
  setStatus(refs.empStatus, "");
  setStatus(refs.payStatus, "");
  syncEmployeeMode();
  renderEmployeeSheet();
  window.scrollTo({ top: 0, behavior: "smooth" });
  await loadPayItems();
}

function syncEmployeeMode() {
  const list = state.empMode !== "detail";
  refs.empDirectory.classList.toggle("hidden", !list);
  refs.empDetail.classList.toggle("hidden", list);
}

// Validazioni e voci del mese corrente per tutti i dipendenti
async function loadDirectoryData() {
  if (!supabaseClient || state.profile?.role !== "admin") return;
  const ym = currentYm();
  const { start } = monthBounds(ym);
  const [valRes, itemsRes] = await Promise.all([
    supabaseClient.from("payslip_validations").select("employee_id, month, amount, sent_at").eq("month", start),
    supabaseClient.from("payslip_items").select("employee_id, month, kind, description, days, amount").eq("month", start)
  ]);
  state.dir = {
    ym,
    validations: valRes.error ? [] : valRes.data,
    items: itemsRes.error ? [] : itemsRes.data
  };
  renderDirectory();
}

function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function directoryRow(employee, ym, dir) {
  const pay = getPay(employee.id);
  const year = Number(ym.slice(0, 4));
  const lb = computeLeaveBalance(employee, pay, year);

  // Fattura del mese: importo validato se presente, altrimenti simulazione con le voci di quel dipendente
  const saved = state.payItemsAll;
  state.payItemsAll = (dir?.items || []).filter((i) => i.employee_id === employee.id);
  const ps = computePayslip(employee, pay, ym);
  state.payItemsAll = saved;
  const v = (dir?.validations || []).find((x) => x.employee_id === employee.id);

  const missing = [
    !(pay.payType === "fixed" ? pay.annualSalary : pay.dailyRate) && "compenso",
    !pay.iban && "IBAN",
    !pay.contractStart && "inizio contratto"
  ].filter(Boolean);

  return { employee, pay, lb, ps, v, missing, amount: v ? Number(v.amount) : ps.total };
}

function renderDirectory() {
  if (!refs.dirBody || state.profile?.role !== "admin") return;
  const ym = state.dir?.ym || currentYm();
  const dir = state.dir && state.dir.ym === ym ? state.dir : null;
  const rows = state.employees.map((e) => directoryRow(e, ym, dir))
    .sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName, "it"));

  // Filtri
  const depts = [...new Set(rows.map((r) => r.pay.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  const curDept = refs.dirDept.value;
  refs.dirDept.innerHTML = `<option value="">Tutti i dipartimenti</option>` +
    depts.map((d) => `<option value="${escapeHtml(d)}" ${d === curDept ? "selected" : ""}>${escapeHtml(d)}</option>`).join("");
  const q = refs.dirSearch.value.trim().toLowerCase();
  const shown = rows.filter((r) =>
    (!curDept || r.pay.department === curDept) &&
    (!q || [r.employee.fullName, r.employee.email, r.pay.jobTitle, r.pay.department].join(" ").toLowerCase().includes(q)));

  // Riepilogo
  const monthLabel = monthName(ym);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const validated = rows.filter((r) => r.v).length;
  const sent = rows.filter((r) => r.v?.sent_at).length;
  const incomplete = rows.filter((r) => r.missing.length).length;
  refs.dirMetrics.innerHTML = [
    ["Dipendenti attivi", rows.length, `${depts.length} dipartiment${depts.length === 1 ? "o" : "i"}`],
    [`Fatture ${monthLabel.toLowerCase()}`, fmtEur(total), "validato o simulato"],
    ["Validate", `${validated}/${rows.length}`, `${sent} inviate`],
    ["Schede incomplete", incomplete, incomplete ? "mancano dati (vedi elenco)" : "tutto in ordine"]
  ].map(([label, value, sub]) => `
    <article class="metric-card">
      <span class="metric-label">${label}</span>
      <strong class="metric-value">${value}</strong>
      <span class="metric-detail">${sub}</span>
    </article>`).join("");

  refs.dirMonthHead.textContent = `Fattura ${monthLabel.toLowerCase()}`;
  refs.dirCount.textContent = shown.length === rows.length ? `${rows.length} dipendenti` : `${shown.length} di ${rows.length}`;

  refs.dirBody.innerHTML = shown.length ? shown.map((r) => {
    const { employee, pay, lb, v, missing } = r;
    const comp = pay.payType === "fixed"
      ? (pay.annualSalary ? `${fmtEur(pay.annualSalary)}<span class="dir-sub">fisso annuo</span>` : "-")
      : (pay.dailyRate ? `${fmtEur(pay.dailyRate)}<span class="dir-sub">al giorno</span>` : "-");
    const status = v
      ? (v.sent_at ? `<span class="badge Approved">Inviata</span>` : `<span class="badge neutral">Validata</span>`)
      : `<span class="badge Pending">Da validare</span>`;
    return `
      <tr data-emp="${employee.id}" tabindex="0">
        <td>
          <div class="dir-person">
            <span class="dir-avatar">${escapeHtml(initials(employee.fullName))}</span>
            <div>
              <strong>${escapeHtml(employee.fullName)}</strong>
              <span class="dir-sub">${escapeHtml(employee.email || "")}</span>
              ${missing.length ? `<span class="dir-warn">Manca: ${missing.join(", ")}</span>` : ""}
            </div>
          </div>
        </td>
        <td>${escapeHtml(pay.jobTitle || "-")}<span class="dir-sub">${escapeHtml(pay.department || "Nessun dipartimento")}</span></td>
        <td class="num">${comp}</td>
        <td class="num ${lb.remaining < 0 ? "negative-text" : ""}">${fmtDays(lb.remaining)} gg<span class="dir-sub">su ${fmtDays(lb.total)}</span></td>
        <td class="num">${fmtEur(r.amount)}<span class="dir-sub">${v ? "validato" : (r.ps.totalEdited || r.ps.daysEdited)
          ? `modificato a mano · calcolato ${fmtEur(r.ps.computedTotal)}` : "simulato"}</span></td>
        <td>${status}</td>
      </tr>`;
  }).join("") : `<tr><td colspan="6" class="empty-state">Nessun dipendente corrisponde ai filtri.</td></tr>`;
}

function renderEmployeeSheet() {
  if (!refs.empSelect || state.profile?.role !== "admin") return;
  syncEmployeeMode();
  if (state.empMode !== "detail") { renderDirectory(); return; }

  const employees = state.employees;
  refs.empEmpty.classList.toggle("hidden", employees.length > 0);
  refs.empSheet.classList.toggle("hidden", employees.length === 0);
  if (!employees.length) return;

  if (!employees.some((e) => e.id === state.selectedEmployeeId)) {
    state.selectedEmployeeId = employees[0].id;
  }

  refs.empSelect.innerHTML = employees.map((e) =>
    `<option value="${e.id}" ${e.id === state.selectedEmployeeId ? "selected" : ""}>${escapeHtml(e.fullName)}</option>`
  ).join("");

  const departments = [...new Set(Object.values(state.payData).map((r) => r.department).filter(Boolean))].sort();
  refs.departmentList.innerHTML = departments.map((d) => `<option value="${escapeHtml(d)}"></option>`).join("");

  const employee = getEmployeeById(state.selectedEmployeeId);
  const pay = getPay(employee.id);

  // Intestazione
  refs.empName.textContent = employee.fullName;
  refs.empMeta.textContent = [
    pay.jobTitle || "Ruolo non impostato",
    pay.department || "Dipartimento non impostato",
    employee.email,
    pay.contractStart ? `dal ${formatDate(pay.contractStart)}` : null
  ].filter(Boolean).join(" · ");

  // Form (non sovrascrivere mentre l'admin sta scrivendo)
  if (!refs.empForm.contains(document.activeElement) || refs.empForm.dataset.for !== employee.id) {
    refs.empForm.dataset.for = employee.id;
    refs.empJobTitle.value = pay.jobTitle;
    refs.empDepartment.value = pay.department;
    refs.empContractStart.value = pay.contractStart;
    refs.empPayType.value = pay.payType;
    refs.empRate.value = pay.payType === "daily" ? (pay.dailyRate || "") : "";
    refs.empSalary.value = pay.payType === "fixed" ? (pay.annualSalary || "") : "";
    syncSalaryField();
    refs.empQuota.value = employee.annualQuota ?? DEFAULT_QUOTA;
    refs.empNotes.value = pay.notes;
    refs.empBillingName.value = pay.billingName;
    refs.empBillingEmail.value = pay.billingEmail;
    refs.empBillingEmail.placeholder = employee.email;
    refs.empBillingAddress.value = pay.billingAddress;
    refs.empTaxId.value = pay.taxId;
    refs.empBankHolder.value = pay.bankHolder;
    refs.empBankHolder.placeholder = pay.billingName || employee.fullName;
    refs.empBankName.value = pay.bankName;
    refs.empIban.value = formatIban(pay.iban);
    refs.empBic.value = pay.bic;
    syncIbanHint();
  }

  // Saldo ferie (anno del mese selezionato)
  const year = Number(state.payMonth.slice(0, 4));
  const lb = computeLeaveBalance(employee, pay, year);
  refs.leaveYearLabel.textContent = year;
  refs.leaveTotal.textContent = `${fmtDays(lb.total)} gg`;
  refs.leaveTotalDetail.textContent = lb.months < 12
    ? `Pro-rata ${lb.months}/12 di ${lb.quota} gg`
    : `Quota annua ${lb.quota} gg`;
  refs.leaveUsed.textContent = `${fmtDays(lb.used)} gg`;
  refs.leavePending.textContent = `${fmtDays(lb.pending)} gg`;
  refs.leaveRemaining.textContent = `${fmtDays(lb.remaining)} gg`;
  refs.leaveRemaining.classList.toggle("negative", lb.remaining < 0);
  refs.leaveBar.style.width = `${lb.total ? Math.min(100, Math.round((lb.used / lb.total) * 100)) : 0}%`;
  refs.leaveResetUsed.classList.toggle("hidden", !lb.used);
  refs.leaveUndoReset.classList.toggle("hidden", !lb.offset);
  refs.leaveResetPending.classList.toggle("hidden", !lb.pending);
  if (lb.offset) refs.leaveTotalDetail.textContent += ` · azzerati ${fmtDays(lb.offset)} gg godute`;
  refs.leaveOther.textContent = `Altre assenze approvate nell'anno: Permessi ${fmtDays(lb.permessi)} gg · Malattia ${fmtDays(lb.malattia)} gg`;

  const rate = effectiveRate(pay, year);
  refs.kpiRateBox.classList.toggle("hidden", pay.payType === "fixed");
  if (pay.payType !== "fixed") {
    refs.kpiRateLabel.textContent = "Daily rate";
    refs.kpiRate.textContent = rate ? fmtEur(rate) : "-";
  }
  refs.kpiSalary.textContent = pay.annualSalary ? fmtEur(pay.annualSalary) : "-";
  refs.kpiLeave.textContent = `${fmtDays(lb.remaining)} gg`;

  renderPayslip(employee, pay);
}

function renderPayslip(employee, pay) {
  const ps = computePayslip(employee, pay, state.payMonth);

  const fixed = ps.payType === "fixed";
  const rows = [fixed ? `
    <tr>
      <td>Compenso mensile (salario annuo ÷ 12)</td>
      <td class="num"></td>
      <td class="num"></td>
      <td class="num">${fmtEur(ps.base)}</td>
      <td></td>
    </tr>` : `
    <tr>
      <td>Retribuzione giorni lavorati${ps.daysEdited ? ` <span class="muted">(modificati a mano, calcolati ${fmtDays(ps.computedWorked)})</span>` : ""}</td>
      <td class="num">${fmtDays(ps.worked)}</td>
      <td class="num">${fmtEur(ps.totalEdited && ps.worked ? ps.base / ps.worked : ps.rate)}</td>
      <td class="num">${fmtEur(ps.base)}</td>
      <td></td>
    </tr>`];

  if (ps.ferie && !fixed) {
    rows.push(`
      <tr class="pay-info">
        <td>Ferie godute (non retribuite)</td>
        <td class="num">${fmtDays(ps.unpaidFerie)}</td>
        <td class="num">${fmtEur(0)}</td>
        <td class="num">${fmtEur(0)}</td>
        <td></td>
      </tr>`);
  }

  const validation = getValidation(state.payMonth);
  state.payItems = ps.items;
  ps.items.forEach((i) => {
    rows.push(`
      <tr>
        <td><span class="badge ${i.kind === "Rimborso" ? "neutral" : "Approved"}">${i.kind === "Ferie pagate" ? "Ferie liquidate" : escapeHtml(i.kind)}</span>
            ${i.description ? `<span class="muted"> ${escapeHtml(i.description)}</span>` : ""}</td>
        <td class="num">${i.days != null ? fmtDays(i.days) : ""}</td>
        <td class="num">${i.days != null && Number(i.days) ? fmtEur(i.amount / i.days) : ""}</td>
        <td class="num">${fmtEur(i.amount)}</td>
        <td class="num">${validation ? "" : `<button type="button" class="action-button reject" data-delete-item="${i.id}" title="Elimina">✕</button>`}</td>
      </tr>`);
  });

  refs.payBody.innerHTML = rows.join("");
  refs.payTotal.innerHTML = ps.totalEdited
    ? `${fmtEur(ps.total)} <span class="muted">(a mano, calcolato ${fmtEur(ps.computedTotal)})</span>`
    : fmtEur(ps.total);

  const parts = [`Giorni lavorativi nel mese: ${ps.workingDays}`];
  if (ps.effStart !== ps.start) parts[0] += ` (dal ${formatDate(ps.effStart)}, inizio contratto)`;
  parts.push(`Ferie ${fmtDays(ps.ferie)}`, `Permessi ${fmtDays(ps.permessi)}`, `Malattia ${fmtDays(ps.malattia)}`);
  parts.push(`→ Giorni lavorati ${fmtDays(ps.worked)}`);
  const rateNote = fixed
    ? (pay.annualSalary > 0
        ? ` Salario fisso: ${fmtEur(pay.annualSalary)} ÷ 12 = ${fmtEur(ps.fixedMonthly)} al mese; ferie, permessi e malattia non riducono il compenso.`
        : " — Imposta il salario fisso annuo nei dati contrattuali.")
    : (pay.annualSalary > 0
        ? ` Salario annuo = ${fmtEur(ps.rate)} × ${ANNUAL_PAID_DAYS} giorni = ${fmtEur(pay.annualSalary)}.`
        : " — Imposta il daily rate nei dati contrattuali.");
  refs.payDaysDetail.textContent = fixed
    ? (pay.annualSalary > 0
        ? `Salario annuo ${fmtEur(pay.annualSalary)} ÷ 12 = ${fmtEur(ps.fixedMonthly)} al mese. Ferie, permessi e malattia non riducono la fattura.`
        : "Imposta il salario annuo nei dati contrattuali.")
    : parts.join(" · ") + "." + rateNote;
  state.lastPayslip = { employee, pay, ps, validation };
  renderInvoiceFields(ps, validation);

  // Barra validazione
  const monthLabel = monthName(state.payMonth);
  if (validation) {
    const changed = Math.abs(Number(validation.amount) - ps.total) >= 0.01;
    refs.payValidation.innerHTML = `
      <div class="validation-box validated">
        <div>
          <strong>✓ ${monthLabel} validato: ${fmtEur(validation.amount)}</strong>
          <span class="metric-detail">il ${formatDate(validation.validated_at)}${validation.validated_by ? ` da ${escapeHtml(getEmployeeById(validation.validated_by)?.fullName || "admin")}` : ""}</span>
          ${validation.sent_at
            ? `<span class="metric-detail sent-line">✉ Inviata il ${formatDate(validation.sent_at)} a ${escapeHtml(validation.sent_to || "")}</span>`
            : ""}
          ${changed ? `<span class="validation-warn">Attenzione: con i dati attuali il mese varrebbe ${fmtEur(ps.total)}. L'importo validato resta ${fmtEur(validation.amount)}.</span>` : ""}
        </div>
        <div class="validation-actions">
          <button type="button" class="primary-button" data-validation="send">${validation.sent_at ? "Invia di nuovo" : "Invia fattura"}</button>
          <button type="button" class="action-button neutral" data-validation="undo">Annulla validazione</button>
        </div>
      </div>`;
  } else {
    refs.payValidation.innerHTML = `
      <div class="validation-box">
        <div>
          <strong>${monthLabel}: da validare</strong>
          <span class="metric-detail">Validando, l'importo di ${fmtEur(ps.total)} viene registrato nel fatturato e il mese non è più modificabile.</span>
        </div>
        <button type="button" class="primary-button" data-validation="validate" ${ps.total > 0 ? "" : "disabled"}>Valida importo</button>
      </div>`;
  }
  refs.payItemForm.classList.toggle("is-locked", Boolean(validation));
  [...refs.payItemForm.elements].forEach((el) => { el.disabled = Boolean(validation); });

  renderInvoiceHistory(employee, pay);
}

function renderInvoiceFields(ps, validation) {
  const d = validation?.details || {};
  const locked = Boolean(validation);
  const vals = locked
    ? { number: d.invoice_number || "", description: d.description || "", days: d.days_edited ? String(validation.worked_days) : "",
        total: d.total_edited ? String(validation.amount) : "" }
    : { number: ps.invoiceNo, description: ps.description, days: ps.daysEdited ? String(ps.worked) : "",
        total: ps.totalEdited ? String(ps.total) : "" };
  const set = (input, value) => { if (document.activeElement !== input) input.value = value; };
  set(refs.payInvNumber, vals.number);
  set(refs.payInvDesc, vals.description);
  set(refs.payInvDays, vals.days);
  set(refs.payInvTotal, vals.total);
  refs.payInvTotal.placeholder = ps.computedTotal.toFixed(2);
  refs.payInvTotalHint.textContent = `Calcolato: ${fmtEur(ps.computedTotal)} (vuoto = automatico)`;
  refs.payInvNumber.placeholder = invoiceNumber(state.payMonth);
  refs.payInvDesc.placeholder = defaultInvoiceDescription(state.payMonth, ps.payType !== "fixed");
  refs.payInvDays.placeholder = fmtDays(ps.computedWorked);
  refs.payInvDaysHint.textContent = `Calcolati: ${fmtDays(ps.computedWorked)} (vuoto = automatico)`;
  refs.payInvDaysWrap.classList.toggle("hidden", ps.payType === "fixed");
  refs.payInvoiceForm.classList.toggle("is-locked", locked);
  [...refs.payInvoiceForm.elements].forEach((el) => { el.disabled = locked; });
}

function syncPayItemForm() {
  const isFerie = refs.payItemKind.value === "Ferie pagate";
  refs.payItemDaysWrap.classList.toggle("hidden", !isFerie);
  refs.payItemAmountWrap.classList.toggle("hidden", isFerie);
}

async function loadPayItems() {
  if (!supabaseClient || state.profile?.role !== "admin" || !state.selectedEmployeeId) return;
  const empId = state.selectedEmployeeId;
  const [itemsRes, valRes] = await Promise.all([
    supabaseClient.from("payslip_items")
      .select("id, month, kind, description, days, amount, created_at")
      .eq("employee_id", empId)
      .order("created_at", { ascending: true }),
    supabaseClient.from("payslip_validations")
      .select("*")
      .eq("employee_id", empId)
      .order("month", { ascending: true })
  ]);
  if (empId !== state.selectedEmployeeId) return; // nel frattempo è cambiato dipendente

  state.payItemsAll = itemsRes.error ? [] : itemsRes.data;
  state.validations = valRes.error ? [] : valRes.data;
  const err = itemsRes.error || valRes.error;
  if (err) setStatus(refs.payStatus, payTableError(err), "error");
  renderEmployeeSheet();
}

function itemsForMonth(monthStart) {
  return state.payItemsAll.filter((i) => i.month === monthStart);
}

function getValidation(ym) {
  const { start } = monthBounds(ym);
  return state.validations.find((v) => v.month === start);
}

function monthName(ym) {
  const label = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" })
    .format(new Date(`${monthBounds(ym).start}T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function renderInvoiceHistory(employee, pay) {
  const year = Number(state.payMonth.slice(0, 4));
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startYm = pay.contractStart ? pay.contractStart.slice(0, 7) : null;

  let totSim = 0, totVal = 0, open = 0, validatedCount = 0;
  const rows = [];
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, "0")}`;
    if (startYm && ym < startYm) continue;
    const ps = computePayslip(employee, pay, ym);
    const v = getValidation(ym);
    const future = ym > currentYm;
    totSim += ps.total;
    if (v) { totVal += Number(v.amount); validatedCount += 1; }
    else if (!future) open += ps.total;

    const status = v
      ? (v.sent_at
          ? `<span class="badge Approved">Validato</span> <span class="badge neutral" title="${escapeHtml(v.sent_to || "")}">Inviata ${formatDate(v.sent_at)}</span>`
          : `<span class="badge Approved">Validato</span>`)
      : future ? `<span class="badge disabled">Futuro</span>` : `<span class="badge Pending">Da validare</span>`;
    rows.push(`
      <tr data-month="${ym}" class="inv-row ${ym === state.payMonth ? "is-selected" : ""}">
        <td>${monthName(ym)}</td>
        <td class="num">${fmtEur(ps.total)}</td>
        <td class="num">${v ? fmtEur(v.amount) : "-"}</td>
        <td>${status}</td>
      </tr>`);
  }

  refs.invYearLabel.textContent = year;
  refs.invBody.innerHTML = rows.join("") ||
    `<tr><td colspan="4" class="empty-state">Contratto non ancora iniziato in questo anno.</td></tr>`;
  refs.invTotSim.textContent = fmtEur(totSim);
  refs.invTotVal.textContent = fmtEur(totVal);
  refs.invYearValidated.textContent = fmtEur(totVal);
  refs.invYearCount.textContent = `${validatedCount} ${validatedCount === 1 ? "mese validato" : "mesi validati"}`;
  refs.invYearOpen.textContent = fmtEur(open);

  const allTime = state.validations.reduce((s, v) => s + Number(v.amount), 0);
  refs.invAllTime.textContent = fmtEur(allTime);
  const first = state.validations[0]?.month;
  refs.invAllTimeCount.textContent = state.validations.length
    ? `${state.validations.length} ${state.validations.length === 1 ? "mese validato" : "mesi validati"} dal ${monthName(first.slice(0, 7)).toLowerCase()}`
    : "Nessun mese validato";
}

async function validateMonth() {
  const ctx = state.lastPayslip;
  if (!ctx || getValidation(state.payMonth)) return;
  const { employee, ps } = ctx;
  const label = monthName(state.payMonth);
  if (!confirm(`Validare ${label} di ${employee.fullName} per ${fmtEur(ps.total)}?\n\nL'importo viene registrato nel fatturato e il mese non sarà più modificabile (puoi annullare la validazione).`)) return;

  const { error } = await supabaseClient.from("payslip_validations").insert({
    employee_id: employee.id,
    month: ps.start,
    amount: ps.total,
    daily_rate: Math.round(ps.rate * 100) / 100,
    worked_days: ps.worked,
    paid_leave: ps.paidFerie,
    bonus_amount: Math.round(ps.bonus * 100) / 100,
    details: {
      pay_type: ps.payType,
      invoice_number: ps.invoiceNo || invoiceNumber(state.payMonth),
      description: ps.description || "",
      days_edited: ps.daysEdited,
      total_edited: ps.totalEdited,
      fixed_monthly: Math.round(ps.fixedMonthly * 100) / 100,
      working_days: ps.workingDays, ferie: ps.ferie, unpaid_ferie: ps.unpaidFerie,
      permessi: ps.permessi, malattia: ps.malattia,
      base: Math.round(ps.base * 100) / 100, ferie_amount: Math.round(ps.ferieAmount * 100) / 100,
      items: ps.items.map((i) => ({ kind: i.kind, description: i.description, days: i.days, amount: i.amount }))
    },
    validated_by: state.profile.id
  });
  if (error) return setStatus(refs.payStatus, payTableError(error), "error");
  setStatus(refs.payStatus, `${label} validato: ${fmtEur(ps.total)}.`, "success");
  await loadPayItems();
}

async function unvalidateMonth() {
  const v = getValidation(state.payMonth);
  if (!v) return;
  const sentNote = v.sent_at ? `\n\nATTENZIONE: la fattura è già stata inviata il ${formatDate(v.sent_at)} a ${v.sent_to}.` : "";
  if (!confirm(`Annullare la validazione di ${monthName(state.payMonth)} (${fmtEur(v.amount)})?\nL'importo verrà tolto dal fatturato.${sentNote}`)) return;
  const { error } = await supabaseClient.from("payslip_validations").delete().eq("id", v.id);
  if (error) return setStatus(refs.payStatus, payTableError(error), "error");
  setStatus(refs.payStatus, "Validazione annullata.", "success");
  await loadPayItems();
}

async function resetUsedLeave() {
  const employee = getEmployeeById(state.selectedEmployeeId);
  if (!employee) return;
  const year = Number(state.payMonth.slice(0, 4));
  const lb = computeLeaveBalance(employee, getPay(employee.id), year);
  if (!lb.used) return;
  if (!confirm(`Azzerare le ferie godute ${year} di ${employee.fullName} (${fmtDays(lb.used)} gg)?\n\nLe richieste restano nello storico e le fatture non cambiano: riparte solo il contatore, quindi le residue tornano a ${fmtDays(lb.total)} gg.`)) return;

  const { error } = await supabaseClient.from("leave_adjustments").upsert({
    employee_id: employee.id, year, used_offset: lb.usedRaw,
    updated_at: new Date().toISOString(), updated_by: state.profile.id
  });
  if (error) return setStatus(refs.empStatus, payTableError(error), "error");
  await refreshData();
}

async function undoLeaveReset() {
  const employee = getEmployeeById(state.selectedEmployeeId);
  if (!employee) return;
  const year = Number(state.payMonth.slice(0, 4));
  if (!confirm(`Annullare l'azzeramento ferie ${year} di ${employee.fullName}? Il contatore torna a considerare tutte le ferie approvate dell'anno.`)) return;
  const { error } = await supabaseClient.from("leave_adjustments").delete()
    .eq("employee_id", employee.id).eq("year", year);
  if (error) return setStatus(refs.empStatus, payTableError(error), "error");
  await refreshData();
}

async function resetPendingLeave() {
  const employee = getEmployeeById(state.selectedEmployeeId);
  if (!employee) return;
  const year = Number(state.payMonth.slice(0, 4));
  const ids = state.requests
    .filter((r) => r.employeeId === employee.id && r.type === "Ferie" && r.status === "Pending" &&
                   clippedWorkingDays(r, `${year}-01-01`, `${year}-12-31`) > 0)
    .map((r) => r.id);
  if (!ids.length) return;
  if (!confirm(`Rifiutare ${ids.length} ${ids.length === 1 ? "richiesta" : "richieste"} di ferie in attesa (${year}) di ${employee.fullName}?`)) return;
  const { error } = await supabaseClient.from("leave_requests").update({ status: "Rejected" }).in("id", ids);
  if (error) return setStatus(refs.empStatus, error.message, "error");
  await refreshData();
}

async function saveEmployeeSheet(event) {
  event.preventDefault();
  const employee = getEmployeeById(state.selectedEmployeeId);
  if (!employee) return;

  const ibanRaw = normalizeIban(refs.empIban.value);
  if (ibanRaw && !isValidIban(ibanRaw) &&
      !confirm("L'IBAN inserito non sembra valido (controllo di correttezza fallito). Salvare comunque?")) {
    refs.empIban.focus();
    return;
  }

  const row = {
    employee_id: employee.id,
    job_title: refs.empJobTitle.value.trim(),
    department: refs.empDepartment.value.trim(),
    contract_start: refs.empContractStart.value || null,
    pay_type: refs.empPayType.value === "fixed" ? "fixed" : "daily",
    ...(refs.empPayType.value === "fixed"
      ? {
          annual_salary: Math.round((Number(refs.empSalary.value) || 0) * 100) / 100,
          daily_rate: Math.round(((Number(refs.empSalary.value) || 0) / ANNUAL_PAID_DAYS) * 100) / 100
        }
      : {
          daily_rate: Math.round((Number(refs.empRate.value) || 0) * 100) / 100,
          annual_salary: annualFromRate(refs.empRate.value)
        }),
    notes: refs.empNotes.value.trim(),
    billing_name: refs.empBillingName.value.trim(),
    billing_email: refs.empBillingEmail.value.trim(),
    billing_address: refs.empBillingAddress.value.trim(),
    tax_id: refs.empTaxId.value.trim().toUpperCase(),
    bank_holder: refs.empBankHolder.value.trim(),
    bank_name: refs.empBankName.value.trim(),
    iban: normalizeIban(refs.empIban.value),
    bic_swift: refs.empBic.value.replace(/\s+/g, "").toUpperCase(),
    updated_at: new Date().toISOString()
  };
  const quota = Number(refs.empQuota.value);

  setStatus(refs.empStatus, "Salvataggio…");
  const { error } = await supabaseClient.from("employee_pay").upsert(row);
  if (error) return setStatus(refs.empStatus, payTableError(error), "error");

  if (Number.isFinite(quota) && quota !== employee.annualQuota) {
    const res = await supabaseClient.from("profiles").update({ annual_quota: quota }).eq("id", employee.id);
    if (res.error) return setStatus(refs.empStatus, res.error.message, "error");
  }

  setStatus(refs.empStatus, "Scheda salvata.", "success");
  refs.empForm.dataset.for = "";
  await refreshData();
}

async function addPayItem(event) {
  event.preventDefault();
  const employee = getEmployeeById(state.selectedEmployeeId);
  if (!employee) return;
  const pay = getPay(employee.id);
  const kind = refs.payItemKind.value;
  if (getValidation(state.payMonth)) return setStatus(refs.payStatus, "Mese validato: annulla la validazione per modificarlo.", "error");

  let days = null;
  let amount;
  if (kind === "Ferie pagate") {
    const rate = state.lastPayslip?.ps.rate || 0;
    days = Number(refs.payItemDays.value);
    if (!days) return setStatus(refs.payStatus, "Inserisci i giorni di ferie non godute da liquidare.", "error");
    if (!rate) return setStatus(refs.payStatus, "Imposta prima il daily rate.", "error");
    amount = Math.round(days * rate * 100) / 100;
  } else {
    amount = Number(refs.payItemAmount.value);
    if (!amount) return setStatus(refs.payStatus, "Inserisci l'importo del rimborso.", "error");
  }

  const { error } = await supabaseClient.from("payslip_items").insert({
    employee_id: employee.id,
    month: monthBounds(state.payMonth).start,
    kind,
    description: refs.payItemDesc.value.trim(),
    days,
    amount
  });
  if (error) return setStatus(refs.payStatus, payTableError(error), "error");

  refs.payItemForm.reset();
  syncPayItemForm();
  setStatus(refs.payStatus, "Voce aggiunta.", "success");
  await loadPayItems();
}

function printPayslip() {
  const ctx = state.lastPayslip;
  if (!ctx) return;
  const { employee, pay, ps } = ctx;
  const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" })
    .format(new Date(`${ps.start}T12:00:00`));

  const w = window.open("", "_blank");
  if (!w) return alert("Consenti i popup per stampare la busta paga.");
  w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8">
    <title>Payslip ${escapeHtml(employee.fullName)} - ${monthLabel}</title>
    <style>
      body{font-family:Inter,Arial,sans-serif;color:#0f1a2e;margin:40px;font-size:13px}
      h1{font-size:20px;margin:0 0 4px} .muted{color:#6b7a94}
      .sim.ok{background:#e5f7ec;color:#0fa958}
      .sim{display:inline-block;margin-top:6px;padding:2px 8px;border-radius:4px;background:#fff5e0;color:#d68200;font-weight:600;font-size:11px}
      dl{display:grid;grid-template-columns:160px 1fr;gap:4px 12px;margin:20px 0}
      dt{color:#6b7a94} dd{margin:0}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{padding:8px;border-bottom:1px solid #e4e9f1;text-align:left}
      th{background:#f0f3f8;font-size:11px;text-transform:uppercase;color:#6b7a94}
      .num{text-align:right} tfoot td{font-weight:700;border-top:2px solid #0f1a2e}
    </style></head><body>
    <h1>Marathonbet Italia — Fattura ${monthLabel}</h1>
    ${ctx.validation
      ? `<span class="sim ok">VALIDATO il ${formatDate(ctx.validation.validated_at)} — ${fmtEur(ctx.validation.amount)}</span>`
      : `<span class="sim">SIMULAZIONE — importi lordi, documento non ufficiale</span>`}
    <dl>
      <dt>Dipendente</dt><dd>${escapeHtml(employee.fullName)}</dd>
      <dt>Ruolo</dt><dd>${escapeHtml(pay.jobTitle || "-")}</dd>
      <dt>Dipartimento</dt><dd>${escapeHtml(pay.department || "-")}</dd>
      <dt>Inizio contratto</dt><dd>${pay.contractStart ? formatDate(pay.contractStart) : "-"}</dd>
      <dt>Salario annuo lordo</dt><dd>${pay.annualSalary ? fmtEur(pay.annualSalary) : "-"}</dd>
      ${ps.payType === "fixed"
        ? `<dt>Fattura mensile</dt><dd>${fmtEur(ps.fixedMonthly)} (salario annuo ÷ 12)</dd>`
        : `<dt>Daily rate</dt><dd>${fmtEur(ps.rate)}</dd>`}
      <dt>Giorni lavorativi mese</dt><dd>${ps.workingDays} (ferie ${fmtDays(ps.ferie)}, permessi ${fmtDays(ps.permessi)}, malattia ${fmtDays(ps.malattia)})</dd>
    </dl>
    ${refs.payBody.closest("table").outerHTML.replace(/<button[^>]*>.*?<\/button>/g, "")}
    <p class="muted">Generato il ${formatDate(new Date())}</p>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
  w.document.close();
}

// =====================================================================
// INVIO FATTURA (Outlook + PDF da allegare) - solo mesi validati
// =====================================================================

const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const AUTOTABLE_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const tag = document.createElement("script");
    tag.src = src;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error(`Impossibile caricare ${src}`));
    document.head.appendChild(tag);
  });
}

async function loadPdfLib() {
  if (!window.jspdf) await loadScript(JSPDF_URL);
  if (!window.jspdf?.jsPDF?.API?.autoTable) await loadScript(AUTOTABLE_URL);
  return window.jspdf.jsPDF;
}

// Righe della fattura prese dallo snapshot validato (non cambiano più)
function invoiceLines(v) {
  const d = v.details || {};
  const rate = Number(v.daily_rate) || 0;
  if (d.pay_type === "fixed") {
    const lines = [{ desc: "Compenso fisso mensile", days: null, rate: null, amount: Number(d.base) || 0 }];
    (d.items || []).forEach((i) => lines.push({
      desc: (i.kind === "Ferie pagate" ? "Ferie non godute (liquidazione)" : i.kind) +
            (i.description ? ` - ${i.description}` : ""),
      days: i.days != null ? Number(i.days) : null,
      rate: i.days ? Number(i.amount) / Number(i.days) : null,
      amount: Number(i.amount) || 0
    }));
    return lines;
  }
  const lines = [{
    desc: "Compenso giorni lavorati",
    days: Number(v.worked_days) || 0,
    rate: d.base != null && Number(v.worked_days) ? Number(d.base) / Number(v.worked_days) : rate,
    amount: d.base != null ? Number(d.base) : (Number(v.worked_days) || 0) * rate
  }];
  (d.items || []).forEach((i) => lines.push({
    desc: (i.kind === "Ferie pagate" ? "Ferie non godute (liquidazione)" : i.kind) +
          (i.description ? ` - ${i.description}` : ""),
    days: i.days != null ? Number(i.days) : null,
    rate: i.days ? Number(i.amount) / Number(i.days) : null,
    amount: Number(i.amount) || 0
  }));
  return lines;
}

function fmtEurPdf(v) {
  // jsPDF non gestisce lo spazio stretto di Intl: normalizza
  return fmtEur(v).replace(/ | /g, " ");
}

// Committente fisso di tutte le fatture
// Mittente delle email di invio fattura (account Outlook)
const INVOICE_SENDER = "gianluca.gullo@marathonbet.it";

const INVOICE_BILL_TO = {
  name: "Revando Limited",
  lines: ["Room 1403, West Tower, Shun Tak Centre", "168 Connaught Road Central", "Hong Kong"]
};

function fmtNumPdf(v) {
  // 1.491,22 (separatore migliaia sempre presente)
  const n = Math.round((Number(v) || 0) * 100) / 100;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
}

function fmtDateEn(value) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .format(value ? new Date(value) : new Date());
}

function monthNameEn(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}

function invoiceNumber(ym) {
  return `INV-${ym.replace("-", "")}`;
}

function defaultInvoiceDescription(ym, daily) {
  return daily ? `Services - ${monthNameEn(ym)} (days worked)` : `Services - ${monthNameEn(ym)}`;
}

function invoiceNumberOf(v, ym) {
  return (v.details && v.details.invoice_number) || invoiceNumber(ym);
}

// Righe in inglese per il template "Tax Invoice"
function invoiceLinesEn(v, ym) {
  const period = monthNameEn(ym);
  return invoiceLines(v).map((l, idx) => {
    let desc = l.desc;
    if (idx === 0) desc = (v.details && v.details.description) || defaultInvoiceDescription(ym, l.days != null);
    else desc = desc
      .replace(/^Ferie non godute \(liquidazione\)/, "Unused holidays (settlement)")
      .replace(/^Rimborso/, "Expense refund");
    const qty = l.days != null ? l.days : 1;
    const rate = l.days != null ? (l.rate ?? (qty ? l.amount / qty : l.amount)) : l.amount;
    return { desc, qty, rate, amount: l.amount };
  });
}

async function buildInvoicePdf({ employee, pay, v, ym }) {
  const JsPDF = await loadPdfLib();
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const L = 50, R = 545, W = R - L;
  const total = Number(v.amount) || 0;
  const today = fmtDateEn(new Date());

  // Emittente (dati del dipendente)
  let y = 62;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30)
    .text(pay.billingName || employee.fullName, L, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(60);
  [
    ...(pay.billingAddress ? pay.billingAddress.split(/\n|,\s*/) : []),
    pay.taxId,
    pay.billingEmail || employee.email
  ].filter(Boolean).forEach((line) => { y += 12; doc.text(line.trim(), L, y); });

  // Intestazione a destra
  doc.setFont("helvetica", "normal").setFontSize(30).setTextColor(20).text("TAX INVOICE", R, 80, { align: "right" });
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(40).text(`# ${invoiceNumberOf(v, ym)}`, R, 98, { align: "right" });
  doc.setFontSize(8).text("Balance Due", R, 128, { align: "right" });
  doc.setFontSize(12).text(`€${fmtNumPdf(total)}`, R, 144, { align: "right" });

  // Bill To (fisso: Revando)
  y = Math.max(y, 150) + 46;
  const billY = y;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(60).text("Bill To", L, y);
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(30).text(INVOICE_BILL_TO.name, L, y += 13);
  doc.setFont("helvetica", "normal").setTextColor(60);
  INVOICE_BILL_TO.lines.forEach((line) => doc.text(line, L, y += 13));

  // Date e termini
  [["Invoice Date :", today], ["Terms :", "Due on Receipt"], ["Due Date :", today]].forEach(([k, val], i) => {
    const yy = billY + 4 + i * 22;
    doc.setFontSize(10).setTextColor(70).text(k, 420, yy, { align: "right" });
    doc.setFontSize(9).setTextColor(40).text(val, R, yy, { align: "right" });
  });
  y = Math.max(y, billY + 50) + 24;

  // Tabella voci
  const lines = invoiceLinesEn(v, ym);
  doc.autoTable({
    startY: y,
    head: [["#", "Item & Description",
      { content: "Qty", styles: { halign: "right" } },
      { content: "Rate", styles: { halign: "right" } },
      { content: "Amount", styles: { halign: "right" } }]],
    body: lines.map((l, i) => [String(i + 1), l.desc, fmtNumPdf(l.qty), fmtNumPdf(l.rate), fmtNumPdf(l.amount)]),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: { top: 8, bottom: 8, left: 6, right: 6 }, textColor: 40 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "normal", fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 60, halign: "right" },
      3: { cellWidth: 75, halign: "right" },
      4: { cellWidth: 80, halign: "right" }
    },
    didDrawCell: (d) => {
      if (d.section === "body" && d.column.index === 0 && d.row.index === lines.length - 1) {
        doc.setDrawColor(170).setLineWidth(0.6)
          .line(L, d.cell.y + d.cell.height, R, d.cell.y + d.cell.height);
      }
    },
    margin: { left: L, right: 595 - R }
  });

  // Totali
  y = doc.lastAutoTable.finalY + 24;
  const labelX = 440, valX = R - 8;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(30).text("Sub Total", labelX, y, { align: "right" });
  doc.setFont("helvetica", "normal").text(fmtNumPdf(total), valX, y, { align: "right" });
  y += 12;
  doc.setDrawColor(170).line(L, y, R, y);
  y += 26;
  doc.setFont("helvetica", "bold").text("Total", labelX - 10, y, { align: "right" });
  doc.text(`€${fmtNumPdf(total)}`, valX, y, { align: "right" });
  y += 14;
  doc.setFillColor(245, 244, 242).rect(325, y, R - 325, 32, "F");
  doc.text("Balance Due", labelX - 10, y + 20, { align: "right" });
  doc.text(`€${fmtNumPdf(total)}`, valX, y + 20, { align: "right" });
  y += 90;

  // Note e coordinate bancarie (del dipendente)
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(60).text("Notes", L, y);
  doc.setFontSize(7.5).text("Thanks for your business.", L, y += 16);
  y += 22;
  doc.setFontSize(9.5).setTextColor(50);
  [
    `Account name: ${pay.bankHolder || pay.billingName || employee.fullName}`,
    pay.bankName ? `Bank: ${pay.bankName}` : null,
    pay.iban ? `IBAN: ${formatIban(pay.iban)}` : null,
    pay.bic ? `BIC/SWIFT: ${pay.bic}` : null
  ].filter(Boolean).forEach((line) => {
    doc.splitTextToSize(line, W).forEach((t) => { doc.text(t, L, y); y += 13; });
  });

  doc.setDrawColor(170).line(L - 10, 800, R + 10, 800);
  doc.setFontSize(7).setTextColor(150).text("1", R + 10, 814, { align: "right" });
  return doc;
}

function invoiceMailBody({ employee, pay, v, monthLabel }) {
  const lines = invoiceLines(v).map((l) =>
    `- ${l.desc}: ${l.days != null ? `${fmtDays(l.days)} gg x ${fmtEur(l.rate)} = ` : ""}${fmtEur(l.amount)}`);
  const firstName = (pay.billingName || employee.fullName).split(" ")[0];
  return [
    `Gentile ${firstName},`,
    "",
    `in allegato il prospetto della fattura di ${monthLabel.toLowerCase()}, per un importo totale di ${fmtEur(v.amount)}.`,
    "",
    "Dettaglio:",
    ...lines,
    `Totale: ${fmtEur(v.amount)}`,
    "",
    `Intestata a: ${INVOICE_BILL_TO.name}, ${INVOICE_BILL_TO.lines.join(", ")}`,
    "",
    "Dati di fatturazione:",
    pay.billingName || employee.fullName,
    ...(pay.billingAddress ? pay.billingAddress.split(/\n/) : []),
    `P.IVA / C.F.: ${pay.taxId || "-"}`,
    ...(pay.iban ? [
      "",
      "Coordinate bancarie per il pagamento:",
      `Intestatario: ${pay.bankHolder || pay.billingName || employee.fullName}`,
      ...(pay.bankName ? [`Banca: ${pay.bankName}`] : []),
      `IBAN: ${formatIban(pay.iban)}`,
      ...(pay.bic ? [`BIC / SWIFT: ${pay.bic}`] : [])
    ] : []),
    "",
    "Ti chiediamo di emettere la fattura per l'importo indicato.",
    "",
    "Cordiali saluti",
    state.profile?.fullName || ""
  ].join("\r\n");
}

// Scarica il PDF della fattura del mese selezionato (importo validato se presente, altrimenti simulazione)
async function generateInvoice() {
  const ctx = state.lastPayslip;
  if (!ctx) return;
  const { employee, pay, ps } = ctx;
  const v = getValidation(state.payMonth) || {
    amount: ps.total,
    daily_rate: Math.round(ps.rate * 100) / 100,
    worked_days: ps.worked,
    details: {
      pay_type: ps.payType,
      invoice_number: ps.invoiceNo || invoiceNumber(state.payMonth),
      description: ps.description || "",
      base: Math.round(ps.base * 100) / 100,
      items: ps.items.map((i) => ({ kind: i.kind, description: i.description, days: i.days, amount: i.amount }))
    }
  };
  if (!(Number(v.amount) > 0)) return setStatus(refs.payStatus, "Importo del mese pari a zero: niente da fatturare.", "error");

  setStatus(refs.payStatus, "Genero la fattura…");
  try {
    const doc = await buildInvoicePdf({ employee, pay, v, ym: state.payMonth });
    const surname = (pay.billingName || employee.fullName).trim().split(/\s+/).pop().replace(/[^\w-]/g, "");
    const fileName = `${invoiceNumberOf(v, state.payMonth).replace(/[^\w.-]+/g, "_")}_${surname}.pdf`;
    doc.save(fileName);
    setStatus(refs.payStatus, `Fattura ${fileName} scaricata (${fmtEur(v.amount)}).`, "success");
  } catch (err) {
    setStatus(refs.payStatus, `Fattura non generata: ${err.message}`, "error");
  }
}

// Email .eml con il PDF già allegato: aperta in Outlook diventa un nuovo messaggio pronto da inviare
function b64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function wrap76(b64) {
  return b64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function buildEml({ to, subject, body, fileName, pdfArrayBuffer }) {
  const bytes = new Uint8Array(pdfArrayBuffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const boundary = `----=_MBI_${Date.now().toString(36)}`;
  return [
    `From: ${INVOICE_SENDER}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${b64Utf8(subject)}?=`,
    "X-Unsent: 1",
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(b64Utf8(body)),
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="${fileName}"`,
    `Content-Disposition: attachment; filename="${fileName}"`,
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(btoa(bin)),
    "",
    `--${boundary}--`,
    ""
  ].join("\r\n");
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function sendInvoice() {
  const ctx = state.lastPayslip;
  const v = ctx && getValidation(state.payMonth);
  if (!v) return setStatus(refs.payStatus, "Valida prima l'importo del mese.", "error");
  const { employee, pay } = ctx;
  const to = pay.billingEmail || employee.email;
  const monthLabel = monthName(state.payMonth);

  const missing = [
    !pay.billingName && "nome intestatario",
    !pay.billingAddress && "indirizzo",
    !pay.taxId && "P.IVA / codice fiscale",
    !pay.iban && "IBAN"
  ].filter(Boolean);
  const warn = missing.length ? `\n\nMancano nella scheda: ${missing.join(", ")}.` : "";
  if (!confirm(`Preparare la fattura di ${monthLabel} (${fmtEur(v.amount)}) per ${to}?\n\n` +
               `Scarico l'email con il PDF già allegato: aprila (doppio clic) e Outlook la apre pronta, premi Invia.${warn}`)) return;

  setStatus(refs.payStatus, "Preparo il PDF…");
  const subject = `Fattura ${monthLabel} - ${pay.billingName || employee.fullName}`;
  let fileName, emlName;
  try {
    const doc = await buildInvoicePdf({ employee, pay, v, ym: state.payMonth });
    const surname = (pay.billingName || employee.fullName).trim().split(/\s+/).pop().replace(/[^\w-]/g, "");
    fileName = `${invoiceNumberOf(v, state.payMonth).replace(/[^\w.-]+/g, "_")}_${surname}.pdf`;
    emlName = fileName.replace(/\.pdf$/, ".eml");
    const eml = buildEml({
      to, subject, fileName,
      body: invoiceMailBody({ employee, pay, v, monthLabel }),
      pdfArrayBuffer: doc.output("arraybuffer")
    });
    downloadBlob(new Blob([eml], { type: "message/rfc822" }), emlName);
  } catch (err) {
    return setStatus(refs.payStatus, `Email non generata: ${err.message}`, "error");
  }

  const { error } = await supabaseClient.from("payslip_validations")
    .update({ sent_at: new Date().toISOString(), sent_to: to })
    .eq("id", v.id);
  if (error) return setStatus(refs.payStatus, payTableError(error), "error");
  setStatus(refs.payStatus, `Email "${emlName}" scaricata (PDF ${fileName} già allegato, destinatario ${to}). Aprila con Outlook e premi Invia.`, "success");
  await loadPayItems();
}

function setStatus(node, text, kind = "") {
  if (!node) return;
  node.textContent = text || "";
  node.classList.remove("error", "success");
  if (kind) node.classList.add(kind);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit", month: "short", year: "numeric"
  }).format(new Date(value));
}

function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
