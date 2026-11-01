const STORAGE_KEY = "cyberenso-history";
const DEFAULT_CONTENT = "A quiet mind makes room.";

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
function hashText(text) {
  const digest = blake2b(new TextEncoder().encode(text), 32);
  const digits = Array.from(digest).join("").split("").map(Number);
  const skipZeros = randomInt(0, 6);
  let removed = 0;
  return digits.filter((digit) => digit !== 0 || removed++ < skipZeros);
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
    const largeArc = start - end <= 180 ? 0 : 1;
    return `M ${first.x} ${first.y} A ${currentRadius} ${currentRadius} 0 ${largeArc} 0 ${second.x} ${second.y}`;
  };
  for (let i = 0; i < 60; i++) {
    const digit = digits[i % digits.length];
    let start;
    let end;
    if (reverse) {
      end = 360 - 0.1 + digit * 0.4;
      start = digit === 0 ? 310 - randomInt(10, -20) : 170 - 35 * digit + randomInt(20, -30);
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
