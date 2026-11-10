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
  payItems: []
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
  empEmpty: el("empEmpty"),
  empSheet: el("empSheet"),
  empName: el("empName"),
  empMeta: el("empMeta"),
  kpiRate: el("kpiRate"),
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

  // Main nav + inline link-buttons with data-view-target
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.viewTarget;
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
    const payResult = await fetchEmployeePay();
    if (payResult.error) {
      console.error(payResult.error);
    } else {
      state.payData = Object.fromEntries(payResult.data.map((r) => [r.employee_id, r]));
    }
  }

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

function populateEmployeeOptions() {
  if (!state.profile) return;

  const visible = state.profile.role === "admin"
    ? state.employees
    : state.employees.filter((e) => e.id === state.profile.id);

  const options = visible
    .map((e) => `<option value="${e.id}">${escapeHtml(e.fullName)}</option>`)
    .join("");

  refs.employeeSelect.innerHTML = options;
  if (refs.filterEmployee) {
    refs.filterEmployee.innerHTML = `<option value="all">Tutti</option>${options}`;
  }

  if (state.profile.role !== "admin") {
    refs.employeeSelect.value = state.profile.id;
    refs.employeeSelect.disabled = true;
  } else {
    refs.employeeSelect.disabled = false;
  }
}

function syncRoleUI() {
  const role = state.profile?.role;
  const allowed = role === "admin"
    ? ["dashboard", "approvals", "history", "team", "employees", "users"]
    : ["request", "history"];

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
  renderUsers();
  renderEmployeeSheet();
  renderQuotaChip();
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

  const employeeId = refs.employeeSelect.value || state.profile.id;
  const startDate  = refs.startDate.value;
  const endDate    = refs.endDate.value;
  const workingDays = countWorkingDays(startDate, endDate);

  if (!employeeId || !startDate || !endDate || workingDays <= 0) {
    setStatus(refs.requestStatus,
      "Inserisci un intervallo valido con almeno un giorno lavorativo.", "error");
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

function countWorkingDays(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const cursor = new Date(`${startDate}T12:00:00`);
  const end    = new Date(`${endDate}T12:00:00`);
  let count = 0;
  while (cursor <= end) {
    const d = cursor.getDay();
    if (d !== 0 && d !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function renderQuotaChip() {
  if (!refs.quotaChip || !state.profile) return;
  const approvedDays = state.requests
    .filter((r) => r.employeeId === state.profile.id && r.status === "Approved")
    .filter((r) => r.startDate.startsWith(String(new Date().getFullYear())))
    .reduce((s, r) => s + r.workingDays, 0);
  const remaining = Math.max(0, state.profile.annualQuota - approvedDays);
  refs.quotaChip.textContent = `Quota residua: ${remaining}/${state.profile.annualQuota} gg`;
}

// =====================================================================
// HISTORY
// =====================================================================

function renderHistory() {
  const statusFilter   = refs.filterStatus.value;
  const employeeFilter = refs.filterEmployee?.value || "all";
  const startFilter    = refs.historyStart.value;
  const endFilter      = refs.historyEnd.value;

  const isEmployee = state.profile?.role !== "admin";

  state.historyRows = state.requests
    .filter((r) => isEmployee ? r.employeeId === state.profile.id : true)
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
// TEAM
// =====================================================================

function renderTeam() {
  const approvedInPeriod = getRequestsInPeriod().filter((r) => r.status === "Approved");

  const rows = state.employees.map((employee) => {
    const used = approvedInPeriod
      .filter((r) => r.employeeId === employee.id)
      .reduce((s, r) => s + r.workingDays, 0);
    const quota = employee.annualQuota || DEFAULT_QUOTA;
    const ratio = Math.min(100, Math.round((used / quota) * 100) || 0);
    const remaining = Math.max(quota - used, 0);
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

// Giorni lavorativi (lun-ven) dell'anno: base di calcolo del daily rate.
// Principio: daily rate × tutti i giorni lavorativi dell'anno (ferie fino
// alla quota comprese, perché retribuite) = salario annuo lordo.
function workingDaysInYear(year) {
  return countWorkingDays(`${year}-01-01`, `${year}-12-31`);
}

function effectiveRate(pay, year) {
  if (pay.annualSalary > 0) return pay.annualSalary / workingDaysInYear(year);
  return pay.dailyRate; // nessun salario: daily rate inserito a mano
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

  refs.empSelect.addEventListener("change", async () => {
    state.selectedEmployeeId = refs.empSelect.value;
    setStatus(refs.empStatus, "");
    setStatus(refs.payStatus, "");
    renderEmployeeSheet();
    await loadPayItems();
  });

  refs.payMonth.addEventListener("change", async () => {
    if (!refs.payMonth.value) return;
    state.payMonth = refs.payMonth.value;
    renderEmployeeSheet();
    await loadPayItems();
  });

  refs.empForm.addEventListener("submit", saveEmployeeSheet);

  refs.empSalary.addEventListener("input", syncRateField);

  refs.payItemKind.addEventListener("change", syncPayItemForm);
  refs.payItemForm.addEventListener("submit", addPayItem);
  refs.payPrint.addEventListener("click", printPayslip);

  refs.payBody.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-delete-item]");
    if (!btn) return;
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
    .select("employee_id, job_title, department, contract_start, annual_salary, daily_rate, notes");
}

function payTableError(error) {
  if (/relation .* does not exist|schema cache|employee_pay|payslip_items/i.test(error.message || "")) {
    return "Tabelle mancanti: esegui supabase_payroll.sql nel SQL Editor di Supabase.";
  }
  return error.message;
}

function getPay(employeeId) {
  const r = state.payData[employeeId] || {};
  return {
    jobTitle: r.job_title || "",
    department: r.department || "",
    contractStart: r.contract_start || "",
    annualSalary: Number(r.annual_salary) || 0,
    dailyRate: Number(r.daily_rate) || 0,
    notes: r.notes || ""
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

  const used = sumDays(employee.id, from, to, { type: "Ferie", status: "Approved" });
  const pending = sumDays(employee.id, from, to, { type: "Ferie", status: "Pending" });
  const permessi = sumDays(employee.id, from, to, { type: "Permesso", status: "Approved" });
  const malattia = sumDays(employee.id, from, to, { type: "Malattia", status: "Approved" });

  return { quota, months, total, used, pending, permessi, malattia, remaining: total - used };
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
  const worked = Math.max(workingDays - ferie - permessi - malattia, 0);

  // Ferie retribuite fino a esaurimento della quota annua spettante
  const entitlement = computeLeaveBalance(employee, pay, year).total;
  const ferieBefore = sumDays(employee.id, `${year}-01-01`, prevDay(start), { type: "Ferie", status: "Approved" });
  const ferieLeft = Math.max(entitlement - ferieBefore, 0);
  const paidFerie = Math.min(ferie, ferieLeft);
  const unpaidFerie = ferie - paidFerie;

  const base = worked * rate;
  const ferieAmount = paidFerie * rate;
  const bonus = state.payItems.reduce((s, i) => s + Number(i.amount || 0), 0);

  return {
    year, rate, start, end, effStart, workingDays, ferie, paidFerie, unpaidFerie,
    permessi, malattia, worked, base, ferieAmount, bonus,
    total: base + ferieAmount + bonus
  };
}

function syncRateField() {
  const salary = Number(refs.empSalary.value);
  const year = Number(state.payMonth.slice(0, 4)) || new Date().getFullYear();
  if (salary > 0) {
    const days = workingDaysInYear(year);
    refs.empRate.value = (salary / days).toFixed(2);
    refs.empRate.readOnly = true;
    refs.empRateHint.textContent = `Calcolato: salario ÷ ${days} giorni lavorativi ${year} (ferie incluse)`;
  } else {
    refs.empRate.readOnly = false;
    refs.empRateHint.textContent = "Inserisci il salario annuo per calcolarlo in automatico";
  }
}

function renderEmployeeSheet() {
  if (!refs.empSelect || state.profile?.role !== "admin") return;

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
    refs.empSalary.value = pay.annualSalary || "";
    refs.empRate.value = pay.dailyRate || "";
    syncRateField();
    refs.empQuota.value = employee.annualQuota ?? DEFAULT_QUOTA;
    refs.empNotes.value = pay.notes;
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
  refs.leaveOther.textContent = `Altre assenze approvate nell'anno: Permessi ${fmtDays(lb.permessi)} gg · Malattia ${fmtDays(lb.malattia)} gg`;

  const rate = effectiveRate(pay, year);
  refs.kpiRate.textContent = rate ? fmtEur(rate) : "-";
  refs.kpiSalary.textContent = pay.annualSalary ? fmtEur(pay.annualSalary) : "-";
  refs.kpiLeave.textContent = `${fmtDays(lb.remaining)} gg`;

  renderPayslip(employee, pay);
}

function renderPayslip(employee, pay) {
  const ps = computePayslip(employee, pay, state.payMonth);

  const rows = [`
    <tr>
      <td>Retribuzione giorni lavorati</td>
      <td class="num">${fmtDays(ps.worked)}</td>
      <td class="num">${fmtEur(ps.rate)}</td>
      <td class="num">${fmtEur(ps.base)}</td>
      <td></td>
    </tr>`];

  if (ps.ferie) {
    rows.push(`
      <tr>
        <td>Ferie godute (retribuite)</td>
        <td class="num">${fmtDays(ps.paidFerie)}</td>
        <td class="num">${fmtEur(ps.rate)}</td>
        <td class="num">${fmtEur(ps.ferieAmount)}</td>
        <td></td>
      </tr>`);
  }
  if (ps.unpaidFerie) {
    rows.push(`
      <tr class="pay-unpaid">
        <td>Ferie oltre la quota annua (non retribuite)</td>
        <td class="num">${fmtDays(ps.unpaidFerie)}</td>
        <td class="num">${fmtEur(0)}</td>
        <td class="num">${fmtEur(0)}</td>
        <td></td>
      </tr>`);
  }

  state.payItems.forEach((i) => {
    rows.push(`
      <tr>
        <td><span class="badge ${i.kind === "Rimborso" ? "neutral" : "Approved"}">${i.kind === "Ferie pagate" ? "Ferie liquidate" : escapeHtml(i.kind)}</span>
            ${i.description ? `<span class="muted"> ${escapeHtml(i.description)}</span>` : ""}</td>
        <td class="num">${i.days != null ? fmtDays(i.days) : ""}</td>
        <td class="num">${i.days != null && Number(i.days) ? fmtEur(i.amount / i.days) : ""}</td>
        <td class="num">${fmtEur(i.amount)}</td>
        <td class="num"><button type="button" class="action-button reject" data-delete-item="${i.id}" title="Elimina">✕</button></td>
      </tr>`);
  });

  refs.payBody.innerHTML = rows.join("");
  refs.payTotal.textContent = fmtEur(ps.total);

  const parts = [`Giorni lavorativi nel mese: ${ps.workingDays}`];
  if (ps.effStart !== ps.start) parts[0] += ` (dal ${formatDate(ps.effStart)}, inizio contratto)`;
  parts.push(`Ferie ${fmtDays(ps.ferie)}`, `Permessi ${fmtDays(ps.permessi)}`, `Malattia ${fmtDays(ps.malattia)}`);
  parts.push(`→ Giorni lavorati ${fmtDays(ps.worked)}`);
  const rateNote = pay.annualSalary > 0
    ? ` Daily rate = ${fmtEur(pay.annualSalary)} ÷ ${workingDaysInYear(ps.year)} giorni lavorativi ${ps.year}.`
    : (ps.rate ? "" : " — Imposta il salario annuo nei dati contrattuali.");
  refs.payDaysDetail.textContent = parts.join(" · ") + "." + rateNote;
  state.lastPayslip = { employee, pay, ps };
}

function syncPayItemForm() {
  const isFerie = refs.payItemKind.value === "Ferie pagate";
  refs.payItemDaysWrap.classList.toggle("hidden", !isFerie);
  refs.payItemAmountWrap.classList.toggle("hidden", isFerie);
}

async function loadPayItems() {
  if (!supabaseClient || state.profile?.role !== "admin" || !state.selectedEmployeeId) return;
  const { start } = monthBounds(state.payMonth);
  const { data, error } = await supabaseClient
    .from("payslip_items")
    .select("id, kind, description, days, amount, created_at")
    .eq("employee_id", state.selectedEmployeeId)
    .eq("month", start)
    .order("created_at", { ascending: true });

  if (error) {
    state.payItems = [];
    setStatus(refs.payStatus, payTableError(error), "error");
  } else {
    state.payItems = data;
  }
  renderEmployeeSheet();
}

async function saveEmployeeSheet(event) {
  event.preventDefault();
  const employee = getEmployeeById(state.selectedEmployeeId);
  if (!employee) return;

  const row = {
    employee_id: employee.id,
    job_title: refs.empJobTitle.value.trim(),
    department: refs.empDepartment.value.trim(),
    contract_start: refs.empContractStart.value || null,
    annual_salary: Number(refs.empSalary.value) || 0,
    daily_rate: Math.round((Number(refs.empSalary.value) > 0
      ? Number(refs.empSalary.value) / workingDaysInYear(new Date().getFullYear())
      : Number(refs.empRate.value) || 0) * 100) / 100,
    notes: refs.empNotes.value.trim(),
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

  let days = null;
  let amount;
  if (kind === "Ferie pagate") {
    const rate = state.lastPayslip?.ps.rate || 0;
    days = Number(refs.payItemDays.value);
    if (!days) return setStatus(refs.payStatus, "Inserisci i giorni di ferie non godute da liquidare.", "error");
    if (!rate) return setStatus(refs.payStatus, "Imposta prima il salario annuo.", "error");
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
      .sim{display:inline-block;margin-top:6px;padding:2px 8px;border-radius:4px;background:#fff5e0;color:#d68200;font-weight:600;font-size:11px}
      dl{display:grid;grid-template-columns:160px 1fr;gap:4px 12px;margin:20px 0}
      dt{color:#6b7a94} dd{margin:0}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{padding:8px;border-bottom:1px solid #e4e9f1;text-align:left}
      th{background:#f0f3f8;font-size:11px;text-transform:uppercase;color:#6b7a94}
      .num{text-align:right} tfoot td{font-weight:700;border-top:2px solid #0f1a2e}
    </style></head><body>
    <h1>Marathonbet Italia — Busta paga ${monthLabel}</h1>
    <span class="sim">SIMULAZIONE — importi lordi, documento non ufficiale</span>
    <dl>
      <dt>Dipendente</dt><dd>${escapeHtml(employee.fullName)}</dd>
      <dt>Ruolo</dt><dd>${escapeHtml(pay.jobTitle || "-")}</dd>
      <dt>Dipartimento</dt><dd>${escapeHtml(pay.department || "-")}</dd>
      <dt>Inizio contratto</dt><dd>${pay.contractStart ? formatDate(pay.contractStart) : "-"}</dd>
      <dt>Salario annuo lordo</dt><dd>${pay.annualSalary ? fmtEur(pay.annualSalary) : "-"}</dd>
      <dt>Daily rate</dt><dd>${fmtEur(ps.rate)}</dd>
      <dt>Giorni lavorativi mese</dt><dd>${ps.workingDays} (ferie ${fmtDays(ps.ferie)}, permessi ${fmtDays(ps.permessi)}, malattia ${fmtDays(ps.malattia)})</dd>
    </dl>
    ${refs.payBody.closest("table").outerHTML.replace(/<button[^>]*>.*?<\/button>/g, "")}
    <p class="muted">Generato il ${formatDate(new Date())}</p>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
  w.document.close();
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
