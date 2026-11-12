const timer = new Timer();
const el = Object.fromEntries(['time', 'status', 'duration', 'total-duration', 'next-signal', 'toggle', 'toggle-label', 'play-icon', 'stop', 'reset', 'target-label', 'progress', 'dial', 'test-sound', 'audio-error'].map(id => [id, document.getElementById(id)]));
let intervalMs = 60000;
let nextSignalMs = null;
let audioContext;
let tones = [];
let starting = false;
let revision = 0;
const format = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

async function enableAudio() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Web Audio ei ole käytettävissä.');
    audioContext ??= new Audio();
    await audioContext.resume();
    if (audioContext.state !== 'running') throw new Error('Ääntä ei voitu käynnistää.');
    el['audio-error'].hidden = true;
    return true;
  } catch {
    el['audio-error'].textContent = 'Ääntä ei voitu käynnistää. Tarkista selaimen ääniasetukset ja kokeile ääntä uudelleen. Ajastin toimii silti.';
    el['audio-error'].hidden = false;
    return false;
  }
}
function cancelTones() {
  tones.forEach(tone => { try { tone.stop(); } catch {} });
  tones = [];
  nextSignalMs = null;
}
function beep(at, duration, frequency) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(.23, at + .012);
  gain.gain.setValueAtTime(.23, at + duration - .035);
  gain.gain.linearRampToValueAtTime(0, at + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.onended = () => {
    oscillator.disconnect(); gain.disconnect();
    tones = tones.filter(tone => tone !== oscillator);
  };
  tones.push(oscillator);
  oscillator.start(at);
  oscillator.stop(at + duration + .01);
}
function scheduleTones() {
  cancelTones();
  const { elapsed } = timer.read();
  nextSignalMs = Math.min((Math.floor(elapsed / intervalMs) + 1) * intervalMs, timer.durationMs);
  fillTones();
}
function fillTones() {
  if (!audioContext || audioContext.state !== 'running') return;
  const { elapsed, state } = timer.read();
  if (state !== 'running' || nextSignalMs === null) return;
  const now = audioContext.currentTime;
  // Keep five minutes queued on the audio clock, without allocating a whole day's tones.
  while (nextSignalMs !== null && nextSignalMs <= elapsed + 300000) {
    const delay = (nextSignalMs - elapsed) / 1000;
    for (const seconds of [3, 2, 1]) {
      if (delay - seconds >= 0) beep(now + delay - seconds, .14, 880);
    }
    if (delay >= 0) beep(now + delay, 1.15, 660);
    nextSignalMs = nextSignalMs === timer.durationMs ? null : Math.min(nextSignalMs + intervalMs, timer.durationMs);
  }
}
function render() {
  const { elapsed, remaining, state } = timer.read();
  const running = state === 'running';
  el.time.textContent = format(elapsed);
  el['target-label'].textContent = `/ ${format(timer.durationMs)}`;
  el.progress.style.strokeDashoffset = 100 - elapsed / timer.durationMs * 100;
  const status = {idle: 'Valmis aloittamaan', running: 'Aika kuluu', paused: 'Tauolla', stopped: 'Pysäytetty', finished: 'Aika täynnä!'};
  const message = running && remaining <= 3000 ? `${Math.ceil(remaining / 1000)} sekuntia jäljellä` : status[state];
  if (el.status.textContent !== message) el.status.textContent = message;
  el['toggle-label'].textContent = running ? 'Tauko' : state === 'paused' ? 'Jatka' : ['stopped', 'finished'].includes(state) ? 'Uudelleen' : 'Aloita';
  el['play-icon'].innerHTML = running ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="m8 5 11 7-11 7z"/>';
  el.toggle.setAttribute('aria-label', running ? 'Pidä tauko' : state === 'paused' ? 'Jatka ajastinta' : 'Aloita ajastin');
  el.stop.disabled = !['running', 'paused'].includes(state);
  el.reset.disabled = state === 'idle';
  el.duration.disabled = running || state === 'paused';
  el['total-duration'].disabled = running || state === 'paused';
  const nextBoundary = Math.min((Math.floor(elapsed / intervalMs) + 1) * intervalMs, timer.durationMs);
  el['next-signal'].hidden = timer.durationMs <= intervalMs;
  el['next-signal'].textContent = state === 'finished' ? 'Kokonaisaika täynnä' : `Seuraava äänimerkki: ${format(nextBoundary)} · jäljellä ${format(Math.ceil((nextBoundary - elapsed) / 1000) * 1000)}`;
  el.dial.classList.toggle('ending', running && remaining <= 3000);
  el.dial.classList.toggle('finished', state === 'finished');
  document.title = state === 'idle' ? 'Hetki — yksinkertainen ajastin' : `${format(elapsed)} · ${status[state]} — Hetki`;
}
async function toggle() {
  if (starting) return;
  if (timer.read().state === 'running') {
    timer.pause(); cancelTones(); render(); return;
  }
  if (!el['total-duration'].checkValidity()) {
    el['total-duration'].reportValidity();
    return;
  }
  starting = true;
  el.toggle.disabled = true;
  const currentRevision = revision;
  try {
    await enableAudio();
    if (currentRevision !== revision) return;
    timer.start(); scheduleTones(); render();
  } finally {
    starting = false;
    el.toggle.disabled = false;
  }
}
el.toggle.addEventListener('click', toggle);
el.stop.addEventListener('click', () => { revision++; timer.stop(); cancelTones(); render(); });
el.reset.addEventListener('click', () => { revision++; timer.reset(); cancelTones(); render(); });
function updateSettings() {
  revision++;
  cancelTones();
  if (!el['total-duration'].checkValidity()) return;
  intervalMs = Number(el.duration.value) * 1000;
  const total = el['total-duration'].value.trim();
  timer.reset(total === '' ? intervalMs : Number(total) * 60000);
  render();
}
el.duration.addEventListener('change', updateSettings);
el['total-duration'].addEventListener('input', updateSettings);
el['test-sound'].addEventListener('click', async () => {
  if (timer.read().state === 'running' || starting) return;
  el['test-sound'].disabled = true;
  try {
    if (await enableAudio()) {
      cancelTones();
      const now = audioContext.currentTime;
      [0, 1, 2].forEach(delay => beep(now + delay, .14, 880));
      beep(now + 3, 1.15, 660);
    }
  } finally { el['test-sound'].disabled = false; }
});
document.addEventListener('keydown', event => {
  if (event.code === 'Space' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !event.target.closest('button, select, input, textarea, a, [contenteditable]')) {
    event.preventDefault(); toggle();
  }
});
window.addEventListener('pagehide', cancelTones);
document.addEventListener('visibilitychange', render);
setInterval(() => {
  fillTones();
  render();
  el['test-sound'].disabled = timer.state === 'running' || starting;
}, 50);
render();
