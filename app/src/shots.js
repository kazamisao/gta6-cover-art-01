// Fixed scenes for screenshots, driven by query params:
//   ?shot=cover&layout=triptych&preset=sunset&photos=pier,boulevard,pier&title=Vice%20Nights&subtitle=A%20heist%20in%20the%20sun&w=1080&h=1080
//   ?shot=editor&layout=diagonal2&preset=neon&photos=pier,pier&title=Neon%20Run
// shot=cover renders the poster with the app's own export function at the
// requested size and shows it full-screen; shot=editor shows the editor
// with the sample photos loaded. window.__shotReady is set once painted.
export async function runShot(shot, query, app) {
  const { state } = app;
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('preset')) state.preset = query.get('preset');
  if (query.get('title')) { state.title = query.get('title'); document.getElementById('title').value = state.title; }
  if (query.get('subtitle')) { state.subtitle = query.get('subtitle'); document.getElementById('subtitle').value = state.subtitle; }
  const photos = (query.get('photos') || '').split(',').filter(Boolean);
  photos.forEach((ph, i) => { if (state.panels[i]) state.panels[i].photo = ph; });
  await app.loadAllPanels();
  app.syncControls();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Number(query.get('w') || 1080), h = Number(query.get('h') || 1080);
    const out = app.renderExport(w, h, app.images, state);
    const ctx = app.canvas.getContext('2d');
    app.canvas.width = w; app.canvas.height = h;
    ctx.drawImage(out, 0, 0);
    window.__exportW = w; window.__exportH = h;
  } else {
    await app.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
