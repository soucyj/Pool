const PARTIES = [
  { id: "caq", short: "CAQ", name: "Coalition avenir Québec", color: "#1685bb" },
  { id: "plq", short: "PLQ", name: "Parti libéral du Québec", color: "#e44646" },
  { id: "pq", short: "PQ", name: "Parti Québécois", color: "#1769a8" },
  { id: "qs", short: "QS", name: "Québec solidaire", color: "#ca3c80" },
  { id: "pcq", short: "PCQ", name: "Parti conservateur du Québec", color: "#425aa8" },
  { id: "other", short: "AUT.", name: "Autres", color: "#93988f" },
];
const TOTAL_SEATS = 127;
const SOURCES = {
  qc125: "Qc125",
  radioCanada: "Radio-Canada",
  final: "Final",
};
const SOURCE_LINKS = {
  qc125: "https://qc125.com/",
  radioCanada: "https://ici.radio-canada.ca/info/dossier/1013730/elections-quebec-2026",
  final: "https://ici.radio-canada.ca/info/dossier/1013730/elections-quebec-2026",
};

const data = window.POOL_DATA ?? { predictions: [], updates: [] };

function seatTotal(seats) {
  return PARTIES.reduce((sum, party) => sum + (seats?.[party.id] ?? 0), 0);
}

function validate({ predictions = [], updates = [] }) {
  const errors = [];
  const check = (label, seats) => {
    if (!PARTIES.every(({ id }) => Number.isInteger(seats?.[id]) && seats[id] >= 0)) {
      errors.push(`${label} : nombres de sièges invalides.`);
    } else if (seatTotal(seats) !== TOTAL_SEATS) {
      errors.push(`${label} : ${seatTotal(seats)} sièges au lieu de ${TOTAL_SEATS}.`);
    }
  };
  predictions.forEach((p) => check(`Prédiction de ${p.name}`, p.seats));
  updates.forEach((u, i) => {
    if (!SOURCES[u.source] || Number.isNaN(Date.parse(u.at))) errors.push(`Mise à jour n° ${i + 1} : source ou heure invalide.`);
    check(`Mise à jour n° ${i + 1}`, u.seats);
  });
  return errors;
}

const errors = validate(data);
const state = {
  predictions: errors.length ? [] : data.predictions,
  updates: errors.length ? [] : [...data.updates].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
};

function l1(player, reference) {
  return PARTIES.reduce((sum, { id }) => sum + Math.abs(player.seats[id] - reference[id]), 0);
}

function l2(player, reference) {
  return Math.sqrt(PARTIES.reduce((sum, { id }) => sum + (player.seats[id] - reference[id]) ** 2, 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-CA", { hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function renderErrors() {
  const box = document.querySelector("#data-errors");
  box.hidden = errors.length === 0;
  box.innerHTML = errors.map((e) => `<p>${escapeHtml(e)}</p>`).join("");
}

function renderProjection() {
  const latest = state.updates.at(-1);
  document.querySelector("#reference-status").textContent = latest
    ? `DERNIÈRE MISE À JOUR · ${SOURCES[latest.source].toLocaleUpperCase("fr-CA")}`
    : "EN ATTENTE DES DONNÉES";
  document.querySelector("#reference-updated").textContent = latest
    ? `Mise à jour à ${formatDate(latest.at)} · ${state.updates.length} ${state.updates.length === 1 ? "mise à jour" : "mises à jour"} au total`
    : "Aucune projection n’a encore été publiée.";
  const link = document.querySelector(".source-link");
  link.textContent = `SOURCE : ${latest ? SOURCES[latest.source].toLocaleUpperCase("fr-CA") : "QC125"} ↗`;
  link.href = SOURCE_LINKS[latest?.source ?? "qc125"];

  const seats = latest?.seats;
  document.querySelector("#projection-empty").hidden = Boolean(seats);
  document.querySelector("#seat-majority").hidden = !seats;
  document.querySelector("#seat-cards").innerHTML = seats ? PARTIES.map((party) => `
    <article class="seat-card" style="--party-color:${party.color}">
      <span class="party-short">${party.short}</span>
      <span class="party-full">${party.name}</span>
      <strong class="seat-number">${seats[party.id]}<span class="seat-unit">sièges</span></strong>
      <div class="seat-bar" aria-hidden="true"><span style="width:${(seats[party.id] / TOTAL_SEATS) * 100}%"></span></div>
    </article>
  `).join("") : "";
}

function renderStandings() {
  const reference = state.updates.at(-1)?.seats;
  const rows = state.predictions.map((player) => ({
    player,
    l1: reference ? l1(player, reference) : null,
    l2: reference ? l2(player, reference) : null,
  }));
  rows.sort((a, b) => reference
    ? a.l1 - b.l1 || a.l2 - b.l2 || a.player.name.localeCompare(b.player.name, "fr")
    : a.player.name.localeCompare(b.player.name, "fr"));

  document.querySelector("#player-count").textContent = `${rows.length} ${rows.length === 1 ? "PARTICIPANT" : "PARTICIPANTS"}`;
  document.querySelector("#standings-empty").hidden = rows.length > 0;
  document.querySelector("table").hidden = rows.length === 0;
  document.querySelector("#standings-body").innerHTML = rows.map(({ player, l1: a, l2: b }, index) => `
    <tr>
      <td><span class="rank-number ${index === 0 && reference ? "is-first" : ""}">${reference ? String(index + 1).padStart(2, "0") : "—"}</span></td>
      <td>
        <div class="player-cell">
          <span class="avatar">${escapeHtml(player.name.trim().charAt(0) || "?")}</span>
          <span>${escapeHtml(player.name)}</span>
        </div>
      </td>
      <td>
        <div class="prediction-list">
          ${PARTIES.map((party) => `<span class="prediction-chip" style="--party-color:${party.color}"><i></i>${party.short} ${player.seats[party.id]}</span>`).join("")}
        </div>
      </td>
      <td class="score-value ${reference ? "" : "pending"}">${reference ? a : "—"}</td>
      <td class="score-value ${reference ? "" : "pending"}">${reference ? b.toFixed(2) : "—"}</td>
    </tr>
  `).join("");
}

const LINE_COLORS = ["#f05a35", "#244d3c", "#1685bb", "#ca3c80", "#b8892b", "#6a5acd", "#2f9e8f", "#8a5a44"];

function renderEvolution() {
  const host = document.querySelector("#evolution-chart");
  const points = state.updates;
  const players = state.predictions;
  if (!players.length || points.length < 1) {
    host.innerHTML = `<div class="table-empty"><strong>Pas encore d’évolution à afficher.</strong><p>Ajoutez des participants et au moins une projection dans data.js.</p></div>`;
    return;
  }
  const W = 900, H = 340, m = { l: 44, r: 20, t: 16, b: 46 };
  const series = players.map((player, i) => ({
    player,
    color: LINE_COLORS[i % LINE_COLORS.length],
    values: points.map((point) => l1(player, point.seats)),
  }));
  const maxY = Math.max(10, ...series.flatMap((item) => item.values));
  const yTop = Math.ceil(maxY / 10) * 10;
  const x = (i) => m.l + (points.length === 1 ? (W - m.l - m.r) / 2 : (i / (points.length - 1)) * (W - m.l - m.r));
  const y = (v) => H - m.b - (v / yTop) * (H - m.t - m.b);
  const sourceLabel = (id) => SOURCES[id];
  const grid = [0, 1, 2, 3, 4].map((k) => {
    const v = (yTop / 4) * k;
    return `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e4e2da"/><text x="${m.l - 8}" y="${y(v) + 3}" text-anchor="end" class="chart-text">${Math.round(v)}</text>`;
  }).join("");
  const step = Math.ceil(points.length / 10);
  const xLabels = points.map((point, i) => (i % step === 0 || i === points.length - 1)
    ? `<text x="${x(i)}" y="${H - m.b + 17}" text-anchor="middle" class="chart-text">${formatDate(point.at)}</text><text x="${x(i)}" y="${H - m.b + 30}" text-anchor="middle" class="chart-text chart-sub">${sourceLabel(point.source)}</text>` : "").join("");
  const lines = series.map(({ player, color, values }) => `
    <polyline fill="none" stroke="${color}" stroke-width="2" points="${values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>
    ${values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${color}"><title>${escapeHtml(player.name)} · ${formatDate(points[i].at)} · ${sourceLabel(points[i].source)} : ${v}</title></circle>`).join("")}
  `).join("");
  const legend = series.map(({ player, color, values }) => {
    const first = values[0], last = values[values.length - 1], delta = last - first;
    return `<li><i style="background:${color}"></i><span>${escapeHtml(player.name)}</span><b>${first} → ${last}</b><em class="${delta > 0 ? "up" : delta < 0 ? "down" : ""}">${delta > 0 ? "+" : ""}${delta}</em></li>`;
  }).join("");
  host.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution de l’écart L1 de chaque participant">
      ${grid}${xLabels}${lines}
      <text x="${m.l}" y="10" class="chart-text">Écart L1 (sièges)</text>
    </svg>
    <ul class="chart-legend">${legend}</ul>`;
}

function render() {
  renderErrors();
  renderProjection();
  renderStandings();
  renderEvolution();
}

render();
