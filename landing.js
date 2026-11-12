const journey = document.querySelector('.journey');
const scene = document.querySelector('.scene');
const video = document.querySelector('.sensor-video');
const identity = scene.querySelector('.identity-group');
const framePulses = identity.querySelectorAll('.frame-pulse');
const miniIdentity = scene.querySelector('.mini-identity');
const openingTitle = titleDrawing(identity);
const miniTitle = titleDrawing(miniIdentity);
const pointerLight = document.querySelector('.pointer-light');
const stillPresentation = document.querySelector('.still-presentation');
const canvas = document.querySelector('.energy-lines');
const energy = canvas.getContext('2d');
const compactLayout = matchMedia('(max-aspect-ratio: 5/4), (max-height: 480px)');
// Positions measured in the clip as fractions of the visible frame.
const componentPoints = {
  chip: [[4.5, .487, .211]],
  connector: [[3, .357, .664], [3.5, .383, .713], [4, .422, .778], [4.5, .45, .817]],
};
const parts = Array.from(document.querySelectorAll('.part'), (element) => ({
  element,
  title: element.querySelector('h2'),
  description: element.querySelector('p'),
  time: Number(element.dataset.cue),
  points: componentPoints[element.dataset.part],
  kind: element.dataset.part,
}));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const frameDuration = 1 / 24;
const dissolveStart = .42;
const dissolveEnd = 2.55;
// Open strokes for L, D, 2, 4, 5 and 0. Coordinates are relative to each glyph.
const titleGlyphs = [
  [[[.12, 0], [.12, 1], [.93, 1]]],
  [[[.1, 1], [.1, 0], [.6, 0], [.93, .25], [.93, .75], [.6, 1], [.1, 1]]],
  [[[.1, .18], [.3, 0], [.71, 0], [.92, .2], [.92, .36], [.08, 1], [.95, 1]]],
  [[[.62, 0], [.04, .65], [.95, .65]], [[.73, .06], [.73, 1]]],
  [[[.9, 0], [.12, 0], [.12, .45], [.67, .45], [.92, .62], [.92, .82], [.7, 1], [.28, 1], [.08, .86]]],
  [[[.28, 0], [.72, 0], [.93, .21], [.93, .79], [.72, 1], [.28, 1], [.07, .79], [.07, .21], [.28, 0]]],
];
const particles = Array.from({ length: 72 }, (_, index) => {
  const random = (salt) => {
    const value = Math.sin((index + 1) * 71.7 + salt * 43.3) * 43758.5;
    return value - Math.floor(value);
  };
  return {
    x: index % 6 === 0 ? index % 12 / 6 : random(1),
    y: index % 3 === 0 ? index % 2 : random(2),
    drift: 22 + random(3) * 88,
    rise: 12 + random(4) * 64,
    size: .55 + random(5) * 1.55,
    phase: random(6) * Math.PI * 2,
  };
});

let active = false;
let mediaFailed = false;
let updateFrame = 0;
let energyFrame = 0;
let energyRoutes = [];
let energyPainted = false;
let titleDissolve = 0;
let titleBounds;
let miniOpacity = 0;
let lastScrollY = window.scrollY;
let lastScrollTime = -Infinity;
let scrollRate = 1;
let pulseRate = 1;
let pulseRateFrame = 0;

const clamp = (value) => Math.min(1, Math.max(0, value));
const lastFrameTime = () => Math.max(0, video.duration - frameDuration / 2);

function componentPosition(points, time) {
  const next = points.findIndex(([timestamp]) => timestamp > time);
  if (next === -1) return points.at(-1).slice(1);
  if (next === 0) return points[0].slice(1);

  const [start, x, y] = points[next - 1];
  const [end, nextX, nextY] = points[next];
  const progress = (time - start) / (end - start);
  return [x + (nextX - x) * progress, y + (nextY - y) * progress];
}

function visibleVideoRect(bounds) {
  const box = video.getBoundingClientRect();
  const scale = Math.min(box.width / video.videoWidth, box.height / video.videoHeight);
  const width = video.videoWidth * scale;
  const height = video.videoHeight * scale;
  return {
    x: box.left - bounds.left + (box.width - width) / 2,
    y: box.top - bounds.top + (box.height - height) / 2,
    width,
    height,
  };
}

function energyRoute(part, time, bounds, frame) {
  const [x, y] = componentPosition(part.points, time);
  const source = [frame.x + x * frame.width, frame.y + y * frame.height];
  const title = part.title.getBoundingClientRect();

  if (compactLayout.matches) {
    const edge = part.kind === 'chip' ? frame.x + frame.width * .25 : frame.x + frame.width * .73;
    if (part.kind === 'connector') source[0] += frame.width * .1;
    const end = [title.left - bounds.left + title.width / 2, title.top - bounds.top - 9];
    return [source, [edge, source[1]], [edge, end[1] - 13], end];
  }

  const end = [title.right - bounds.left + 13, title.top - bounds.top + title.height / 2];
  const bend = end[0] + Math.max(12, (source[0] - end[0]) * .35);
  return [source, [bend, source[1]], [end[0] + 9, end[1]], end];
}

function measureRoute(points, progress, phase) {
  const lengths = points.slice(1).map(([x, y], index) =>
    Math.hypot(x - points[index][0], y - points[index][1]));
  const distance = lengths.reduce((total, length) => total + length, 0);
  return { points, lengths, visibleDistance: distance * progress, phase };
}

function traceEnergy(context, { points, lengths }, start, end) {
  let offset = 0;
  let started = false;
  context.beginPath();

  for (const [index, length] of lengths.entries()) {
    const segmentStart = offset;
    offset += length;
    if (!length || offset <= start) continue;
    if (segmentStart >= end) break;

    const [x, y] = points[index];
    const [nextX, nextY] = points[index + 1];
    if (!started) {
      const from = Math.max(0, (start - segmentStart) / length);
      context.moveTo(x + (nextX - x) * from, y + (nextY - y) * from);
      started = true;
    }
    const to = Math.min(1, (end - segmentStart) / length);
    context.lineTo(x + (nextX - x) * to, y + (nextY - y) * to);
  }
  context.stroke();
}

function titleDrawing(container) {
  const canvas = container.querySelector('.title-lightning');
  return { canvas, context: canvas.getContext('2d'), routes: [], length: 0 };
}

function prepareTitle(drawing, ratio) {
  if (!drawing.context) return;

  const box = drawing.canvas.getBoundingClientRect();
  const width = Math.round(box.width * ratio);
  const height = Math.round(box.height * ratio);
  if (!width || !height) return;
  if (drawing.routes.length && drawing.canvas.width === width && drawing.canvas.height === height) return;
  drawing.canvas.width = width;
  drawing.canvas.height = height;

  const glyphHeight = height * .72;
  const gap = width * .035;
  const glyphWidth = (width - gap * (titleGlyphs.length + 1)) / titleGlyphs.length;
  const top = (height - glyphHeight) / 2;
  drawing.routes = titleGlyphs.flatMap((strokes, letter) => {
    const left = gap + letter * (glyphWidth + gap);
    return strokes.map(stroke => measureRoute(stroke.map(([x, y]) =>
      [left + x * glyphWidth, top + y * glyphHeight]), 1, 0));
  });
  drawing.length = drawing.routes.reduce((length, route) => length + route.visibleDistance, 0);
}

function drawTitleLightning({ canvas: titleCanvas, context: lightning, routes, length: titleLength }, now) {
  const { width, height } = titleCanvas;
  const pulseLength = width * .1;
  const head = (now % 3800) / 3800 * (titleLength + pulseLength);
  let offset = 0;
  lightning.clearRect(0, 0, width, height);
  lightning.lineJoin = 'bevel';
  lightning.lineCap = 'round';

  for (const route of routes) {
    const length = route.visibleDistance;
    lightning.lineWidth = height * .062;
    lightning.strokeStyle = '#2b8bff65';
    traceEnergy(lightning, route, 0, length);
    lightning.lineWidth = height * .027;
    lightning.strokeStyle = '#81cfff';
    traceEnergy(lightning, route, 0, length);

    const start = Math.max(0, head - pulseLength - offset);
    const end = Math.min(length, head - offset);
    if (start < end) {
      lightning.lineWidth = height * .044;
      lightning.strokeStyle = '#e4fbff';
      traceEnergy(lightning, route, start, end);
    }
    offset += length;
  }

  titleCanvas.parentElement.classList.add('lightning-ready');
}

function drawTitleParticles(now) {
  energy.shadowColor = '#32bfff';
  energy.shadowBlur = 7;
  const fade = clamp((1 - titleDissolve) * 5);
  for (const particle of particles) {
    const age = (titleDissolve - particle.x * .65) / .38;
    if (age <= 0 || age >= 1) continue;

    const flicker = .7 + .3 * Math.sin(now / 190 + particle.phase);
    const alpha = Math.sin(age * Math.PI) * fade * flicker;
    const x = titleBounds.x + particle.x * titleBounds.width + particle.drift * age;
    const y = titleBounds.y + particle.y * titleBounds.height - particle.rise * age
      + Math.sin(now / 430 + particle.phase) * age * 4;
    energy.fillStyle = `rgb(122 218 255 / ${alpha})`;
    energy.beginPath();
    energy.arc(x, y, particle.size, 0, Math.PI * 2);
    energy.fill();
  }
}

function animateEnergy(now) {
  energyFrame = 0;
  if (energyPainted) energy.clearRect(0, 0, canvas.width, canvas.height);
  energyPainted = false;
  if (!active) return;

  const titleVisible = titleDissolve < 1 && openingTitle.routes.length > 0;
  const miniVisible = miniOpacity > 0 && miniTitle.routes.length > 0;
  if (titleVisible) drawTitleLightning(openingTitle, now);
  if (miniVisible) drawTitleLightning(miniTitle, now);

  const dissolving = energy && titleBounds && titleDissolve > 0 && titleDissolve < 1;
  if (dissolving) drawTitleParticles(now);

  for (const route of energyRoutes) {
    const { points, visibleDistance, phase } = route;
    energy.lineJoin = 'round';
    energy.lineCap = 'round';
    energy.shadowColor = '#25b8ff';
    energy.shadowBlur = 9;
    energy.lineWidth = 1.4;
    energy.strokeStyle = '#64d7ffbd';
    traceEnergy(energy, route, 0, visibleDistance);

    const cycle = ((now + phase) % 1700) / 1700;
    const pulseLength = Math.min(48, visibleDistance * .45);
    const front = cycle * (visibleDistance + pulseLength);
    energy.strokeStyle = '#c1f6ff';
    energy.lineWidth = 2.6;
    energy.shadowBlur = 15;
    traceEnergy(energy, route, Math.max(0, front - pulseLength), Math.min(visibleDistance, front));

    energy.beginPath();
    energy.arc(...points[0], 3, 0, Math.PI * 2);
    energy.fillStyle = '#b7f0ff';
    energy.fill();

    const ring = (cycle * 2) % 1;
    energy.beginPath();
    energy.arc(...points[0], 4 + ring * 12, 0, Math.PI * 2);
    energy.lineWidth = 1;
    energy.strokeStyle = `rgb(112 221 255 / ${.6 * (1 - ring)})`;
    energy.stroke();
  }

  energyPainted = Boolean(dissolving || energyRoutes.length);
  if (energyPainted || titleVisible || miniVisible) energyFrame = requestAnimationFrame(animateEnergy);
}

function renderCues(time) {
  const bounds = scene.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(bounds.width * ratio);
  const height = Math.round(bounds.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  energy?.setTransform(ratio, 0, 0, ratio, 0, 0);
  const frame = visibleVideoRect(bounds);
  const routes = [];
  titleDissolve = clamp((time - dissolveStart) / (dissolveEnd - dissolveStart));
  identity.style.setProperty('--identity-opacity', 1 - clamp((titleDissolve - .2) / .8));
  identity.style.setProperty('--identity-edge', `${titleDissolve * 134 - 28}%`);
  identity.setAttribute('aria-hidden', String(titleDissolve === 1));
  miniOpacity = clamp((time - dissolveEnd) / .35);
  miniIdentity.style.setProperty('--mini-opacity', miniOpacity);
  miniIdentity.setAttribute('aria-hidden', String(miniOpacity === 0));
  if (titleDissolve < 1) {
    const box = identity.getBoundingClientRect();
    titleBounds = { x: box.left - bounds.left, y: box.top - bounds.top, width: box.width, height: box.height };
    prepareTitle(openingTitle, ratio);
  }
  if (miniOpacity > 0) prepareTitle(miniTitle, ratio);

  for (const part of parts) {
    const elapsed = time - part.time;
    const line = clamp(elapsed / .36);
    const title = clamp((elapsed - .14) / .28);
    const description = clamp((elapsed - .46) / .3);
    part.element.style.setProperty('--title-reveal', title);
    part.element.style.setProperty('--description-reveal', description);
    part.title.setAttribute('aria-hidden', String(title === 0));
    part.description.setAttribute('aria-hidden', String(description === 0));
    if (energy && line > 0) {
      const points = energyRoute(part, time, bounds, frame);
      routes.push(measureRoute(points, line, part.kind === 'chip' ? 0 : 720));
    }
  }

  energyRoutes = routes;
  if (!energyFrame && (routes.length || titleDissolve < 1 || miniOpacity > 0)) {
    energyFrame = requestAnimationFrame(animateEnergy);
  }
}

function update() {
  updateFrame = 0;
  if (!active) return;

  const distance = journey.offsetHeight - scene.offsetHeight;
  const progress = distance > 0 ? clamp(-journey.getBoundingClientRect().top / distance) : 0;
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    renderCues(0);
    return;
  }

  const end = lastFrameTime();
  const target = Math.min(end, Math.round(progress * end / frameDuration) * frameDuration);
  if (video.seeking) return;

  // After a seek completes, read the latest scroll position before requesting another frame.
  renderCues(video.currentTime);
  if (Math.abs(video.currentTime - target) >= frameDuration / 2) video.currentTime = target;
}

function scheduleUpdate() {
  if (active && !updateFrame) updateFrame = requestAnimationFrame(update);
}

function adjustPulseRate(now) {
  pulseRateFrame = 0;
  if (!active) return;

  const target = now - lastScrollTime < 125 ? scrollRate : 1;
  pulseRate += (target - pulseRate) * .22;
  if (Math.abs(target - pulseRate) < .025) pulseRate = target;

  for (const pulse of framePulses) {
    const animation = pulse.getAnimations()[0];
    animation?.updatePlaybackRate(pulseRate);
  }
  if (pulseRate !== 1 || target !== 1) pulseRateFrame = requestAnimationFrame(adjustPulseRate);
}

function handleScroll() {
  if (!active) return;
  scheduleUpdate();

  const y = window.scrollY;
  const distance = Math.abs(y - lastScrollY);
  if (!distance) return;

  const now = performance.now();
  const elapsed = Math.min(65, Math.max(12, now - lastScrollTime));
  scrollRate = 1 + Math.min(4.5, .7 + distance / elapsed * .9);
  lastScrollTime = now;
  lastScrollY = y;
  if (!pulseRateFrame) pulseRateFrame = requestAnimationFrame(adjustPulseRate);
}

function movePointerLight(event) {
  if (!active || event.pointerType !== 'mouse') return;

  const bounds = scene.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  pointerLight.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  scene.classList.add('pointer-lit');
}

function hidePointerLight() {
  scene.classList.remove('pointer-lit');
}

function choosePresentation() {
  active = !reducedMotion.matches && !mediaFailed;
  journey.hidden = !active;
  stillPresentation.hidden = active;

  if (active) {
    lastScrollY = window.scrollY;
    lastScrollTime = -Infinity;
    pulseRate = 1;
    if (!video.hasAttribute('src')) video.src = 'assets/ld2450-scroll.mp4';
    scheduleUpdate();
  } else {
    hidePointerLight();
  }
}

video.addEventListener('loadedmetadata', scheduleUpdate);
video.addEventListener('seeked', scheduleUpdate);
video.addEventListener('error', () => {
  mediaFailed = true;
  choosePresentation();
});
reducedMotion.addEventListener('change', choosePresentation);
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('pageshow', scheduleUpdate);
scene.addEventListener('pointermove', movePointerLight, { passive: true });
scene.addEventListener('pointerleave', hidePointerLight);
window.addEventListener('blur', hidePointerLight);

choosePresentation();
