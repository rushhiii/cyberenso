const STORAGE_KEY = "cyberenso-history";
const DEFAULT_CONTENT = "A quiet mind makes room.";
const DEFAULT_COLORS = { ink: "#000000", paper: "#e8e3df" };
function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    ink: styles.getPropertyValue("--enso-ink").trim() || DEFAULT_COLORS.ink,
    paper: styles.getPropertyValue("--enso-paper").trim() || DEFAULT_COLORS.paper,
  };
}

const BLAKE2B_IV = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];
const BLAKE2B_SIGMA = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  [14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],
  [11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4],
  [7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8],
  [9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13],
  [2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9],
  [12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11],
  [13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10],
  [6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5],
  [10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0],
];
const MASK_64 = 0xffffffffffffffffn;
function rotateRight(value, amount) { return ((value >> BigInt(amount)) | (value << BigInt(64 - amount))) & MASK_64; }
function blake2b(input, outputLength = 32) {
  const state = BLAKE2B_IV.slice();
  state[0] ^= 0x01010000n ^ BigInt(outputLength);
  const blocks = Math.max(1, Math.ceil(input.length / 128));
  let offset = 0;
  for (let block = 0; block < blocks; block++) {
    const length = Math.min(128, input.length - offset);
    const words = Array(16).fill(0n);
    for (let i = 0; i < length; i++) words[i >> 3] |= BigInt(input[offset + i]) << BigInt((i & 7) * 8);
    offset += length;
    const working = state.concat(BLAKE2B_IV);
    working[12] ^= BigInt(offset);
    if (block === blocks - 1) working[14] ^= MASK_64;
    const mix = (a, b, c, d, x, y) => {
      working[a] = (working[a] + working[b] + x) & MASK_64;
      working[d] = rotateRight(working[d] ^ working[a], 32);
      working[c] = (working[c] + working[d]) & MASK_64;
      working[b] = rotateRight(working[b] ^ working[c], 24);
      working[a] = (working[a] + working[b] + y) & MASK_64;
      working[d] = rotateRight(working[d] ^ working[a], 16);
      working[c] = (working[c] + working[d]) & MASK_64;
      working[b] = rotateRight(working[b] ^ working[c], 63);
    };
    for (let round = 0; round < 12; round++) {
      const sigma = BLAKE2B_SIGMA[round % 10];
      mix(0, 4, 8, 12, words[sigma[0]], words[sigma[1]]);
      mix(1, 5, 9, 13, words[sigma[2]], words[sigma[3]]);
      mix(2, 6, 10, 14, words[sigma[4]], words[sigma[5]]);
      mix(3, 7, 11, 15, words[sigma[6]], words[sigma[7]]);
      mix(0, 5, 10, 15, words[sigma[8]], words[sigma[9]]);
      mix(1, 6, 11, 12, words[sigma[10]], words[sigma[11]]);
      mix(2, 7, 8, 13, words[sigma[12]], words[sigma[13]]);
      mix(3, 4, 9, 14, words[sigma[14]], words[sigma[15]]);
    }
    for (let i = 0; i < 8; i++) state[i] = (state[i] ^ working[i] ^ working[i + 8]) & MASK_64;
  }
  const output = new Uint8Array(outputLength);
  for (let i = 0; i < outputLength; i++) output[i] = Number((state[i >> 3] >> BigInt((i & 7) * 8)) & 0xffn);
  return output;
}
function hashText(text, fixedSkipZeros) {
  const digest = blake2b(new TextEncoder().encode(text), 32);
  const digits = Array.from(digest).join("").split("").map(Number);
  const skipZeros = fixedSkipZeros ?? randomInt(0, 6);
  let removed = 0;
  return {
    digits: digits.filter((digit) => digit !== 0 || removed++ < skipZeros),
    hex: Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(""),
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
}
function attributionText(mode, title, author, content) {
  const name = author.trim() || "Anonymous";
  const firstLineValue = (content.trim().split(/\r?\n/)[0] || "Untitled").trim();
  const firstLine = firstLineValue.length > 34 ? `${firstLineValue.slice(0, 34).trimEnd()}...` : firstLineValue;
  if (mode === "author") return `— ${name}`;
  if (mode === "author-title") return `— ${name} (${title.trim() || "Untitled Ensō"})`;
  if (mode === "author-first") return `— ${name} (${firstLine})`;
  if (mode === "author-full") return `— ${name} (${content.trim() || "Untitled"})`;
  return "";
}
function attributionSvg(text, color, size = 32) {
  if (!text) return "";
  const lines = text.match(new RegExp(`.{1,${size > 32 ? 48 : 58}}(?:\\s+|$)`, "g")) || [text];
  return `<text x="1960" y="${1950 - (lines.length - 1) * size}" text-anchor="end" fill="${escapeXml(color)}" font-family="Manrope, sans-serif" font-size="${size}">${lines.map((line, index) => `<tspan x="1960" dy="${index ? size : 0}">${escapeXml(line.trim())}</tspan>`).join("")}</text>`;
}

async function createSvg(text, reverse = false, colors = DEFAULT_COLORS, attribution = "", variations = []) {
  const { digits } = await hashText(text || "empty", variations[60] === undefined ? undefined : Math.floor(variations[60] * 6));
  const center = 1024;
  const hasAttribution = Boolean(attribution);
  const radius = hasAttribution ? 700 : 900;
  const radiusStep = radius * 0.005859375;
  const paths = [];
  const vary = (min, max, index) => {
    const seed = variations[index] ?? Math.random();
    return Math.floor(seed * (max - min)) + min;
  };
  const point = (angle, currentRadius, offset = 0) => {
    const radians = ((angle - 90 + offset) * Math.PI) / 180;
    return {
      x: center + currentRadius * Math.cos(radians),
      y: center + currentRadius * Math.sin(radians),
    };
  };
  const arc = (currentRadius, start, end, offset) => {
    const segments = 72;
    const points = Array.from({ length: segments + 1 }, (_, index) => {
      const angle = start + ((end - start) * index) / segments;
      const { x, y } = point(angle, currentRadius, offset);
      return `${x} ${y}`;
    });
    return `M ${points[0]} L ${points.slice(1).join(" L ")}`;
  };
  for (let i = 0; i < 60; i++) {
    const digit = digits[i % digits.length];
    let start;
    let end;
    if (reverse) {
      end = 360 - 0.1 + digit * 0.4;
      start = digit === 0
        ? 310 - vary(10, -20, i)
        : 170 - 35 * digit + vary(20, -30, i);
      if (digit !== 0 && start < 10) start = vary(20, 30, i);
    } else {
      start = 3 - 0.1 + digit * 0.4;
      end = digit === 0
        ? 50 + vary(-10, 20, i)
        : 190 + 17 * digit + vary(-20, 60, i);
      if (digit !== 0 && end > 350) end = vary(330, 340, i);
    }
    paths.push(`<path d="${arc(radius - i * radiusStep, start, end, reverse ? 80 : -130)}" />`);
  }
  return `<svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg" aria-label="Generated Ensō"><rect width="100%" height="100%" fill="${colors.paper}"/><g fill="none" stroke="${colors.ink}" stroke-width="${radiusStep + 1}" stroke-linecap="round" shape-rendering="geometricPrecision">${paths.join("")}</g>${attributionSvg(attribution, colors.ink, hasAttribution ? 38 : 32)}</svg>`;
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
async function downloadPng(name, svg, size = 2048) {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.getContext("2d").drawImage(image, 0, 0, size, size);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = name;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    throw new Error("Could not render the SVG as PNG.");
  };
  image.src = url;
}
function wireNav() {
  const menu = document.querySelector(".menu"), links = document.querySelector(".nav-links");
  if (menu) menu.addEventListener("click", () => links.classList.toggle("open"));
}
function initCreate() {
  const form = document.querySelector("#editor-form"); if (!form) return;
  const title = document.querySelector("#title"), author = document.querySelector("#author"), content = document.querySelector("#content"), attribution = document.querySelector("#attribution"), canvas = document.querySelector("#enso"), status = document.querySelector("#status");
  const ink = document.querySelector("#ink-color"), paper = document.querySelector("#paper-color");
  const historyId = new URLSearchParams(location.search).get("history");
  const savedItem = historyId ? getHistory().find((entry) => entry.id === historyId) : null;
  const initialColors = savedItem?.colors || getThemeColors();
  const colors = { ...initialColors };
  let customColors = Boolean(savedItem?.colors);
  if (ink) ink.value = colors.ink;
  if (paper) paper.value = colors.paper;
  let reverse = false;
  const variations = savedItem?.variations || Array.from({ length: 61 }, () => Math.random());
  let baseKey = "";
  let baseSvg = "";
  const update = async () => {
    const attributionValue = attributionText(attribution.value, title.value, author.value, content.value);
    const geometryKey = JSON.stringify([content.value, reverse, colors.ink, colors.paper, Boolean(attributionValue)]);
    if (geometryKey !== baseKey) baseKey = geometryKey;
    baseSvg = await createSvg(content.value, reverse, colors, attributionValue, variations);
    canvas.innerHTML = baseSvg;
    canvas.parentElement.style.background = colors.paper;
    const { hex } = hashText(content.value || "empty");
    status.textContent = `${content.value.length} characters · BLAKE2b ${hex.slice(0, 12)}… · 60-layer circular geometry`;
  };
  document.addEventListener("cyberenso-theme-change", () => {
    if (customColors) return;
    Object.assign(colors, getThemeColors());
    if (ink) ink.value = colors.ink;
    if (paper) paper.value = colors.paper;
    update();
  });
  form.addEventListener("input", update);
  attribution?.addEventListener("change", update);
  ink?.addEventListener("input", () => { customColors = true; colors.ink = ink.value; update(); });
  paper?.addEventListener("input", () => { customColors = true; colors.paper = paper.value; update(); });
  document.querySelectorAll("[data-preset]").forEach((preset) => preset.addEventListener("click", () => {
    const selected = JSON.parse(preset.dataset.preset);
    customColors = true;
    colors.ink = ink.value = selected.ink;
    colors.paper = paper.value = selected.paper;
    update();
  }));
  document.querySelector("#reverse").addEventListener("click", () => { reverse = !reverse; update(); });
  document.querySelector("#reset").addEventListener("click", () => {
    title.value = "";
    author.value = "";
    content.value = DEFAULT_CONTENT;
    attribution.value = "none";
    customColors = false;
    const themeColors = getThemeColors();
    colors.ink = ink.value = themeColors.ink;
    colors.paper = paper.value = themeColors.paper;
    reverse = false;
    update();
    status.textContent = "Editor reset to a new blank Ensō.";
  });
  document.querySelector("#save").addEventListener("click", async () => { const attributionMode = attribution.value; const item = { id: crypto.randomUUID(), title: title.value || "Untitled Ensō", author: author.value, content: content.value, attributionMode, variations, colors: { ...colors }, svg: await createSvg(content.value, reverse, colors, attributionText(attributionMode, title.value, author.value, content.value), variations), created: new Date().toISOString() }; saveHistory(item); status.textContent = "Saved to this browser's history."; });
  document.querySelector("#download-svg").addEventListener("click", () => download("cyberenso.svg", canvas.innerHTML, "image/svg+xml"));
  document.querySelector("#download-png").addEventListener("click", async () => downloadPng("cyberenso.png", canvas.innerHTML));
  document.querySelector("#quote").addEventListener("click", async () => {
    const quotes = await fetch("assets/quotes.json").then((response) => {
      if (!response.ok) throw new Error(`Could not load quotes (${response.status})`);
      return response.json();
    });
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    title.value = quote.title;
    author.value = quote.author;
    content.value = quote.content;
    update();
  });
  update();
}
function initHistory() {
  const grid = document.querySelector("#history-grid"); if (!grid) return;
  const privateView = document.querySelector("#private-history");
  const publicView = document.querySelector("#public-history");
  document.querySelectorAll("[data-history-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const isPublic = button.dataset.historyView === "public";
      privateView.hidden = isPublic;
      publicView.hidden = !isPublic;
      document.querySelectorAll("[data-history-view]").forEach((tab) => {
        const selected = tab === button;
        tab.setAttribute("aria-selected", String(selected));
        tab.classList.toggle("ghost", !selected);
      });
    });
  });
  const items = getHistory();
  if (!items.length) { grid.innerHTML = `<div class="empty">No saved Ensō yet. Create one and press “Save to history”.</div>`; return; }
  grid.innerHTML = items.map((item) => `<article class="history-card">${item.svg}<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.author || "Anonymous")} · ${new Date(item.created).toLocaleDateString()}</p><a class="button ghost" href="create.html?history=${encodeURIComponent(item.id)}">Open in editor</a></article>`).join("");
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]); }
function loadHistoryItem() {
  const id = new URLSearchParams(location.search).get("history"); if (!id) return;
  const item = getHistory().find((entry) => entry.id === id); if (!item) return;
  document.querySelector("#title").value = item.title; document.querySelector("#author").value = item.author; document.querySelector("#content").value = item.content;
  const attribution = document.querySelector("#attribution");
  if (attribution) attribution.value = item.attributionMode || "none";
  if (item.colors) {
    document.querySelector("#ink-color").value = item.colors.ink;
    document.querySelector("#paper-color").value = item.colors.paper;
  }
}
function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("cyberenso-theme");
  if (stored === "dark") root.dataset.theme = "dark";
  const button = document.querySelector("#theme-toggle");
  const updateThemeIcon = () => {
    const dark = root.dataset.theme === "dark";
    button.textContent = dark ? "☀" : "☾";
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
  };
  if (button) updateThemeIcon();
  if (button) button.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("cyberenso-theme", root.dataset.theme);
    updateThemeIcon();
    document.dispatchEvent(new Event("cyberenso-theme-change"));
  });
}
wireNav(); initTheme(); loadHistoryItem(); initCreate(); initHistory();
