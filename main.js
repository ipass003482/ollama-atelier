import { works } from './works.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (a, b, p) => a + (b - a) * p;
const smooth = (a, b, v) => { const p = clamp((v - a) / (b - a), 0, 1); return p * p * (3 - 2 * p); };
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let motionOverride;
try { motionOverride = localStorage.getItem('ollama-motion'); } catch { /* Optional storage. */ }
let reducedMotion = motionOverride ? motionOverride === 'reduce' : motionQuery.matches;
let engine, progress = 0, featuredIndex = 0, freeMode = false, pendingFocus = false, sceneUnavailable = false, journeyInView = true;
let dialogOpener, savedBodyOverflow, savedFreeScroll = 0, scrollLocked = false;
const dialog = $('work-dialog');
const gsap = window.gsap;
const announce = (message) => { $('announcement').textContent = message; };

// Initialize the accessible collection before loading the 3D engine.
for (const [index, work] of works.entries()) {
  const button = document.createElement('button');
  button.className = 'work-row'; button.dataset.work = index;
  button.setAttribute('aria-label', `查看作品 ${work.id}：${work.title}`);
  button.innerHTML = `<span class="row-image"><img loading="lazy" decoding="async" src="${work.imageUrl}" alt="${work.title}" style="background:${work.color}"></span><span class="row-copy"><span class="row-number">${work.id} / ${work.year}</span><span class="row-title">${work.title}</span><span class="row-subtitle">${work.subtitle}</span><span class="row-category">${work.category}</span></span><span class="row-arrow" aria-hidden="true">↗</span>`;
  button.addEventListener('click', () => openWork(index)); $('work-list').append(button);
}
function lockScroll() {
  if (scrollLocked) return;
  savedBodyOverflow = document.body.style.overflow; scrollLocked = true;
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  if (!scrollLocked) return;
  document.body.style.overflow = freeMode ? 'hidden' : savedBodyOverflow === 'hidden' ? '' : savedBodyOverflow || '';
  scrollLocked = false;
}
function showWork() {
  pendingFocus = false;
  if (dialog.open) return;
  lockScroll(); dialog.showModal();
  if (gsap && !reducedMotion) gsap.fromTo(dialog, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .3, clearProps: 'transform' });
}
function openWork(index, tile) {
  if (dialog.open || pendingFocus) return;
  const work = works[index]; dialogOpener = document.activeElement;
  for (const [id, value] of Object.entries({ 'work-title': work.title, 'work-subtitle': work.subtitle, 'work-category': work.category, 'work-description': work.description, 'work-year': work.year, 'work-number': `${work.id} / 08` })) $(id).textContent = value;
  $('work-image').src = work.imageUrl; $('work-image').alt = `${work.title} — ${work.subtitle}`; $('work-image').style.background = work.color;
  if (tile && engine) { pendingFocus = true; lockScroll(); engine.focus(tile, showWork); } else showWork();
}
function closeWork() { if (dialog.open) dialog.close(); }
$('close-work').addEventListener('click', closeWork); $('return-gallery').addEventListener('click', closeWork);
dialog.addEventListener('click', (event) => {
  const r = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) closeWork();
});
dialog.addEventListener('close', () => { unlockScroll(); engine?.unfocus(); dialogOpener?.focus({ preventScroll: true }); });
function setFeaturedIndex(index) {
  featuredIndex = clamp(index, 0, works.length - 1);
  $('featured-count').textContent = `${String(featuredIndex + 1).padStart(2, '0')} / 08`;
  $('open-featured').setAttribute('aria-label', `查看作品：${works[featuredIndex].title}`);
  $('prev-work').disabled = featuredIndex === 0; $('next-work').disabled = featuredIndex === works.length - 1;
  $('gallery-area').setAttribute('aria-label', `精選作品：${works[featuredIndex].title}。左右方向鍵切換，Enter 查看。`);
}
function goToWork(index) {
  if (reducedMotion || !engine) { $('collection').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' }); return; }
  const p = .58 + clamp(index, 0, 7) / 7 * .39, journey = $('journey');
  window.scrollTo({ top: journey.getBoundingClientRect().top + scrollY + p * (journey.offsetHeight - innerHeight), behavior: reducedMotion ? 'instant' : 'smooth' });
}
$('enter-gallery').addEventListener('click', () => goToWork(0));
$('prev-work').addEventListener('click', () => goToWork(featuredIndex - 1));
$('next-work').addEventListener('click', () => goToWork(featuredIndex + 1));
$('open-featured').addEventListener('click', () => openWork(featuredIndex, engine?.featuredTile(featuredIndex)));
$('gallery-area').addEventListener('keydown', (event) => {
  if (dialog.open || pendingFocus) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); goToWork(featuredIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); goToWork(featuredIndex - 1); }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openWork(featuredIndex, engine?.featuredTile(featuredIndex)); }
});
function enterFree() {
  if (!engine || freeMode || dialog.open || pendingFocus) return;
  savedFreeScroll = scrollY; freeMode = true;
  document.body.append($('render-surface')); document.body.classList.add('is-free'); document.body.style.overflow = 'hidden';
  document.querySelector('main').inert = true; document.querySelector('.site-header').inert = true;
  $('free-panel').hidden = false; $('render-surface').style.opacity = 1; engine.setFree(true);
  $('free-gallery-area').focus({ preventScroll: true }); announce('自由探索已開啟。拖曳移動，滾輪或雙指縮放，點選作品查看。');
}
function exitFree() {
  if (!freeMode) return;
  if (dialog.open) closeWork(); pendingFocus = false; freeMode = false; unlockScroll(); engine.setFree(false);
  document.body.classList.remove('is-free'); document.body.style.overflow = ''; $('free-panel').hidden = true;
  document.querySelector('main').inert = false; document.querySelector('.site-header').inert = false;
  $('stage').append($('render-surface')); window.scrollTo({ top: savedFreeScroll, behavior: 'instant' });
  $('free-mode').focus({ preventScroll: true }); updateJourney();
}
$('free-mode').addEventListener('click', enterFree); $('exit-free').addEventListener('click', exitFree);
$('zoom-in').addEventListener('click', () => engine?.zoom(.82)); $('zoom-out').addEventListener('click', () => engine?.zoom(1.2)); $('reset-view').addEventListener('click', () => engine?.reset());
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || dialog.open) return;
  if (pendingFocus) { pendingFocus = false; unlockScroll(); engine?.unfocus(); } else if (freeMode) exitFree();
});
function applyMotionPreference() {
  document.body.classList.toggle('reduced-motion', reducedMotion);
  document.documentElement.style.scrollBehavior = reducedMotion ? 'auto' : '';
  $('motion-toggle').setAttribute('aria-pressed', String(reducedMotion));
  $('motion-toggle').setAttribute('aria-label', reducedMotion ? '開啟場景動畫' : '減少場景動畫');
  $('motion-toggle').title = reducedMotion ? '開啟場景動畫' : '減少場景動畫';
  $('motion-toggle').querySelector('span').textContent = reducedMotion ? '▷' : 'Ⅱ';
  window.ScrollTrigger?.refresh(); updateJourney();
}
$('motion-toggle').addEventListener('click', () => {
  reducedMotion = !reducedMotion; motionOverride = reducedMotion ? 'reduce' : 'full';
  try { localStorage.setItem('ollama-motion', motionOverride); } catch { /* Optional. */ }
  applyMotionPreference();
});
motionQuery.addEventListener('change', (event) => { if (!motionOverride) { reducedMotion = event.matches; applyMotionPreference(); } });
function updateJourney() {
  const journey = $('journey'), bounds = journey.getBoundingClientRect(); journeyInView = bounds.bottom > 0 && bounds.top < innerHeight;
  progress = reducedMotion || sceneUnavailable ? 0 : clamp(-bounds.top / Math.max(1, journey.offsetHeight - innerHeight), 0, 1);
  const reveal = reducedMotion || !engine ? 0 : smooth(.38, .54, progress), heroFade = 1 - smooth(.03, .22, progress);
  $('hero-copy').style.opacity = heroFade; $('hero-copy').style.transform = `translateY(${-progress * 65}px)`; $('hero-copy').inert = heroFade < .2 || freeMode;
  $('hero-guide').style.opacity = 1 - smooth(.23, .43, progress); $('hero-guide').style.transform = `translate(${progress * 25}%, ${progress * 8}%) scale(${1 + progress * .5})`;
  $('museum-backdrop').style.transform = `scale(${1 + progress * .22}) translateX(${-progress * 2}%)`;
  $('featured-view').style.opacity = reveal; $('featured-view').style.pointerEvents = reveal > .9 && !freeMode ? 'auto' : 'none';
  $('featured-view').setAttribute('aria-hidden', String(reveal < .9 || freeMode)); $('featured-view').inert = reveal < .9 || freeMode;
  $('render-surface').style.opacity = freeMode ? 1 : reveal; $('stage').style.setProperty('--gallery-shade', reveal * .68);
  $('progress-fill').style.transform = `scaleX(${progress})`;
  $('chapter-label').textContent = progress < .38 ? '01 — 出發 / DEPARTURE' : '02 — 靈感窗口 / DISCOVER';
  $('scroll-cue').style.opacity = 1 - smooth(.02, .12, progress);
  if (!freeMode && !dialog.open && !pendingFocus) setFeaturedIndex(Math.round(clamp((progress - .58) / .39, 0, 1) * 7));
}
let scrollQueued = false;
window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { updateJourney(); scrollQueued = false; }); } }, { passive: true });
window.addEventListener('resize', updateJourney);
if (gsap && window.ScrollTrigger) { gsap.registerPlugin(window.ScrollTrigger); window.ScrollTrigger.create({ trigger: '#journey', start: 'top top', end: 'bottom bottom', onUpdate: updateJourney }); }
setFeaturedIndex(0); applyMotionPreference();
let pointerX = 0, pointerY = 0;
window.addEventListener('pointermove', (event) => { pointerX = event.clientX / innerWidth * 2 - 1; pointerY = event.clientY / innerHeight * 2 - 1; }, { passive: true });

async function init() {
  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.setClearColor(0x101626, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true'); $('render-surface').append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 180);
  const target = new THREE.Vector3();
  const HOME = { x: .3, y: .2, z: 13.6 }, desired = { ...HOME };
  const MIN_Z = 7.4, MAX_Z = 23, STEP_X = 4.8, STEP_Y = 4.15;
  const velocity = new THREE.Vector2(), pointer = new THREE.Vector2(9, 9), raycaster = new THREE.Raycaster();
  let cameraTween, savedPose, focusing = false, returning = false, hover, hoverDirty = false, elapsed = 0, lastTime = 0, suspended = false;
  const featuredGroup = new THREE.Group(), freeGroup = new THREE.Group(); scene.add(featuredGroup, freeGroup); freeGroup.visible = false;
  scene.add(new THREE.HemisphereLight(0xdaf5ff, 0x34405d, 2.6));
  const key = new THREE.DirectionalLight(0xf9f5ee, 3.8); key.position.set(-6, 8, 10); scene.add(key);
  const blue = new THREE.PointLight(0x87caff, 35, 50); blue.position.set(7, 3, 5); scene.add(blue);
  const hoverLight = new THREE.PointLight(0xc7f0ff, 0, 8); scene.add(hoverLight);
  const width = 3.55, height = 2.43;
  const imageGeometry = new THREE.PlaneGeometry(width, height), frameGeometry = new THREE.BoxGeometry(width + .14, height + .14, .095);
  const edgeGeometry = new THREE.BoxGeometry(width + .25, height + .25, .065), labelGeometry = new THREE.PlaneGeometry(width + .2, .7);
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f1ed, metalness: .34, roughness: .38 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x77929f, metalness: .72, roughness: .27 });
  const content = [];
  function artTexture(work, image) {
    const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 660; const ctx = canvas.getContext('2d');
    ctx.fillStyle = work.color; ctx.fillRect(0, 0, 960, 660);
    if (image) { const r = Math.max(960 / image.width, 660 / image.height); ctx.drawImage(image, (960 - image.width * r) / 2, (660 - image.height * r) / 2, image.width * r, image.height * r); }
    else {
      const g = ctx.createLinearGradient(0, 0, 960, 660); g.addColorStop(0, '#c6d2d780'); g.addColorStop(1, '#101626c0'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 660);
      ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(480, 400 + i * 7, 150 + i * 50, 90 + i * 25, -.5, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#ffffffaa'; ctx.font = '20px sans-serif'; ctx.fillText(`STUDY ${work.id}`, 42, 60);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8); return texture;
  }
  function labelTexture(work) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 192; const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center'; ctx.fillStyle = '#f6f3ea'; ctx.font = '500 47px "Noto Sans TC", sans-serif'; ctx.fillText(work.title, 512, 65);
    ctx.fillStyle = '#bbd3df'; ctx.font = '22px sans-serif'; ctx.fillText(`${work.id}  /  ${work.subtitle.toUpperCase()}`, 512, 118);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }
  works.forEach((work) => content.push({ image: new THREE.MeshBasicMaterial({ map: artTexture(work), toneMapped: false }), label: new THREE.MeshBasicMaterial({ map: labelTexture(work), transparent: true, depthWrite: false, toneMapped: false }) }));
  function makeTile(index, parent) {
    const group = new THREE.Group(), edge = new THREE.Mesh(edgeGeometry, edgeMaterial); edge.position.z = -.04; group.add(edge);
    group.add(new THREE.Mesh(frameGeometry, frameMaterial));
    const picture = new THREE.Mesh(imageGeometry, content[index].image); picture.position.z = .053; group.add(picture);
    const label = new THREE.Mesh(labelGeometry, content[index].label); label.position.set(0, -height / 2 - .49, .06); group.add(label);
    const tile = { group, picture, label, index, cellX: null, cellY: null }; picture.userData.tile = tile; parent.add(group); return tile;
  }
  const featured = works.map((_, i) => makeTile(i, featuredGroup)), tiles = [];
  let poolColumns = 0, poolRows = 0;
  const mod = (n, d) => ((n % d) + d) % d;
  function sizePool() {
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * MAX_Z;
    poolColumns = Math.ceil(h * camera.aspect / STEP_X) + 4; poolRows = Math.ceil(h / STEP_Y) + 4;
    const count = poolColumns * poolRows;
    while (tiles.length < count) tiles.push(makeTile(tiles.length % works.length, freeGroup));
    tiles.forEach((tile, i) => { tile.group.visible = i < count; tile.cellX = null; });
  }
  function recycle() {
    const ox = Math.floor(camera.position.x / STEP_X) - Math.floor(poolColumns / 2), oy = Math.floor(camera.position.y / STEP_Y) - Math.floor(poolRows / 2);
    for (let row = 0; row < poolRows; row++) for (let col = 0; col < poolColumns; col++) {
      const tile = tiles[row * poolColumns + col], x = ox + col, y = oy + row;
      if (tile.cellX === x && tile.cellY === y) continue;
      tile.cellX = x; tile.cellY = y; tile.index = mod(x + y * 3, works.length); tile.group.position.set(x * STEP_X, y * STEP_Y, 0);
      tile.picture.material = content[tile.index].image; tile.label.material = content[tile.index].label;
    }
  }
  function featuredDistance() { return Math.max(12.4, 5.3 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect)); }
  function positionFeatured(dt) {
    const scrollIndex = clamp((progress - .58) / .39, 0, 1) * 7, damp = reducedMotion ? 1 : 1 - Math.exp(-9 * dt);
    for (const [i, tile] of featured.entries()) {
      // Each floating window follows an original diagonal path through depth.
      const d = i - scrollIndex;
      tile.group.position.x = mix(tile.group.position.x, d * 4.65, damp);
      tile.group.position.y = mix(tile.group.position.y, -.15 + Math.sin(d * .9) * .46, damp);
      tile.group.position.z = mix(tile.group.position.z, -Math.abs(d) * 1.4 + (tile === hover ? .12 : 0), damp);
      tile.group.rotation.y = mix(tile.group.rotation.y, clamp(-d * .11, -.35, .35), damp); tile.group.visible = Math.abs(d) < 3.5;
    }
  }
  function stop() { velocity.set(0, 0); }
  function animatePose(pose, done) {
    cameraTween?.kill();
    if (!gsap || reducedMotion) { camera.position.set(pose.x, pose.y, pose.z); target.set(pose.tx, pose.ty, 0); done?.(); return; }
    const current = { x: camera.position.x, y: camera.position.y, z: camera.position.z, tx: target.x, ty: target.y };
    cameraTween = gsap.to(current, { ...pose, duration: .65, ease: 'power3.inOut', onUpdate: () => { camera.position.set(current.x, current.y, current.z); target.set(current.tx, current.ty, 0); }, onComplete: done });
  }
  function focus(tile, done) {
    stop(); clearPointers(); hover = null; savedPose = { x: camera.position.x, y: camera.position.y, z: camera.position.z, tx: target.x, ty: target.y }; focusing = true;
    if (freeMode) Object.assign(desired, { x: camera.position.x, y: camera.position.y, z: camera.position.z });
    const p = tile.group.position, distance = Math.max(7.2, 4.5 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    animatePose({ x: p.x, y: p.y, z: p.z + distance, tx: p.x, ty: p.y }, done);
  }
  function unfocus() {
    if (!savedPose) return; const pose = savedPose; savedPose = null; returning = true;
    animatePose(pose, () => { focusing = false; returning = false; });
  }
  function zoom(factor) { if (freeMode && !focusing) { stop(); desired.z = clamp(desired.z * factor, MIN_Z, MAX_Z); } }
  function reset() { if (!focusing) { stop(); Object.assign(desired, HOME); } }
  function setFree(value) {
    cameraTween?.kill(); savedPose = null; focusing = false; returning = false; clearPointers(); stop(); hover = null;
    featuredGroup.visible = !value; freeGroup.visible = value;
    if (value) { camera.position.set(desired.x, desired.y, desired.z); target.set(desired.x, desired.y, 0); recycle(); }
    else { camera.position.set(0, .2, featuredDistance()); target.set(0, 0, 0); }
    resize();
  }
  function setPointer(event) { pointer.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2); hoverDirty = true; }
  function hitTile(event) {
    if (event) setPointer(event); scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects((freeMode ? tiles : featured).filter((tile) => tile.group.visible).map((tile) => tile.picture), false)[0]?.object.userData.tile;
  }
  const pointers = new Map(); let dragStart, moved = false, pinched = false, pinchDistance = 0;
  function clearPointers() { pointers.clear(); dragStart = null; pinchDistance = 0; pinched = false; moved = false; }
  function unitsPerPixel() { return 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z / innerHeight; }
  function distanceBetweenPointers() { const a = [...pointers.values()]; return a.length > 1 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0; }
  const freeArea = $('free-gallery-area');
  freeArea.addEventListener('pointerdown', (event) => {
    if (!freeMode || focusing || dialog.open || event.button > 0) return;
    event.preventDefault(); freeArea.focus({ preventScroll: true }); freeArea.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, time: performance.now() }); stop(); hover = null;
    if (pointers.size === 1) { dragStart = { x: event.clientX, y: event.clientY }; moved = false; pinched = false; }
    if (pointers.size > 1) { pinched = true; moved = true; pinchDistance = distanceBetweenPointers(); }
    freeArea.classList.add('is-dragging');
  });
  freeArea.addEventListener('pointermove', (event) => {
    setPointer(event); const previous = pointers.get(event.pointerId); if (!previous || focusing) return;
    const now = performance.now(); pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, time: now });
    if (pointers.size > 1) { const distance = distanceBetweenPointers(); if (pinchDistance > 0) desired.z = clamp(desired.z * pinchDistance / distance, MIN_Z, MAX_Z); pinchDistance = distance; stop(); return; }
    const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
    if (dragStart && Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > 6) moved = true;
    if (moved) { const units = unitsPerPixel(), dt = Math.max(8, now - previous.time) / 1000; desired.x -= dx * units; desired.y += dy * units; velocity.set(clamp(-dx * units / dt, -25, 25), clamp(dy * units / dt, -25, 25)); }
  });
  function releasePointer(event, cancelled = false) {
    if (!pointers.has(event.pointerId)) return; pointers.delete(event.pointerId);
    if (pointers.size) { pinchDistance = 0; return; }
    freeArea.classList.remove('is-dragging');
    if (!moved && !pinched && !cancelled && !focusing) { const tile = hitTile(event); if (tile) openWork(tile.index, tile); }
    if (cancelled || reducedMotion || pinched) stop(); dragStart = null; pinched = false;
  }
  freeArea.addEventListener('pointerup', (e) => releasePointer(e)); freeArea.addEventListener('pointercancel', (e) => releasePointer(e, true)); freeArea.addEventListener('lostpointercapture', (e) => releasePointer(e, true));
  freeArea.addEventListener('wheel', (event) => { event.preventDefault(); zoom(Math.exp(clamp(event.deltaY, -150, 150) * .0015)); }, { passive: false });
  freeArea.addEventListener('keydown', (event) => {
    if (!freeMode || focusing || dialog.open) return;
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
    if (direction) { event.preventDefault(); stop(); desired.x += direction[0] * 1.5; desired.y += direction[1] * 1.5; }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(.82); }
    if (event.key === '-') { event.preventDefault(); zoom(1.2); }
    if (event.key === 'Home') { event.preventDefault(); reset(); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pointer.set(0, 0); const tile = hitTile() || tiles.filter((tile) => tile.group.visible).sort((a, b) => a.group.position.distanceToSquared(target) - b.group.position.distanceToSquared(target))[0]; if (tile) openWork(tile.index, tile); }
  });
  $('gallery-area').addEventListener('pointermove', setPointer);
  $('gallery-area').addEventListener('pointerleave', () => { pointer.set(9, 9); hoverDirty = true; });
  freeArea.addEventListener('pointerleave', () => { if (!pointers.size) { pointer.set(9, 9); hoverDirty = true; } });
  $('gallery-area').addEventListener('click', (event) => { if (!freeMode && !focusing && !dialog.open) { const tile = hitTile(event); if (tile) openWork(tile.index, tile); } });
  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); sizePool();
    if (!freeMode && !focusing) { camera.position.set(0, .2, featuredDistance()); target.set(0, 0, 0); }
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { suspended = document.hidden; stop(); lastTime = 0; });
  window.addEventListener('blur', () => { clearPointers(); stop(); freeArea.classList.remove('is-dragging'); });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault(); renderer.setAnimationLoop(null); if (freeMode) exitFree();
    pendingFocus = false; cameraTween?.kill(); unlockScroll();
    $('render-surface').hidden = true; $('free-mode').disabled = true; $('fallback').hidden = false; engine = null; sceneUnavailable = true;
    document.body.classList.add('scene-unavailable'); updateJourney(); announce('3D 場景暫時無法使用，作品集仍可正常瀏覽。');
  });
  function animate(time) {
    if (suspended) return; const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60; lastTime = time; elapsed += dt;
    $('hero-ollama').style.transform = !reducedMotion && !freeMode && progress < .43 ? `translate3d(${pointerX * 7}px,${Math.sin(elapsed * 1.8) * 5 + pointerY * 4}px,0) rotate(${pointerX * 1.8}deg)` : '';
    if ((dialog.open && !returning) || (!freeMode && (!journeyInView || progress < .35 || reducedMotion))) return;
    if (!focusing) {
      if (freeMode) {
        if (!pointers.size) { desired.x += velocity.x * dt; desired.y += velocity.y * dt; velocity.multiplyScalar(Math.exp(-5 * dt)); }
        const damp = reducedMotion ? 1 : 1 - Math.exp(-11 * dt);
        camera.position.x = mix(camera.position.x, desired.x, damp); camera.position.y = mix(camera.position.y, desired.y, damp); camera.position.z = mix(camera.position.z, desired.z, damp); target.set(camera.position.x, camera.position.y, 0); recycle();
      } else positionFeatured(dt);
    }
    camera.lookAt(target);
    if (hoverDirty && !pointers.size && !focusing) { hover = hitTile(); hoverDirty = false; }
    (freeMode ? freeArea : $('gallery-area')).classList.toggle('is-hovering', Boolean(hover));
    hoverLight.intensity = mix(hoverLight.intensity, hover && !focusing ? 9 : 0, 1 - Math.exp(-10 * dt));
    if (hover) hoverLight.position.copy(hover.group.position).add(new THREE.Vector3(0, .6, 1.4));
    for (const tile of (freeMode ? tiles : featured)) tile.group.scale.setScalar(mix(tile.group.scale.x, tile === hover && !focusing ? 1.025 : 1, 1 - Math.exp(-10 * dt)));
    $('zoom-level').textContent = `${Math.round(HOME.z / camera.position.z * 100)}%`;
    $('zoom-in').disabled = desired.z <= MIN_Z + .01 || focusing; $('zoom-out').disabled = desired.z >= MAX_Z - .01 || focusing;
    renderer.render(scene, camera);
  }
  resize(); featured.forEach((tile, i) => tile.group.position.set(i * 4.65, -.15, -i * 1.4));
  engine = { focus, unfocus, zoom, reset, setFree, featuredTile: (i) => featured[i] };
  renderer.setAnimationLoop(animate); $('loading').hidden = true; updateJourney();
  let failed = 0;
  works.forEach((work, i) => {
    const image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = () => { const old = content[i].image.map; content[i].image.map = artTexture(work, image); content[i].image.needsUpdate = true; old.dispose(); };
    image.onerror = () => { if (++failed === works.length) announce('照片暫時無法載入，先以色彩預覽呈現作品。'); }; image.src = work.imageUrl;
  });
  document.fonts.ready.then(() => content.forEach((entry, i) => { entry.label.map.dispose(); entry.label.map = labelTexture(works[i]); entry.label.needsUpdate = true; }));
}
init().catch((error) => {
  console.error('3D scene unavailable:', error); $('loading').hidden = true; $('fallback').hidden = false; $('free-mode').disabled = true;
  sceneUnavailable = true; document.body.classList.add('scene-unavailable');
  announce('3D 場景暫時無法使用，請往下瀏覽作品集。'); updateJourney();
});
