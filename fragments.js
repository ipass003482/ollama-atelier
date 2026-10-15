import { works } from './works.js';

const canvas = document.querySelector('#fragments');
const ctx = canvas.getContext('2d');
const dialog = document.querySelector('#work-dialog');
const pauseButton = document.querySelector('#pause');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const images = works.map(work => { const image = new Image(); image.src = work.imageUrl; return image; });
let width = 0, height = 0, pieces = [], last = 0, emission = 0, serial = 0;
let paused = reducedMotion.matches;
const pointer = { x: -1000, y: -1000 };
const random = (min, max) => min + Math.random() * (max - min);

function resize() {
  width = innerWidth; height = document.querySelector('.atelier').clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * dpr; canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pieces = [];
  for (let i = 0; i < 42; i++) spawn(true);
}

function spawn(prefill = false) {
  const mobile = width < 700;
  const side = Math.random() > .5 ? 1 : -1;
  const size = random(mobile ? 20 : 26, mobile ? 48 : 78);
  pieces.push({ work: serial++ % works.length, x: width * .5 + side * random(width * .13, width * .4), y: prefill ? random(height * .24, height * .77) : -90,
    vx: random(-13, 13), vy: random(27, 62), size, aspect: random(.6, 1.25), rotation: random(-Math.PI, Math.PI), spin: random(-.5, .5), phase: random(0, 6.28), age: 0, depth: random(.4, 1), cropX: random(0, .65), cropY: random(0, .65) });
  if (pieces.length > 100) pieces.shift();
}

function openWork(index) {
  const work = works[index];
  document.querySelector('#detail-image').src = work.imageUrl;
  document.querySelector('#detail-image').alt = work.imageCredit;
  document.querySelector('#detail-title').textContent = work.title;
  document.querySelector('#detail-category').textContent = `${work.id} / ${work.category}`;
  document.querySelector('#detail-subtitle').textContent = work.subtitle;
  document.querySelector('#detail-description').textContent = work.description;
  const links = document.querySelector('#detail-links'); links.replaceChildren();
  for (const [url, label] of [[work.websiteUrl, '開啟網站 ↗'], [work.repositoryUrl, 'GitHub ↗']]) {
    if (!url) continue;
    const link = document.createElement('a'); link.href = url; link.textContent = label; link.target = '_blank'; link.rel = 'noopener noreferrer'; links.append(link);
  }
  dialog.showModal();
}

works.forEach((work, index) => {
  const button = document.createElement('button'); button.className = 'work-chip'; button.setAttribute('aria-label', `查看${work.title}`);
  const image = document.createElement('img'); image.src = work.imageUrl; image.alt = '';
  const copy = document.createElement('span'); copy.className = 'chip-copy';
  const number = document.createElement('small'); number.textContent = work.id;
  const title = document.createElement('strong'); title.textContent = work.title;
  copy.append(number, title); button.append(image, copy); button.addEventListener('click', () => openWork(index));
  document.querySelector('#work-dock').append(button);
});
document.querySelector('#work-total').textContent = `${String(works.length).padStart(2, '0')} WORKS`;
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
function updatePause() {
  document.body.classList.toggle('paused', paused);
  pauseButton.setAttribute('aria-pressed', String(paused)); pauseButton.setAttribute('aria-label', paused ? '繼續掉落' : '暫停掉落'); pauseButton.textContent = paused ? '▷' : 'Ⅱ';
  document.querySelector('#motion-status').textContent = paused ? '○   AT REST' : '●   IN MOTION';
}
pauseButton.addEventListener('click', () => { paused = !paused; updatePause(); });
reducedMotion.addEventListener('change', event => { paused = event.matches; updatePause(); });
document.querySelector('#burst').addEventListener('click', () => { for (let i = 0; i < 18; i++) spawn(paused); });
document.querySelector('#reset').addEventListener('click', resize);
canvas.addEventListener('pointermove', event => { const r = canvas.getBoundingClientRect(); pointer.x = event.clientX - r.left; pointer.y = event.clientY - r.top; });
canvas.addEventListener('pointerleave', () => { pointer.x = -1000; pointer.y = -1000; });
canvas.addEventListener('click', event => {
  const r = canvas.getBoundingClientRect();
  const hit = [...pieces].reverse().find(p => Math.hypot(p.x - (event.clientX - r.left), p.y - (event.clientY - r.top)) < p.size * .65);
  if (hit) openWork(hit.work);
});

function frame(time) {
  const dt = Math.min((time - last) / 1000 || 0, .04); last = time;
  const moving = !paused && !dialog.open && !document.hidden;
  if (moving) { emission += dt; if (emission > .42) { spawn(); emission = 0; } }
  ctx.clearRect(0, 0, width, height);
  for (const p of pieces) {
    if (moving) {
      p.age += dt; p.y += p.vy * dt; p.x += (p.vx + Math.sin(p.age * .7 + p.phase) * 9) * dt; p.rotation += p.spin * dt;
      const dx = p.x - pointer.x, dy = p.y - pointer.y, distance = Math.hypot(dx, dy);
      if (distance > 1 && distance < 100) { p.x += dx / distance * (100 - distance) * dt; p.y += dy / distance * (100 - distance) * dt; }
    }
    const fade = Math.min(1, Math.max(0, (height * .82 - p.y) / 100));
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.scale(.48 + Math.abs(Math.cos(p.age * .55 + p.phase)) * .52, 1);
    ctx.globalAlpha = fade * (.38 + p.depth * .6); ctx.shadowColor = '#0008'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
    const s = p.size, h = s * p.aspect;
    ctx.beginPath(); ctx.moveTo(-s / 2, -h / 2); ctx.lineTo(s * .38, -h * .46); ctx.lineTo(s / 2, h * .36); ctx.lineTo(-s * .4, h / 2); ctx.closePath();
    ctx.fillStyle = works[p.work].color; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.save(); ctx.clip(); const image = images[p.work];
    if (image.complete && image.naturalWidth) {
      ctx.drawImage(image, image.naturalWidth * p.cropX, image.naturalHeight * p.cropY, image.naturalWidth * .35, image.naturalHeight * .35, -s / 2, -h / 2, s, h);
      ctx.fillStyle = '#b7d6ea16'; ctx.fillRect(-s / 2, -h / 2, s, h);
    }
    ctx.restore(); ctx.strokeStyle = '#e2d4c966'; ctx.lineWidth = .7; ctx.stroke(); ctx.restore();
  }
  pieces = pieces.filter(p => p.y < height * .84);
  requestAnimationFrame(frame);
}
addEventListener('resize', resize); resize(); updatePause(); requestAnimationFrame(frame);
