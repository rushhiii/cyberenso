const STORAGE_KEY = "cyberenso-history";

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(seed) {
  let value = seed || 1;
  return () => {
    value = Math.imul(value ^ value >>> 15, 1 | value);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function createSvg(text, reverse = false) {
  const rng = random(hashText(text || "empty"));
  const center = 512;
  const count = 34;
  const base = 325;
  const gap = reverse ? -1 : 1;
  const paths = [];
  for (let i = 0; i < count; i++) {
    const radius = base + i * 3.2;
    const start = (0.32 + rng() * .28) * Math.PI;
    const sweep = (1.72 + rng() * .14) * Math.PI;
    const end = start + gap * sweep;
    const x1 = center + Math.cos(start) * radius;
    const y1 = center + Math.sin(start) * radius;
    const x2 = center + Math.cos(end) * radius;
    const y2 = center + Math.sin(end) * radius;
    const large = Math.abs(sweep) > Math.PI ? 1 : 0;
    paths.push(`<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${large} ${gap > 0 ? 1 : 0} ${x2.toFixed(2)} ${y2.toFixed(2)}" />`);
  }
  return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-label="Generated Ensō"><rect width="1024" height="1024" fill="#e8e2d8"/><g fill="none" stroke="#171714" stroke-width="3.2" stroke-linecap="round">${paths.join("")}</g></svg>`;
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveHistory(item) {
  const history = [item, ...getHistory().filter((entry) => entry.id !== item.id)].slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
function download(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name; link.click(); URL.revokeObjectURL(link.href);
}
function wireNav() {
  const menu = document.querySelector(".menu"), links = document.querySelector(".nav-links");
  if (menu) menu.addEventListener("click", () => links.classList.toggle("open"));
}
function initCreate() {
  const form = document.querySelector("#editor-form"); if (!form) return;
  const title = document.querySelector("#title"), author = document.querySelector("#author"), content = document.querySelector("#content"), canvas = document.querySelector("#enso"), status = document.querySelector("#status");
  let reverse = false;
  const update = () => { canvas.innerHTML = createSvg(`${title.value}\n${author.value}\n${content.value}`, reverse); status.textContent = `${content.value.length} characters · deterministic seed ${hashText(content.value).toString(16)}`; };
  form.addEventListener("input", update);
  document.querySelector("#reverse").addEventListener("click", () => { reverse = !reverse; update(); });
  document.querySelector("#reset").addEventListener("click", () => { form.reset(); reverse = false; update(); });
  document.querySelector("#save").addEventListener("click", () => { const item = { id: crypto.randomUUID(), title: title.value || "Untitled Ensō", author: author.value, content: content.value, svg: createSvg(`${title.value}\n${author.value}\n${content.value}`, reverse), created: new Date().toISOString() }; saveHistory(item); status.textContent = "Saved to this browser's history."; });
  document.querySelector("#download-svg").addEventListener("click", () => download("cyberenso.svg", canvas.innerHTML, "image/svg+xml"));
  update();
}
function initHistory() {
  const grid = document.querySelector("#history-grid"); if (!grid) return;
  const items = getHistory();
  if (!items.length) { grid.innerHTML = `<div class="empty">No saved Ensō yet. Create one and press “Save to history”.</div>`; return; }
  grid.innerHTML = items.map((item) => `<article class="history-card">${item.svg}<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.author || "Anonymous")} · ${new Date(item.created).toLocaleDateString()}</p><a class="button ghost" href="create.html?history=${encodeURIComponent(item.id)}">Open in editor</a></article>`).join("");
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]); }
function loadHistoryItem() {
  const id = new URLSearchParams(location.search).get("history"); if (!id) return;
  const item = getHistory().find((entry) => entry.id === id); if (!item) return;
  document.querySelector("#title").value = item.title; document.querySelector("#author").value = item.author; document.querySelector("#content").value = item.content;
}
wireNav(); loadHistoryItem(); initCreate(); initHistory();
