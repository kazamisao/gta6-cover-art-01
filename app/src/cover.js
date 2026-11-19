// Vice Nights cover renderer: multi-panel GTA VI-style key-art poster.
// Pure canvas drawing, no network. Layouts are fractions of the canvas so
// the same state renders at 1080x1080, 1080x1350 or 1920x1080.
export const LAYOUTS = ['hero', 'diagonal2', 'triptych', 'grid4'];
export const PRESETS = {
  sunset: { name: 'Vice City Sunset', sky: ['#ff9a3d', '#ff2e88', '#7b1fa2'], band: '#1a0b2e', accent: '#ffd166', title: '#ffffff' },
  neon: { name: 'Neon Nights', sky: ['#00e5ff', '#ff2ec4', '#5b2ee5'], band: '#0b1030', accent: '#00e5ff', title: '#ffffff' },
  dusk: { name: 'Palm Dusk', sky: ['#2de2c5', '#7b5cff', '#ff5c8a'], band: '#12082e', accent: '#2de2c5', title: '#fff7e6' },
};

function panelRects(layout, w, h) {
  const g = Math.max(6, Math.round(w * 0.008));
  switch (layout) {
    case 'diagonal2': return [
      { x: 0, y: 0, w, h, diag: 'left' },
      { x: 0, y: 0, w, h, diag: 'right' },
    ];
    case 'triptych': return [
      { x: 0, y: 0, w: Math.round(w * 0.58) - g, h },
      { x: Math.round(w * 0.58), y: 0, w: w - Math.round(w * 0.58), h: Math.round(h * 0.5) - g },
      { x: Math.round(w * 0.58), y: Math.round(h * 0.5), w: w - Math.round(w * 0.58), h: h - Math.round(h * 0.5) },
    ];
    case 'grid4': {
      const hw = Math.round(w / 2) - g, hh = Math.round(h / 2) - g;
      return [
        { x: 0, y: 0, w: hw, h: hh }, { x: hw + g * 2, y: 0, w: hw, h: hh },
        { x: 0, y: hh + g * 2, w: hw, h: hh }, { x: hw + g * 2, y: hh + g * 2, w: hw, h: hh },
      ];
    }
    default: return [{ x: 0, y: 0, w, h }];
  }
}

function drawPhoto(ctx, img, rect, panel) {
  if (!img) return;
  const zoom = panel?.zoom ?? 1;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale, ph = img.naturalHeight * scale;
  const ox = (panel?.ox ?? 0) * rect.w * 0.4, oy = (panel?.oy ?? 0) * rect.h * 0.4;
  ctx.save();
  ctx.beginPath();
  if (rect.diag === 'left') {
    ctx.moveTo(rect.x, rect.y); ctx.lineTo(rect.x + rect.w * 0.62, rect.y);
    ctx.lineTo(rect.x + rect.w * 0.38, rect.y + rect.h); ctx.lineTo(rect.x, rect.y + rect.h);
  } else if (rect.diag === 'right') {
    ctx.moveTo(rect.x + rect.w * 0.62, rect.y); ctx.lineTo(rect.x + rect.w, rect.y);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h); ctx.lineTo(rect.x + rect.w * 0.38, rect.y + rect.h);
  } else ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
  ctx.restore();
  if (rect.diag) { // white diagonal seam
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(5, rect.w * 0.008);
    ctx.beginPath(); ctx.moveTo(rect.x + rect.w * 0.62, rect.y); ctx.lineTo(rect.x + rect.w * 0.38, rect.y + rect.h); ctx.stroke(); ctx.restore();
  }
}

// state: { layout, preset, title, subtitle, panels: [{zoom,ox,oy}] }
// images: array of HTMLImageElement|null, one per panel slot.
export function drawCover(canvas, images, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const p = PRESETS[state.preset] || PRESETS.sunset;
  const u = w / 1080;
  ctx.fillStyle = '#14081f'; ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((r, i) => drawPhoto(ctx, images[i], r, state.panels[i]));
  // Grade: warm sky wash + vignette, clipped to the whole poster.
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, p.sky[0] + '33'); wash.addColorStop(0.55, p.sky[1] + '22'); wash.addColorStop(1, p.sky[2] + '44');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.3, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(10,0,20,0.45)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
  // (No sun disc: a glow orb kept landing on faces in the sample photos.)
  // Title band.
  const bandH = h * 0.26;
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, p.band + '00'); band.addColorStop(0.45, p.band + 'd9'); band.addColorStop(1, p.band);
  ctx.fillStyle = band; ctx.fillRect(0, h - bandH, w, bandH);
  ctx.fillStyle = p.accent; ctx.fillRect(w * 0.06, h - bandH + h * 0.045, w * 0.16, Math.max(4, 5 * u));
  // Big condensed title (vendored Anton, OFL).
  const title = (state.title || 'VICE NIGHTS').trim().toUpperCase();
  let size = h * 0.115;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const fit = () => { ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`; return ctx.measureText(title).width; };
  while (fit() > w * 0.88 && size > 20) size -= 2;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.lineWidth = Math.max(3, size * 0.06); ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeText(title, w * 0.06, h - h * 0.085);
  ctx.fillStyle = p.title; ctx.fillText(title, w * 0.06, h - h * 0.085);
  // Subtitle, letterspaced — shrink to fit like the title.
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const spaced = sub.split('').join('\u2009');
    let ss = Math.max(13, h * 0.026);
    const subFit = () => { ctx.font = `700 ${ss}px system-ui, sans-serif`; return ctx.measureText(spaced).width; };
    while (subFit() > w * 0.88 && ss > 10) ss -= 1;
    ctx.font = `700 ${ss}px system-ui, sans-serif`;
    ctx.fillStyle = p.accent;
    ctx.fillText(spaced, w * 0.06, h - h * 0.028);
  }
}

// Renders the poster at an export size and returns the canvas.
export function renderExport(w, h, images, state) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawCover(c, images, state);
  return c;
}
