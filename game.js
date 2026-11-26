// Pato Ataque - mire com o mouse e clique para acertar os patos que saem dos arbustos.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const WATER_Y = 300;

const DUCK_COLORS = [
  { body: '#f2c230', wing: '#d9a516', beak: '#f08a1c' }, // amarelo
  { body: '#8b5a2b', wing: '#6b4220', beak: '#f08a1c' }, // marrom
  { body: '#ffffff', wing: '#dcdcdc', beak: '#f08a1c' }, // branco
  { body: '#e8579a', wing: '#c63d7e', beak: '#f2c230' }, // rosa
  { body: '#4aa3e8', wing: '#2f7fbf', beak: '#f2c230' }, // azul
  { body: '#3fbf6a', wing: '#2a9650', beak: '#f2c230' }, // verde
  { body: '#9b59d6', wing: '#7a3fb0', beak: '#f2c230' }, // roxo
  { body: '#e8473a', wing: '#bf2f25', beak: '#f2c230' }, // vermelho
  { body: '#f08a1c', wing: '#c96d0c', beak: '#f2c230' }, // laranja
  { body: '#2b2b33', wing: '#1a1a20', beak: '#f08a1c' }, // preto
];

// Arbustos (de onde os patos saem)
const bushes = [];
for (let i = 0; i < 5; i++) {
  bushes.push({ x: 90 + i * 195, y: 400 + (i % 2) * 30, r: 70 + (i * 13) % 20 });
}

let ducks = [], particles = [], floaters = [];
let score = 0, misses = 0, ammo = 6, lives = 5, time = 0;
let spawnTimer = 0, gameOver = false, best = Number(localStorage.getItem('patoBest') || 0);
const mouse = { x: W / 2, y: H / 2 };
let flash = 0, reloadTimer = 0;

function rand(a, b) { return a + Math.random() * (b - a); }

function spawnDuck() {
  const bush = bushes[Math.floor(Math.random() * bushes.length)];
  const color = DUCK_COLORS[Math.floor(Math.random() * DUCK_COLORS.length)];
  const level = 1 + score / 1500;
  const dir = Math.random() < 0.5 ? -1 : 1;
  ducks.push({
    x: bush.x, y: bush.y - 10,
    vx: dir * rand(60, 130) * Math.min(level, 2.2),
    vy: -rand(220, 340),
    color, dir, bush, size: rand(0.8, 1.25),
    state: 'rising', t: 0, flap: Math.random() * 6,
  });
}

function addBurst(x, y, color) {
  for (let i = 0; i < 14; i++) {
    particles.push({ x, y, vx: rand(-200, 200), vy: rand(-250, 50), life: rand(0.4, 0.9), color, r: rand(2, 5) });
  }
}

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * W / r.width;
  mouse.y = (e.clientY - r.top) * H / r.height;
});

canvas.addEventListener('mousedown', () => {
  if (gameOver) { reset(); return; }
  if (reloadTimer > 0) return;
  if (ammo <= 0) { reloadTimer = 1; return; }
  ammo--; flash = 0.08;
  let hit = false;
  // acerta o pato mais da frente (ultimo desenhado)
  for (let i = ducks.length - 1; i >= 0; i--) {
    const d = ducks[i];
    if (d.state === 'dead') continue;
    const dx = mouse.x - d.x, dy = mouse.y - (d.y - 10 * d.size);
    if (dx * dx + dy * dy < (28 * d.size) ** 2) {
      d.state = 'dead'; d.vy = -120; d.vx *= 0.3;
      const pts = Math.round(100 * (1.4 - d.size / 2) + (d.state === 'dead' ? 50 : 0));
      score += pts; hit = true;
      floaters.push({ x: d.x, y: d.y - 30, text: '+' + pts, life: 0.9 });
      addBurst(d.x, d.y, d.color.body);
      break;
    }
  }
  if (!hit) { addBurst(mouse.x, mouse.y, '#ffffff'); }
  if (ammo === 0) reloadTimer = 1;
});

addEventListener('keydown', e => { if (e.key === 'r' && !gameOver) reloadTimer = reloadTimer || 0.6; });

function reset() {
  ducks = []; particles = []; floaters = [];
  score = 0; ammo = 6; lives = 5; spawnTimer = 0; gameOver = false; reloadTimer = 0;
}

function update(dt) {
  time += dt;
  if (flash > 0) flash -= dt;
  if (reloadTimer > 0) { reloadTimer -= dt; if (reloadTimer <= 0) { ammo = 6; reloadTimer = 0; } }
  if (gameOver) return;

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnDuck();
    spawnTimer = Math.max(0.5, rand(0.8, 1.6) - score / 6000);
  }

  for (const d of ducks) {
    d.t += dt; d.flap += dt * 14;
    if (d.state === 'dead') {
      d.vy += 900 * dt; d.y += d.vy * dt; d.x += d.vx * dt;
      continue;
    }
    d.vy += 260 * dt; // gravidade leve
    if (d.state === 'rising' && d.vy > 0) d.state = 'flying';
    if (d.state === 'flying') {
      d.vy = Math.sin(d.t * 3 + d.flap) * 20 - 40; // plana e sobe devagar
    }
    d.x += d.vx * dt; d.y += d.vy * dt;
    if (d.x < -60 || d.x > W + 60 || d.y < -60) {
      d.gone = true; lives--;
      if (lives <= 0) { gameOver = true; best = Math.max(best, score); localStorage.setItem('patoBest', best); }
    }
  }
  ducks = ducks.filter(d => !d.gone && d.y < H + 80);

  for (const p of particles) { p.life -= dt; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  particles = particles.filter(p => p.life > 0);
  for (const f of floaters) { f.life -= dt; f.y -= 40 * dt; }
  floaters = floaters.filter(f => f.life > 0);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y);
  sky.addColorStop(0, '#7ec8f2'); sky.addColorStop(1, '#d6f0fb');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, WATER_Y);
  // sol
  ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.arc(820, 90, 44, 0, 7); ctx.fill();
  // nuvens
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 290 + time * 8) % (W + 200)) - 100, cy = 60 + i * 38;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.arc(cx + 26, cy + 6, 28, 0, 7); ctx.arc(cx + 54, cy, 22, 0, 7); ctx.fill();
  }
  // colinas
  ctx.fillStyle = '#6aa86a';
  ctx.beginPath(); ctx.moveTo(0, WATER_Y);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, WATER_Y - 40 - Math.sin(x * 0.012) * 25);
  ctx.lineTo(W, WATER_Y); ctx.fill();
  // lago
  const lake = ctx.createLinearGradient(0, WATER_Y, 0, H);
  lake.addColorStop(0, '#3f9fd1'); lake.addColorStop(1, '#1d6fa5');
  ctx.fillStyle = lake; ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const y = WATER_Y + 20 + i * 22, off = (time * 20 * (1 + i % 3 * 0.3) + i * 70) % 160;
    for (let x = -160 + off; x < W; x += 160) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 5, x + 40, y); ctx.stroke();
    }
  }
}

function drawBush(b, front) {
  ctx.save();
  ctx.fillStyle = front ? '#2f8a3a' : '#256e30';
  const blobs = [[-0.6, 0.1, 0.7], [0, -0.2, 0.9], [0.6, 0.1, 0.7], [-0.25, 0.35, 0.6], [0.3, 0.35, 0.6]];
  for (const [ox, oy, s] of blobs) {
    ctx.beginPath(); ctx.arc(b.x + ox * b.r, b.y + oy * b.r, b.r * s * 0.8, 0, 7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.arc(b.x - 0.2 * b.r, b.y - 0.35 * b.r, b.r * 0.4, 0, 7); ctx.fill();
  ctx.restore();
}

function drawDuck(d) {
  const s = d.size, c = d.color;
  ctx.save();
  ctx.translate(d.x, d.y);
  const face = d.vx >= 0 ? 1 : -1;
  ctx.scale(face * s, d.state === 'dead' ? -s : s);
  // corpo
  ctx.fillStyle = c.body;
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 17, 0, 0, 7); ctx.fill();
  // cabeca
  ctx.beginPath(); ctx.arc(22, -16, 12, 0, 7); ctx.fill();
  // bico
  ctx.fillStyle = c.beak;
  ctx.beginPath(); ctx.moveTo(31, -17); ctx.lineTo(44, -13); ctx.lineTo(31, -10); ctx.fill();
  // olho
  ctx.fillStyle = d.state === 'dead' ? '#c00' : '#000';
  ctx.beginPath(); ctx.arc(25, -19, 2.4, 0, 7); ctx.fill();
  // asa batendo
  const flap = d.state === 'dead' ? 0.2 : Math.sin(d.flap);
  ctx.fillStyle = c.wing;
  ctx.beginPath(); ctx.ellipse(-4, -4 - flap * 6, 16, 9 + Math.abs(flap) * 8, -0.4 - flap * 0.6, 0, 7); ctx.fill();
  // cauda
  ctx.beginPath(); ctx.moveTo(-22, -4); ctx.lineTo(-38, -12); ctx.lineTo(-24, 6); ctx.fill();
  ctx.restore();
}

function drawCrosshair() {
  const { x, y } = mouse;
  ctx.save();
  ctx.strokeStyle = flash > 0 ? '#fff' : '#ff2a2a'; ctx.lineWidth = 3;
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 32, y); ctx.lineTo(x - 8, y); ctx.moveTo(x + 8, y); ctx.lineTo(x + 32, y);
  ctx.moveTo(x, y - 32); ctx.lineTo(x, y - 8); ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 32);
  ctx.stroke();
  ctx.fillStyle = '#ff2a2a'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill();
  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#fff';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.textAlign = 'left'; ctx.fillText('Pontos: ' + score, 18, 36);
  ctx.font = '18px sans-serif'; ctx.fillText('Recorde: ' + best, 18, 62);
  ctx.textAlign = 'right'; ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Vidas: ' + '❤'.repeat(Math.max(lives, 0)), W - 18, 36);
  // municao
  ctx.textAlign = 'center'; ctx.font = '20px sans-serif';
  if (reloadTimer > 0) ctx.fillText('Recarregando...', W / 2, H - 20);
  else { ctx.fillStyle = '#ffd84a'; ctx.fillText('●'.repeat(ammo) + '○'.repeat(6 - ammo), W / 2, H - 20); }
  ctx.restore();
  for (const f of floaters) {
    ctx.save(); ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.font = 'bold 56px sans-serif'; ctx.fillText('Fim de jogo', W / 2, H / 2 - 30);
  ctx.font = '28px sans-serif'; ctx.fillText('Pontos: ' + score + '   Recorde: ' + best, W / 2, H / 2 + 20);
  ctx.font = '22px sans-serif'; ctx.fillText('Clique para jogar de novo', W / 2, H / 2 + 65);
  ctx.restore();
}

function draw() {
  drawBackground();
  // patos que ainda estao "atras" do arbusto (subindo) sao desenhados antes do arbusto
  const behind = ducks.filter(d => d.state === 'rising' && d.y > d.bush.y - d.bush.r * 0.9);
  const front = ducks.filter(d => !behind.includes(d));
  behind.forEach(drawDuck);
  bushes.forEach(b => drawBush(b, true));
  front.forEach(drawDuck);
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.5); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawHUD();
  if (gameOver) drawGameOver();
  drawCrosshair();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
