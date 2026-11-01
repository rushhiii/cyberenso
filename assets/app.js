const STORAGE_KEY = "cyberenso-history";
const DEFAULT_CONTENT = "A quiet mind makes room.";

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
  const digits = Array.from({ length: 32 }, () => Math.floor(rng() * 10));
  const center = 1024;
  const radius = 512;
  const radiusStep = radius * 0.005859375;
  const paths = [];
  const randomInt = (min, max) => Math.floor(rng() * (max - min)) + min;
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
    const largeArc = reverse ? (end - start >= 180 ? 0 : 1) : (end - start <= 180 ? 0 : 1);
    return `M ${first.x} ${first.y} A ${currentRadius} ${currentRadius} 0 ${largeArc} 0 ${second.x} ${second.y}`;
  };
  for (let i = 0; i < 60; i++) {
    const digit = digits[i % digits.length];
    let start;
    let end;
    if (reverse) {
      end = 360 - 0.1 + digit * 0.4;
      start = digit === 0 ? 310 - randomInt(-10, 20) : 170 - 35 * digit + randomInt(-20, 30);
      if (digit !== 0 && start < 10) start = randomInt(20, 30);
    } else {
      start = 2.9 + digit * 0.4;
      end = digit === 0 ? 50 + randomInt(-10, 20) : 190 + 17 * digit + randomInt(-20, 60);
      if (digit !== 0 && end > 350) end = randomInt(330, 340);
    }
    paths.push(`<path d="${arc(radius - i * radiusStep, start, end, reverse ? 80 : -130)}" />`);
  }
  return `<svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg" aria-label="Generated Ensō"><rect width="100%" height="100%" fill="#e8e3df"/><g fill="none" stroke="#000000" stroke-width="${radiusStep + 1}" stroke-linecap="round" shape-rendering="geometricPrecision">${paths.join("")}</g></svg>`;
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
  const update = () => { canvas.innerHTML = createSvg(content.value, reverse); status.textContent = `${content.value.length} characters · deterministic seed ${hashText(content.value).toString(16)}`; };
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
  document.querySelector("#save").addEventListener("click", () => { const item = { id: crypto.randomUUID(), title: title.value || "Untitled Ensō", author: author.value, content: content.value, svg: createSvg(content.value, reverse), created: new Date().toISOString() }; saveHistory(item); status.textContent = "Saved to this browser's history."; });
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
