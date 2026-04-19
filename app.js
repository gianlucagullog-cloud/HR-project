const SUPABASE_CONFIG = {
  url: "https://dnyoefjtbkjqtyvitiif.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueW9lZmp0YmtqcXR5dml0aWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1ODM4NjUsImV4cCI6MjA5MjE1OTg2NX0.rWX1-cD8BRv5wt6_BdB--GQ1d1OkVHw87STLnXRTL0I"
};

const state = {
  activeView: "history",
  periodPreset: "currentYear",
  periodStart: "",
  periodEnd: "",
  session: null,
  profile: null,
  employees: [],
  requests: [],
  historyRows: []
};

const refs = {
  body: document.body,
  authScreen: document.getElementById("authScreen"),
  appContent: document.getElementById("appContent"),
  authForm: document.getElementById("authForm"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authStatus: document.getElementById("authStatus"),
  configBanner: document.getElementById("configBanner"),
  logoutButton: document.getElementById("logoutButton"),
  sessionMessage: document.getElementById("sessionMessage"),
  userChip: document.getElementById("userChip"),
  roleChip: document.getElementById("roleChip"),
  welcomePill: document.getElementById("welcomePill"),
  sideSessionRole: document.getElementById("sideSessionRole"),
  summaryIdentity: document.getElementById("summaryIdentity"),
  navButtons: [...document.querySelectorAll(".nav-item")],
  shortcutViewButtons: [...document.querySelectorAll("[data-view-target].assist-button")],
  panels: [...document.querySelectorAll(".view-panel")],
  employeeSelect: document.getElementById("employeeSelect"),
  leaveType: document.getElementById("leaveType"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  requestNotes: document.getElementById("requestNotes"),
  requestForm: document.getElementById("requestForm"),
  requestStatus: document.getElementById("requestStatus"),
  workingDaysInfo: document.getElementById("workingDaysInfo"),
  metricsGrid: document.getElementById("metricsGrid"),
  pendingList: document.getElementById("pendingList"),
  approvalQueue: document.getElementById("approvalQueue"),
  approvalQueueMirror: document.getElementById("approvalQueueMirror"),
  historyTableBody: document.getElementById("historyTableBody"),
  teamTable: document.getElementById("teamTable"),
  teamSummary: document.getElementById("teamSummary"),
  filterStatus: document.getElementById("filterStatus"),
  filterEmployee: document.getElementById("filterEmployee"),
  historyStart: document.getElementById("historyStart"),
  historyEnd: document.getElementById("historyEnd"),
  exportCsvButton: document.getElementById("exportCsvButton"),
  periodPreset: document.getElementById("periodPreset"),
  periodStart: document.getElementById("periodStart"),
  periodEnd: document.getElementById("periodEnd"),
  metricTemplate: document.getElementById("metricCardTemplate")
};

const supabaseClient = createSupabaseClient();

initialize();

async function initialize() {
  hydratePeriodInputs();
  bindEvents();

  if (!supabaseClient) {
    refs.authStatus.textContent =
      "Configurazione mancante: inserisci SUPABASE_URL e SUPABASE_ANON_KEY in app.js.";
    return;
  }

  refs.configBanner.classList.add("hidden");

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    refs.authStatus.textContent = `Errore sessione: ${error.message}`;
    return;
  }

  await handleSession(data.session);

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    await handleSession(session);
  });
}

function createSupabaseClient() {
  const isConfigured =
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.url.includes("YOUR_SUPABASE_URL") &&
    !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

  if (!isConfigured || !window.supabase?.createClient) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

function bindEvents() {
  refs.authForm.addEventListener("submit", handleLogin);
  refs.logoutButton.addEventListener("click", handleLogout);

  refs.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.viewTarget;
      syncViewUI();
    });
  });

  refs.shortcutViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.viewTarget;
      syncViewUI();
    });
  });

  refs.requestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitRequest();
  });

  [refs.startDate, refs.endDate].forEach((input) => {
    input.addEventListener("input", updateWorkingDaysPreview);
  });

  [refs.filterStatus, refs.filterEmployee, refs.historyStart, refs.historyEnd].forEach((input) => {
    input.addEventListener("input", renderHistory);
  });

  refs.exportCsvButton.addEventListener("click", exportCsv);
  refs.periodPreset.addEventListener("change", handlePresetChange);
  refs.periodStart.addEventListener("input", handleCustomPeriodChange);
  refs.periodEnd.addEventListener("input", handleCustomPeriodChange);
}

async function handleLogin(event) {
  event.preventDefault();

  if (!supabaseClient) return;

  refs.authStatus.textContent = "Accesso in corso...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: refs.authEmail.value.trim(),
    password: refs.authPassword.value
  });

  refs.authStatus.textContent = error ? `Accesso non riuscito: ${error.message}` : "";
}

async function handleLogout() {
  if (!supabaseClient) return;

  await supabaseClient.auth.signOut();
  refs.authPassword.value = "";
  refs.authStatus.textContent = "Logout eseguito.";
}

async function handleSession(session) {
  state.session = session;

  if (!session) {
    state.profile = null;
    state.employees = [];
    state.requests = [];
    refs.authScreen.classList.remove("hidden");
    refs.appContent.classList.add("hidden");
    refs.logoutButton.classList.add("hidden");
    refs.userChip.textContent = "Non connesso";
    refs.sessionMessage.textContent = "Collega Supabase e accedi con email e password.";
    refs.sideSessionRole.textContent = "Ruolo: non connesso";
    refs.summaryIdentity.innerHTML = "<span>Utente: -</span><span>Ruolo: -</span>";
    refs.body.classList.remove("role-admin", "role-employee");
    return;
  }

  const profile = await loadProfile(session.user.id);

  if (!profile) {
    refs.authScreen.classList.remove("hidden");
    refs.appContent.classList.add("hidden");
    refs.authStatus.textContent =
      "Utente autenticato, ma profilo mancante in tabella profiles. Aggiungi il record in Supabase.";
    return;
  }

  state.profile = normalizeProfile(profile);
  state.activeView = state.profile.role === "admin" ? "dashboard" : "request";

  refs.authScreen.classList.add("hidden");
  refs.appContent.classList.remove("hidden");
  refs.logoutButton.classList.remove("hidden");
  refs.authStatus.textContent = "";
  refs.userChip.textContent = state.profile.fullName;
  refs.sessionMessage.textContent = state.profile.email;
  refs.roleChip.textContent = state.profile.role === "admin" ? "Admin" : "Dipendente";
  refs.welcomePill.textContent = state.profile.role === "admin" ? "HR Admin" : "Employee Portal";
  refs.sideSessionRole.textContent = `Ruolo: ${state.profile.role}`;
  refs.summaryIdentity.innerHTML = `
    <span>Utente: ${state.profile.fullName}</span>
    <span>Ruolo: ${state.profile.role}</span>
  `;

  syncRoleUI();
  syncViewUI();
  await refreshData();
}

async function loadProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, full_name, email, role, annual_quota")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    refs.authStatus.textContent = `Errore caricamento profilo: ${error.message}`;
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
    annualQuota: profile.annual_quota
  };
}

async function refreshData() {
  if (!state.profile) return;

  refs.requestStatus.textContent = "";

  const [profilesResult, requestsResult] = await Promise.all([fetchProfiles(), fetchRequests()]);

  if (profilesResult.error) {
    refs.requestStatus.textContent = `Errore profili: ${profilesResult.error.message}`;
  } else {
    state.employees = profilesResult.data.map(normalizeProfile);
  }

  if (requestsResult.error) {
    refs.requestStatus.textContent = `Errore richieste: ${requestsResult.error.message}`;
  } else {
    state.requests = requestsResult.data.map(normalizeRequest);
  }

  populateEmployeeOptions();
  syncRoleUI();
  syncViewUI();
  render();
}

async function fetchProfiles() {
  return supabaseClient
    .from("profiles")
    .select("id, full_name, email, role, annual_quota")
    .order("full_name", { ascending: true });
}

async function fetchRequests() {
  return supabaseClient
    .from("leave_requests")
    .select("id, employee_id, type, start_date, end_date, working_days, status, notes, created_at")
    .order("created_at", { ascending: false });
}

function normalizeRequest(request) {
  return {
    id: request.id,
    employeeId: request.employee_id,
    type: request.type,
    startDate: request.start_date,
    endDate: request.end_date,
    workingDays: request.working_days,
    status: request.status,
    notes: request.notes || "",
    createdAt: request.created_at
  };
}

function hydratePeriodInputs() {
  const today = new Date();
  state.periodStart = `${today.getFullYear()}-01-01`;
  state.periodEnd = toISODate(today);

  refs.periodPreset.value = state.periodPreset;
  refs.periodStart.value = state.periodStart;
  refs.periodEnd.value = state.periodEnd;
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
  render();
}

function handleCustomPeriodChange() {
  state.periodPreset = "custom";
  state.periodStart = refs.periodStart.value;
  state.periodEnd = refs.periodEnd.value;
  refs.periodPreset.value = "custom";
  render();
}

function populateEmployeeOptions() {
  if (!state.profile) return;

  const visibleEmployees =
    state.profile.role === "admin"
      ? state.employees
      : state.employees.filter((employee) => employee.id === state.profile.id);

  const options = visibleEmployees
    .map((employee) => `<option value="${employee.id}">${employee.fullName}</option>`)
    .join("");

  refs.employeeSelect.innerHTML = options;
  refs.filterEmployee.innerHTML = `<option value="all">Tutti</option>${options}`;

  if (state.profile.role !== "admin") {
    refs.employeeSelect.value = state.profile.id;
    refs.employeeSelect.disabled = true;
  } else {
    refs.employeeSelect.disabled = false;
  }
}

function syncRoleUI() {
  const role = state.profile?.role;
  const allowedViews = role === "admin" ? ["dashboard", "approvals", "history", "team"] : ["request", "history"];

  if (role && !allowedViews.includes(state.activeView)) {
    state.activeView = role === "admin" ? "dashboard" : "request";
  }

  refs.body.classList.toggle("role-admin", role === "admin");
  refs.body.classList.toggle("role-employee", role === "employee");
}

function syncViewUI() {
  refs.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === state.activeView);
  });

  refs.panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.view === state.activeView);
  });
}

function render() {
  renderMetrics();
  renderPendingLists();
  renderHistory();
  renderTeam();
  updateWorkingDaysPreview();
}

function getEmployeeById(id) {
  return state.employees.find((employee) => employee.id === id);
}

function getActivePeriod() {
  return {
    start: refs.periodStart.value || state.periodStart,
    end: refs.periodEnd.value || state.periodEnd
  };
}

function requestOverlapsPeriod(request, period) {
  if (!period.start || !period.end) return true;
  return !(request.endDate < period.start || request.startDate > period.end);
}

function getRequestsInPeriod() {
  const period = getActivePeriod();
  return state.requests.filter((request) => requestOverlapsPeriod(request, period));
}

function renderMetrics() {
  const scoped = getRequestsInPeriod();
  const approved = scoped.filter((request) => request.status === "Approved");
  const pending = scoped.filter((request) => request.status === "Pending");
  const rejected = scoped.filter((request) => request.status === "Rejected");
  const totalDays = approved.reduce((sum, request) => sum + request.workingDays, 0);
  const employeesOnLeave = new Set(approved.map((request) => request.employeeId)).size;

  const metrics = [
    { label: "Richieste totali", value: scoped.length, detail: "Nel periodo selezionato" },
    { label: "Pendenti", value: pending.length, detail: "In attesa di decisione" },
    { label: "Giorni approvati", value: totalDays, detail: "Solo giorni lavorativi" },
    { label: "Dipendenti coinvolti", value: employeesOnLeave, detail: "Con ferie approvate" },
    { label: "Rifiutate", value: rejected.length, detail: "Richieste respinte" }
  ];

  refs.metricsGrid.innerHTML = "";
  metrics.forEach((metric) => {
    const card = refs.metricTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".metric-label").textContent = metric.label;
    card.querySelector(".metric-value").textContent = metric.value;
    card.querySelector(".metric-detail").textContent = metric.detail;
    refs.metricsGrid.appendChild(card);
  });
}

function renderPendingLists() {
  const pending = state.requests
    .filter((request) => request.status === "Pending")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  refs.pendingList.innerHTML = pending.length
    ? pending.map((request) => requestCardMarkup(request, false)).join("")
    : emptyStateMarkup("Nessuna richiesta pendente.");

  refs.approvalQueue.innerHTML = pending.length
    ? pending.map((request) => requestCardMarkup(request, true)).join("")
    : emptyStateMarkup("La coda approvazioni è vuota.");

  refs.approvalQueueMirror.innerHTML = pending.length
    ? pending.slice(0, 4).map((request) => requestCardMarkup(request, false)).join("")
    : emptyStateMarkup("Nessuna richiesta in coda.");

  refs.approvalQueue.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      await updateRequestStatus(button.dataset.id, button.dataset.action);
    });
  });
}

function requestCardMarkup(request, withActions) {
  const employee = getEmployeeById(request.employeeId);
  const employeeName = employee?.fullName || "Dipendente";
  const employeeSubline = employee?.email || "";

  return `
    <article class="request-item">
      <div class="request-item-head">
        <div>
          <h4>${employeeName}</h4>
          <p class="meta-line">${request.type} · ${formatDate(request.startDate)} - ${formatDate(request.endDate)}</p>
          <p class="meta-line">${request.workingDays} giorni lavorativi${employeeSubline ? ` · ${employeeSubline}` : ""}</p>
        </div>
        <span class="badge ${request.status}">${request.status}</span>
      </div>
      <p class="meta-line">${request.notes || "Nessuna nota"}</p>
      ${
        withActions
          ? `<div class="request-actions">
              <button class="action-button approve" data-id="${request.id}" data-action="Approved">Approva</button>
              <button class="action-button reject" data-id="${request.id}" data-action="Rejected">Rifiuta</button>
            </div>`
          : ""
      }
    </article>
  `;
}

function emptyStateMarkup(text) {
  return `<p class="empty-state">${text}</p>`;
}

async function updateRequestStatus(requestId, status) {
  const { error } = await supabaseClient
    .from("leave_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) {
    refs.requestStatus.textContent = `Errore aggiornamento richiesta: ${error.message}`;
    return;
  }

  await refreshData();
}

async function submitRequest() {
  if (!state.profile) return;

  const employeeId = refs.employeeSelect.value || state.profile.id;
  const startDate = refs.startDate.value;
  const endDate = refs.endDate.value;
  const workingDays = countWorkingDays(startDate, endDate);

  if (!employeeId || !startDate || !endDate || workingDays <= 0) {
    refs.requestStatus.textContent =
      "Inserisci un intervallo valido con almeno un giorno lavorativo.";
    return;
  }

  refs.requestStatus.textContent = "Invio richiesta...";

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
    refs.requestStatus.textContent = `Invio non riuscito: ${error.message}`;
    return;
  }

  refs.requestForm.reset();
  refs.employeeSelect.value = employeeId;
  refs.requestStatus.textContent = `Richiesta inviata. Giorni lavorativi conteggiati: ${workingDays}.`;
  updateWorkingDaysPreview();
  await refreshData();
}

function updateWorkingDaysPreview() {
  const startDate = refs.startDate.value;
  const endDate = refs.endDate.value;

  if (!startDate || !endDate) {
    refs.workingDaysInfo.textContent = "Seleziona un intervallo per calcolare i giorni lavorativi.";
    return;
  }

  const days = countWorkingDays(startDate, endDate);
  refs.workingDaysInfo.textContent =
    days > 0
      ? `${days} giorni lavorativi calcolati automaticamente per questo intervallo.`
      : "L'intervallo non contiene giorni lavorativi validi.";
}

function countWorkingDays(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0;

  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  let count = 0;

  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function renderHistory() {
  const statusFilter = refs.filterStatus.value;
  const employeeFilter = refs.filterEmployee.value;
  const startFilter = refs.historyStart.value;
  const endFilter = refs.historyEnd.value;

  state.historyRows = state.requests
    .filter((request) => (statusFilter === "all" ? true : request.status === statusFilter))
    .filter((request) => (employeeFilter === "all" ? true : request.employeeId === employeeFilter))
    .filter((request) => (!startFilter ? true : request.startDate >= startFilter))
    .filter((request) => (!endFilter ? true : request.endDate <= endFilter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  refs.historyTableBody.innerHTML = state.historyRows.length
    ? state.historyRows
        .map((request) => {
          const employee = getEmployeeById(request.employeeId);
          return `
            <tr>
              <td>${employee?.fullName || "-"}</td>
              <td>${request.type}</td>
              <td>${formatDate(request.startDate)} - ${formatDate(request.endDate)}</td>
              <td>${request.workingDays}</td>
              <td><span class="badge ${request.status}">${request.status}</span></td>
              <td>${formatDate(request.createdAt)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="6" class="empty-state">Nessun risultato per i filtri selezionati.</td></tr>`;
}

function renderTeam() {
  const approvedInPeriod = getRequestsInPeriod().filter((request) => request.status === "Approved");

  const rows = state.employees.map((employee) => {
    const used = approvedInPeriod
      .filter((request) => request.employeeId === employee.id)
      .reduce((sum, request) => sum + request.workingDays, 0);

    const ratio = Math.min(100, Math.round((used / employee.annualQuota) * 100) || 0);
    const remaining = Math.max(employee.annualQuota - used, 0);

    return { employee, used, remaining, ratio };
  });

  refs.teamSummary.innerHTML = rows
    .map(
      ({ employee, used, remaining, ratio }) => `
        <article class="team-row">
          <div class="team-row-head">
            <div>
              <h4>${employee.fullName}</h4>
              <p class="meta-line">${employee.email}</p>
            </div>
            <strong>${used}/${employee.annualQuota}</strong>
          </div>
          <div class="progress-track"><div class="progress-bar" style="width:${ratio}%"></div></div>
          <div class="team-stats">
            <span>Usati: ${used} gg</span>
            <span>Residui: ${remaining} gg</span>
            <span>${ratio}% quota</span>
          </div>
        </article>
      `
    )
    .join("");

  refs.teamTable.innerHTML = rows
    .map(
      ({ employee, used, remaining, ratio }) => `
        <article class="team-row">
          <div class="team-row-head">
            <div>
              <h4>${employee.fullName}</h4>
              <p class="meta-line">${employee.email}</p>
            </div>
            <span class="badge ${ratio > 85 ? "Rejected" : ratio > 60 ? "Pending" : "Approved"}">${ratio}%</span>
          </div>
          <div class="progress-track"><div class="progress-bar" style="width:${ratio}%"></div></div>
          <div class="team-stats">
            <span>Quota annuale: ${employee.annualQuota} gg</span>
            <span>Utilizzati: ${used} gg</span>
            <span>Residui: ${remaining} gg</span>
          </div>
        </article>
      `
    )
    .join("");
}

function exportCsv() {
  const rows = [
    ["Dipendente", "Email", "Tipo", "Data inizio", "Data fine", "Giorni lavorativi", "Stato", "Note", "Creata"]
  ];

  state.historyRows.forEach((request) => {
    const employee = getEmployeeById(request.employeeId);
    rows.push([
      employee?.fullName || "",
      employee?.email || "",
      request.type,
      request.startDate,
      request.endDate,
      request.workingDays,
      request.status,
      request.notes.replaceAll('"', '""'),
      request.createdAt
    ]);
  });

  const csvContent = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "")}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leaveflow-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
