const STORAGE_KEY = "leaveflow-demo-state-v1";

const seedState = {
  role: "employee",
  activeView: "dashboard",
  employees: [
    { id: "emp-1", name: "Giulia Caruana", team: "Sales", annualQuota: 26 },
    { id: "emp-2", name: "Luca Grech", team: "Operations", annualQuota: 24 },
    { id: "emp-3", name: "Marta Vella", team: "Finance", annualQuota: 28 },
    { id: "emp-4", name: "Nadia Borg", team: "People", annualQuota: 30 }
  ],
  requests: [
    {
      id: "req-1",
      employeeId: "emp-1",
      type: "Ferie",
      startDate: "2026-04-28",
      endDate: "2026-05-02",
      workingDays: 4,
      status: "Pending",
      notes: "Weekend lungo in famiglia",
      createdAt: "2026-04-16"
    },
    {
      id: "req-2",
      employeeId: "emp-2",
      type: "Ferie",
      startDate: "2026-03-10",
      endDate: "2026-03-13",
      workingDays: 4,
      status: "Approved",
      notes: "Viaggio prenotato",
      createdAt: "2026-02-22"
    },
    {
      id: "req-3",
      employeeId: "emp-3",
      type: "Permesso",
      startDate: "2026-02-03",
      endDate: "2026-02-03",
      workingDays: 1,
      status: "Rejected",
      notes: "Impegno personale",
      createdAt: "2026-02-01"
    },
    {
      id: "req-4",
      employeeId: "emp-4",
      type: "Ferie",
      startDate: "2026-01-15",
      endDate: "2026-01-23",
      workingDays: 7,
      status: "Approved",
      notes: "Vacanza invernale",
      createdAt: "2025-12-18"
    }
  ]
};

let state = loadState();

const refs = {
  body: document.body,
  roleButtons: [...document.querySelectorAll(".role-button")],
  navButtons: [...document.querySelectorAll(".nav-item")],
  shortcutViewButtons: [...document.querySelectorAll("[data-view-target].assist-button")],
  panels: [...document.querySelectorAll(".view-panel")],
  employeeSelect: document.getElementById("employeeSelect"),
  leaveType: document.getElementById("leaveType"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  requestNotes: document.getElementById("requestNotes"),
  requestForm: document.getElementById("requestForm"),
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

initialize();

function initialize() {
  hydratePeriodInputs();
  bindEvents();
  populateEmployeeOptions();
  syncRoleUI();
  syncViewUI();
  render();
}

function bindEvents() {
  refs.roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role;
      state.activeView = state.role === "admin" ? "dashboard" : "request";
      saveState();
      syncRoleUI();
      syncViewUI();
    });
  });

  refs.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.viewTarget;
      saveState();
      syncViewUI();
    });
  });

  refs.shortcutViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.viewTarget;
      saveState();
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

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(seedState);
  }

  try {
    return { ...structuredClone(seedState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydratePeriodInputs() {
  const today = new Date();
  const currentYearStart = new Date(today.getFullYear(), 0, 1);
  const last12MonthsStart = new Date(today);
  last12MonthsStart.setFullYear(today.getFullYear() - 1);
  last12MonthsStart.setDate(last12MonthsStart.getDate() + 1);

  if (!state.periodPreset) state.periodPreset = "currentYear";
  if (!state.periodStart) state.periodStart = toISODate(currentYearStart);
  if (!state.periodEnd) state.periodEnd = toISODate(today);

  refs.periodPreset.value = state.periodPreset;

  if (state.periodPreset === "last12Months") {
    state.periodStart = toISODate(last12MonthsStart);
    state.periodEnd = toISODate(today);
  }

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
  saveState();
  render();
}

function handleCustomPeriodChange() {
  state.periodPreset = "custom";
  state.periodStart = refs.periodStart.value;
  state.periodEnd = refs.periodEnd.value;
  refs.periodPreset.value = "custom";
  saveState();
  render();
}

function populateEmployeeOptions() {
  const options = state.employees
    .map((employee) => `<option value="${employee.id}">${employee.name}</option>`)
    .join("");

  refs.employeeSelect.innerHTML = options;
  refs.filterEmployee.innerHTML = `<option value="all">Tutti</option>${options}`;
}

function syncRoleUI() {
  const allowedViews =
    state.role === "admin" ? ["dashboard", "approvals", "history", "team"] : ["request", "history"];
  if (!allowedViews.includes(state.activeView)) {
    state.activeView = state.role === "admin" ? "dashboard" : "request";
    saveState();
  }

  refs.roleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.role === state.role);
  });

  refs.body.classList.toggle("role-admin", state.role === "admin");
  refs.body.classList.toggle("role-employee", state.role === "employee");
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

  if (refs.approvalQueueMirror) {
    refs.approvalQueueMirror.innerHTML = pending.length
      ? pending.slice(0, 4).map((request) => requestCardMarkup(request, false)).join("")
      : emptyStateMarkup("Nessuna richiesta in coda.");
  }

  refs.approvalQueue.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      updateRequestStatus(button.dataset.id, button.dataset.action);
    });
  });
}

function requestCardMarkup(request, withActions) {
  const employee = getEmployeeById(request.employeeId);
  return `
    <article class="request-item">
      <div class="request-item-head">
        <div>
          <h4>${employee.name}</h4>
          <p class="meta-line">${request.type} · ${formatDate(request.startDate)} - ${formatDate(request.endDate)}</p>
          <p class="meta-line">${request.workingDays} giorni lavorativi · ${employee.team}</p>
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

function updateRequestStatus(requestId, status) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  request.status = status;
  saveState();
  render();
}

function submitRequest() {
  const employeeId = refs.employeeSelect.value;
  const startDate = refs.startDate.value;
  const endDate = refs.endDate.value;
  const workingDays = countWorkingDays(startDate, endDate);

  if (!employeeId || !startDate || !endDate || workingDays <= 0) {
    refs.workingDaysInfo.textContent = "Inserisci un intervallo valido con almeno un giorno lavorativo.";
    return;
  }

  state.requests.unshift({
    id: `req-${generateId()}`,
    employeeId,
    type: refs.leaveType.value,
    startDate,
    endDate,
    workingDays,
    status: "Pending",
    notes: refs.requestNotes.value.trim(),
    createdAt: toISODate(new Date())
  });

  refs.requestForm.reset();
  refs.employeeSelect.value = employeeId;
  refs.workingDaysInfo.textContent = `Richiesta inviata. Giorni lavorativi conteggiati: ${workingDays}.`;
  state.activeView = "approvals";
  saveState();
  syncViewUI();
  render();
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
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function renderHistory() {
  const statusFilter = refs.filterStatus.value;
  const employeeFilter = refs.filterEmployee.value;
  const startFilter = refs.historyStart.value;
  const endFilter = refs.historyEnd.value;

  const rows = state.requests
    .filter((request) => (statusFilter === "all" ? true : request.status === statusFilter))
    .filter((request) => (employeeFilter === "all" ? true : request.employeeId === employeeFilter))
    .filter((request) => (!startFilter ? true : request.startDate >= startFilter))
    .filter((request) => (!endFilter ? true : request.endDate <= endFilter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  refs.historyTableBody.innerHTML = rows.length
    ? rows
        .map((request) => {
          const employee = getEmployeeById(request.employeeId);
          return `
            <tr>
              <td>${employee.name}</td>
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
              <h4>${employee.name}</h4>
              <p class="meta-line">${employee.team}</p>
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
              <h4>${employee.name}</h4>
              <p class="meta-line">${employee.team}</p>
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
    ["Dipendente", "Team", "Tipo", "Data inizio", "Data fine", "Giorni lavorativi", "Stato", "Note", "Creata"]
  ];

  state.requests.forEach((request) => {
    const employee = getEmployeeById(request.employeeId);
    rows.push([
      employee.name,
      employee.team,
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
  }).format(new Date(`${value}T12:00:00`));
}

function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function generateId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
