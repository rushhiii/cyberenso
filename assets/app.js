const STORAGE_KEY = "cyberenso-history";
const DEFAULT_CONTENT = "A quiet mind makes room.";

async function hashText(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest).join("").split("").map(Number);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

async function createSvg(text, reverse = false) {
  const digits = await hashText(text || "empty");
  const center = 1024;
  const radius = 512;
  const radiusStep = radius * 0.005859375;
  const paths = [];
  const point = (angle, currentRadius, offset = 0) => {
    const radians = ((angle - 90 + offset) * Math.PI) / 180;
    return {
      x: center + currentRadius * Math.cos(radians),
      y: center + currentRadius * Math.sin(radians),
    };
  };
  const arc = (currentRadius, start, end, offset) => {
    const first = point(start, currentRadius, offset);
    const second = point(end, currentRadius, offset);
    const largeArc = end - start <= 180 ? 0 : 1;
    return `M ${first.x} ${first.y} A ${currentRadius} ${currentRadius} 0 ${largeArc} 0 ${second.x} ${second.y}`;
  };
  for (let i = 0; i < 60; i++) {
    const digit = digits[i % digits.length];
    let start;
    let end;
    if (reverse) {
      start = 360 - 0.1 + digit * 0.4;
      end = digit === 0 ? 310 - randomInt(-20, 10) : 170 - 35 * digit + randomInt(-30, 20);
      if (digit !== 0 && start < 10) start = randomInt(20, 30);
    } else {
      start = 2.9 + digit * 0.4;
      end = digit === 0 ? 50 + randomInt(-10, 20) : 190 + 17 * digit + randomInt(-20, 60);
      if (digit !== 0 && end > 350) end = randomInt(330, 340);
    }
    paths.push(`<path d="${arc(radius - i * radiusStep, start, end, reverse ? 80 : -130)}" />`);
  }
  return `<svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg" aria-label="Generated Ensō"><rect width="100%" height="100%" fill="var(--enso-paper, #e8e3df)"/><g fill="none" stroke="var(--enso-ink, #000000)" stroke-width="${radiusStep + 1}" stroke-linecap="round" shape-rendering="geometricPrecision">${paths.join("")}</g></svg>`;
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
  const update = async () => { canvas.innerHTML = await createSvg(content.value, reverse); status.textContent = `${content.value.length} characters · digest-driven original arc geometry`; };
  form.addEventListener("input", update);
  document.querySelector("#reverse").addEventListener("click", () => { reverse = !reverse; update(); });
  document.querySelector("#reset").addEventListener("click", () => {
    title.value = "";
    author.value = "";
    content.value = DEFAULT_CONTENT;
    reverse = false;
    update();
    status.textContent = "Editor reset to a new blank Ensō.";
  });
  document.querySelector("#save").addEventListener("click", async () => { const item = { id: crypto.randomUUID(), title: title.value || "Untitled Ensō", author: author.value, content: content.value, svg: await createSvg(content.value, reverse), created: new Date().toISOString() }; saveHistory(item); status.textContent = "Saved to this browser's history."; });
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
function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("cyberenso-theme");
  if (stored === "dark") root.dataset.theme = "dark";
  const button = document.querySelector("#theme-toggle");
  if (button) button.textContent = root.dataset.theme === "dark" ? "Light" : "Dark";
  if (button) button.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("cyberenso-theme", root.dataset.theme);
    button.textContent = root.dataset.theme === "dark" ? "Light" : "Dark";
    if (document.querySelector("#editor-form")) document.querySelector("#editor-form").dispatchEvent(new Event("input"));
  });
}
wireNav(); initTheme(); loadHistoryItem(); initCreate(); initHistory();
