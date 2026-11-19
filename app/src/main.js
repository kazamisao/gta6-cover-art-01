// Vice Nights — GTA VI-style multi-panel cover maker.
// State lives here; every control re-renders the preview canvas.
import { drawCover, renderExport, PRESETS, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

export const EXPORT_SIZES = [
  { label: '1080 × 1080 (square)', w: 1080, h: 1080 },
  { label: '1080 × 1350 (portrait)', w: 1080, h: 1350 },
  { label: '1920 × 1080 (wide)', w: 1920, h: 1080 },
];

export const state = {
  layout: 'triptych',
  preset: 'sunset',
  title: 'Vice Nights',
  subtitle: 'A heist in the sun',
  panels: [
    { photo: 'pier', zoom: 1, ox: 0, oy: 0 },
    { photo: 'boulevard', zoom: 1, ox: 0, oy: 0 },
    { photo: 'pier', zoom: 1.15, ox: 0, oy: 0 },
    { photo: 'boulevard', zoom: 1, ox: 0, oy: 0 },
  ],
};

let selectedPanel = 0;
let exportSize = EXPORT_SIZES[0];
const images = [null, null, null, null]; // per-panel HTMLImageElement (or null)
const uploads = [null, null, null, null]; // per-panel object URLs from uploads
const canvas = document.getElementById('cover');
const status = document.getElementById('status');

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadPanel(i) {
  const p = state.panels[i];
  try {
    if (uploads[i]) { images[i] = await loadImage(uploads[i]); return; }
    images[i] = await loadImage(`samples/${p.photo}.jpg`);
  } catch {
    // One failed photo must not blank the whole poster: leave this
    // panel empty and let the others render.
    images[i] = null;
  }
}

export async function loadAllPanels() {
  await Promise.all([0, 1, 2, 3].map(loadPanel));
}

export async function redraw() {
  try { await document.fonts.load('80px Anton'); } catch { /* fallback font */ }
  drawCover(canvas, images, state);
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', b.dataset.preset === state.preset));
  document.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('active', Number(b.dataset.panel) === selectedPanel));
  document.querySelectorAll('[data-photo]').forEach((b) => b.classList.toggle('active', b.dataset.photo === state.panels[selectedPanel].photo && !uploads[selectedPanel]));
  const p = state.panels[selectedPanel];
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('ox').value = p.ox;
  document.getElementById('oy').value = p.oy;
  document.getElementById('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  document.getElementById('panelLabel').textContent = `Panel ${selectedPanel + 1} — ${uploads[selectedPanel] ? 'uploaded photo' : 'sample: ' + p.photo}`;
}

function bind(id, fn) { document.getElementById(id).addEventListener('input', fn); }

document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => { state.layout = b.dataset.layout; syncControls(); redraw(); }));
document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { state.preset = b.dataset.preset; syncControls(); redraw(); }));
document.querySelectorAll('[data-panel]').forEach((b) => b.addEventListener('click', () => { selectedPanel = Number(b.dataset.panel); syncControls(); }));
document.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', async () => {
  uploads[selectedPanel] = null;
  state.panels[selectedPanel].photo = b.dataset.photo;
  await loadPanel(selectedPanel); syncControls(); redraw();
}));
document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  e.target.value = ''; // allow picking the same file again
  uploads[selectedPanel] = URL.createObjectURL(file);
  await loadPanel(selectedPanel); syncControls(); redraw();
  status.textContent = `Photo loaded into panel ${selectedPanel + 1}.`;
});
document.getElementById('sameAll').addEventListener('click', async () => {
  const src = state.panels[selectedPanel].photo, up = uploads[selectedPanel];
  state.panels.forEach((p, i) => { p.photo = src; uploads[i] = up; });
  await loadAllPanels(); syncControls(); redraw();
  status.textContent = 'Same photo in every panel.';
});
bind('title', (e) => { state.title = e.target.value; redraw(); });
bind('subtitle', (e) => { state.subtitle = e.target.value; redraw(); });
bind('zoom', (e) => { state.panels[selectedPanel].zoom = Number(e.target.value); syncControls(); redraw(); });
bind('ox', (e) => { state.panels[selectedPanel].ox = Number(e.target.value); redraw(); });
bind('oy', (e) => { state.panels[selectedPanel].oy = Number(e.target.value); redraw(); });
document.getElementById('size').addEventListener('change', (e) => { exportSize = EXPORT_SIZES[Number(e.target.value)]; });
document.getElementById('export').addEventListener('click', async () => {
  await redraw();
  const out = renderExport(exportSize.w, exportSize.h, images, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${exportSize.w}x${exportSize.h}.png`;
    a.click();
    status.textContent = `Saved vice-nights-${exportSize.w}x${exportSize.h}.png`;
  }, 'image/png');
});

// Screenshot scenes (?shot=cover|editor) — see shots.js.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    state, images, canvas, syncControls, redraw, loadAllPanels, renderExport,
    setSize: (w, h) => { exportSize = { label: '', w, h }; },
  });
} else {
  (async () => { await loadAllPanels(); syncControls(); redraw(); })().catch(() => { /* startup must never leave an unhandled rejection */ });
}
