const STORAGE_KEY = "volunteer_scheduler_data_v1";

const defaultData = {
  churchName: "Primeira Igreja Batista de Curitiba",
  campusName: "PIB Curitiba - Campos Piraquara",
  ministryName: "Ministério de Produção de Culto",
  roles: ["Manager", "Apoio de palco"],
  volunteers: [],
  availabilities: {},
};

let state = loadState();

const ministryForm = document.getElementById("ministry-form");
const churchNameEl = document.getElementById("church-name");
const campusNameEl = document.getElementById("campus-name");
const ministryNameEl = document.getElementById("ministry-name");
const rolesInputEl = document.getElementById("roles-input");
const activeMinistryNameEl = document.getElementById("active-ministry-name");

const volunteerForm = document.getElementById("volunteer-form");
const volunteerNameEl = document.getElementById("volunteer-name");
const volunteerPhoneEl = document.getElementById("volunteer-phone");
const volunteerEmailEl = document.getElementById("volunteer-email");
const rolesCheckboxesEl = document.getElementById("roles-checkboxes");
const volunteersListEl = document.getElementById("volunteers-list");

const monthPickerEl = document.getElementById("month-picker");
const sendRequestButton = document.getElementById("send-request-button");
const requestMessageEl = document.getElementById("request-message");
const availabilityCalendarEl = document.getElementById("availability-calendar");

const generateScheduleButton = document.getElementById("generate-schedule-button");
const fallbackNameEl = document.getElementById("fallback-name");
const scheduleOutputEl = document.getElementById("schedule-output");

initialize();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultData);

  try {
    const parsed = JSON.parse(saved);
    return {
      churchName: String(parsed.churchName || defaultData.churchName),
      campusName: String(parsed.campusName || defaultData.campusName),
      ministryName: String(parsed.ministryName || defaultData.ministryName),
      roles: Array.isArray(parsed.roles) && parsed.roles.length
        ? parsed.roles.map((role) => String(role))
        : [...defaultData.roles],
      volunteers: Array.isArray(parsed.volunteers)
        ? parsed.volunteers.map((v) => ({
            id: Number(v.id),
            name: String(v.name),
            phone: String(v.phone),
            email: String(v.email),
            roles: Array.isArray(v.roles) ? v.roles.map((r) => String(r)) : [],
          }))
        : [],
      availabilities: typeof parsed.availabilities === "object" && parsed.availabilities
        ? parsed.availabilities
        : {},
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initialize() {
  monthPickerEl.value = getCurrentMonthValue();
  fillMinistryForm();
  renderRolesCheckboxes();
  renderVolunteers();
  renderAvailabilityCalendar();
  updateRequestMessage();

  ministryForm.addEventListener("submit", handleMinistrySave);
  volunteerForm.addEventListener("submit", handleVolunteerSubmit);
  monthPickerEl.addEventListener("change", () => {
    renderAvailabilityCalendar();
    updateRequestMessage();
  });
  sendRequestButton.addEventListener("click", copyRequestMessage);
  generateScheduleButton.addEventListener("click", renderAutoSchedule);
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fillMinistryForm() {
  churchNameEl.value = state.churchName;
  campusNameEl.value = state.campusName;
  ministryNameEl.value = state.ministryName;
  rolesInputEl.value = state.roles.join(", ");
  activeMinistryNameEl.textContent = state.ministryName;
}

function handleMinistrySave(event) {
  event.preventDefault();

  const roles = rolesInputEl.value
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!roles.length) {
    alert("Informe pelo menos uma função para o ministério.");
    return;
  }

  state.churchName = churchNameEl.value.trim();
  state.campusName = campusNameEl.value.trim();
  state.ministryName = ministryNameEl.value.trim();
  state.roles = roles;

  state.volunteers = state.volunteers.map((volunteer) => ({
    ...volunteer,
    roles: volunteer.roles.filter((role) => roles.includes(role)),
  }));

  saveState();
  fillMinistryForm();
  renderRolesCheckboxes();
  renderVolunteers();
  renderAvailabilityCalendar();
  updateRequestMessage();

  alert("Configuração do ministério salva com sucesso.");
}

function renderRolesCheckboxes() {
  rolesCheckboxesEl.innerHTML = "";

  state.roles.forEach((role, index) => {
    const label = document.createElement("label");
    label.className = "checkbox-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "volunteer-role";
    input.value = role;
    input.checked = index === 0;

    label.append(input, document.createTextNode(role));
    rolesCheckboxesEl.appendChild(label);
  });
}

function handleVolunteerSubmit(event) {
  event.preventDefault();

  const selectedRoles = Array.from(document.querySelectorAll('input[name="volunteer-role"]:checked'))
    .map((input) => input.value);

  if (!selectedRoles.length) {
    alert("Selecione ao menos uma função.");
    return;
  }

  const volunteer = {
    id: Date.now(),
    name: volunteerNameEl.value.trim(),
    phone: volunteerPhoneEl.value.trim(),
    email: volunteerEmailEl.value.trim(),
    roles: selectedRoles,
  };

  state.volunteers.push(volunteer);
  saveState();
  volunteerForm.reset();
  renderRolesCheckboxes();
  renderVolunteers();
  renderAvailabilityCalendar();
  updateRequestMessage();
}

function renderVolunteers() {
  volunteersListEl.innerHTML = "";

  if (!state.volunteers.length) {
    volunteersListEl.innerHTML = '<li class="empty">Nenhum voluntário cadastrado ainda.</li>';
    return;
  }

  state.volunteers.forEach((volunteer) => {
    const li = document.createElement("li");
    li.className = "volunteer-item";
    li.innerHTML = `
      <div>
        <strong>${volunteer.name}</strong>
        <small>${volunteer.email} • ${volunteer.phone}</small>
        <small>Funções: ${volunteer.roles.join(", ")}</small>
      </div>
      <button type="button" data-id="${volunteer.id}" class="danger">Remover</button>
    `;

    li.querySelector("button").addEventListener("click", () => removeVolunteer(volunteer.id));
    volunteersListEl.appendChild(li);
  });
}

function removeVolunteer(volunteerId) {
  state.volunteers = state.volunteers.filter((volunteer) => volunteer.id !== volunteerId);
  Object.keys(state.availabilities).forEach((dateKey) => {
    if (state.availabilities[dateKey]) {
      delete state.availabilities[dateKey][volunteerId];
    }
  });
  saveState();
  renderVolunteers();
  renderAvailabilityCalendar();
}

function buildMonthDates(monthValue) {
  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const date = new Date(year, month, 1);
  const dates = [];

  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

function getServiceTypeByDay(date) {
  const day = date.getDay();
  if (day === 6) return "Sábado 19:00";
  if (day === 0) return ["Domingo 09:00", "Domingo 19:00"];
  return null;
}

function renderAvailabilityCalendar() {
  availabilityCalendarEl.innerHTML = "";
  const monthValue = monthPickerEl.value || getCurrentMonthValue();
  const monthDates = buildMonthDates(monthValue);

  const relevantDates = monthDates
    .map((date) => ({ date, serviceType: getServiceTypeByDay(date) }))
    .filter((entry) => entry.serviceType);

  if (!relevantDates.length) {
    availabilityCalendarEl.innerHTML = "<p>Não há cultos neste mês.</p>";
    return;
  }

  relevantDates.forEach(({ date, serviceType }) => {
    const dateKey = toDateKey(date);
    const card = document.createElement("article");
    card.className = "date-card";

    const title = document.createElement("h4");
    title.textContent = formatDate(date);

    const serviceInfo = document.createElement("small");
    serviceInfo.textContent = Array.isArray(serviceType) ? serviceType.join(" e ") : serviceType;

    card.append(title, serviceInfo);

    if (!state.volunteers.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Cadastre voluntários para preencher disponibilidade.";
      card.appendChild(empty);
      availabilityCalendarEl.appendChild(card);
      return;
    }

    state.volunteers.forEach((volunteer) => {
      const label = document.createElement("label");
      label.className = "checkbox-item";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(state.availabilities[dateKey]?.[volunteer.id]);

      input.addEventListener("change", () => {
        if (!state.availabilities[dateKey]) state.availabilities[dateKey] = {};
        state.availabilities[dateKey][volunteer.id] = input.checked;
        saveState();
      });

      label.append(input, document.createTextNode(volunteer.name));
      card.appendChild(label);
    });

    availabilityCalendarEl.appendChild(card);
  });
}

function updateRequestMessage() {
  const monthValue = monthPickerEl.value || getCurrentMonthValue();
  const [year, month] = monthValue.split("-");

  requestMessageEl.value = `Olá, equipe do ${state.ministryName}!\n\n` +
    `Estamos abrindo a disponibilidade de ${month}/${year}.\n` +
    `Por favor, responda quais datas de sábado (19h), domingo pela manhã (9h) e domingo à noite (19h) você consegue servir.\n\n` +
    `Igreja: ${state.churchName} - ${state.campusName}`;
}

function copyRequestMessage() {
  updateRequestMessage();
  requestMessageEl.select();
  document.execCommand("copy");
  alert("Mensagem copiada! Agora você pode enviar para os voluntários.");
}

function renderAutoSchedule() {
  scheduleOutputEl.innerHTML = "";

  if (!state.volunteers.length) {
    scheduleOutputEl.innerHTML = '<p class="empty">Cadastre voluntários antes de gerar a escala.</p>';
    return;
  }

  const monthValue = monthPickerEl.value || getCurrentMonthValue();
  const monthDates = buildMonthDates(monthValue);
  const fallbackName = fallbackNameEl.value.trim() || "Líder (autoescala)";

  const relevantDates = monthDates.filter((date) => getServiceTypeByDay(date));

  relevantDates.forEach((date) => {
    const dateKey = toDateKey(date);
    const dateAvailabilities = state.availabilities[dateKey] || {};

    const wrapper = document.createElement("article");
    wrapper.className = "schedule-card";
    wrapper.innerHTML = `<h4>${formatDate(date)}</h4>`;

    state.roles.forEach((role) => {
      const eligible = state.volunteers.filter((volunteer) =>
        volunteer.roles.includes(role) && dateAvailabilities[volunteer.id]
      );

      const assignee = eligible.length ? pickByFairness(role, eligible) : fallbackName;

      const row = document.createElement("p");
      row.innerHTML = `<strong>${role}:</strong> ${typeof assignee === "string" ? assignee : assignee.name}`;
      wrapper.appendChild(row);
    });

    scheduleOutputEl.appendChild(wrapper);
  });
}

const roleCounter = {};

function pickByFairness(role, eligibleVolunteers) {
  if (!roleCounter[role]) roleCounter[role] = {};

  eligibleVolunteers.forEach((volunteer) => {
    if (roleCounter[role][volunteer.id] === undefined) {
      roleCounter[role][volunteer.id] = 0;
    }
  });

  const selected = [...eligibleVolunteers].sort(
    (a, b) => roleCounter[role][a.id] - roleCounter[role][b.id]
  )[0];

  roleCounter[role][selected.id] += 1;
  return selected;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
