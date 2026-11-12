const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  let now = 0;
  const notes = [];
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, { value: id === 'duration' ? '60' : '', style: {}, classList: { toggle() {} }, checkValidity() { return true; }, setAttribute() {}, addEventListener() {} });
    return elements.get(id);
  }
  class Audio {
    currentTime = 100;
    state = 'running';
    async resume() {}
    createOscillator() {
      const note = { frequency: {}, stops: [], connect() { return this; }, disconnect() {}, start(at) { this.at = at; }, stop(at) { this.stops.push(at); } };
      notes.push(note); return note;
    }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() { return this; }, disconnect() {} }; }
  }
  const context = vm.createContext({ performance: { now: () => now }, document: { getElementById: element, addEventListener() {} }, window: { AudioContext: Audio, addEventListener() {} }, setInterval() {} });
  for (const name of ['timer-core.js', 'app.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist', name), 'utf8'), context);
  return { notes, advance: ms => now += ms, run: code => vm.runInContext(code, context) };
}
test('lyhyet äänet ajoitetaan 3, 2 ja 1 s ennen loppua, pitkä täsmälleen loppuun', async () => {
  const app = setup();
  await app.run('enableAudio()');
  app.run('timer.reset(10000); timer.start(); scheduleTones()');
  assert.deepEqual(app.notes.map(note => note.at), [107, 108, 109, 110]);
  assert.deepEqual(app.notes.map(note => note.frequency.value), [880, 880, 880, 660]);
  for (let i = 0; i < 4; i++) {
    const duration = app.notes[i].stops[0] - app.notes[i].at - .01;
    assert.ok(Math.abs(duration - (i === 3 ? 1.15 : .14)) < 1e-8);
  }
});
test('tauko peruu äänet; jatko ajoittaa vain jäljellä olevat piippaukset', async () => {
  const app = setup(); await app.run('enableAudio()');
  app.run('timer.reset(10000); timer.start(); scheduleTones()');
  app.advance(8500); app.run('timer.pause(); cancelTones()');
  assert.ok(app.notes.every(note => note.stops.length === 2));
  app.advance(20000); app.run('timer.start(); scheduleTones()');
  assert.deepEqual(app.notes.slice(4).map(note => note.at), [100.5, 101.5]);
});
test('100 minuutin ajo jatkuu minuutin merkin yli ja päättyy vasta kokonaisaikaan', async () => {
  const app = setup(); await app.run('enableAudio()');
  app.run("el['total-duration'].value = '100'; updateSettings(); timer.start(); scheduleTones()");
  assert.equal(app.run('timer.durationMs'), 6000000);
  assert.deepEqual(app.notes.slice(0, 8).map(note => note.at), [157, 158, 159, 160, 217, 218, 219, 220]);
  assert.equal(app.notes.length, 20); // bounded five-minute audio queue
  app.advance(60000);
  assert.equal(app.run('timer.read().state'), 'running');
  assert.equal(app.run('timer.read().elapsed'), 60000);
  app.run('fillTones(); fillTones()');
  assert.equal(app.notes.length, 24); // next interval once, with no duplicate sounds
  app.advance(5940000);
  assert.equal(app.run('timer.read().state'), 'finished');
  assert.equal(app.run('timer.read().elapsed'), 6000000);
});
test('kokonaisajan viimeinen vajaa jakso saa oman loppumerkin ilman tuplamerkkiä', async () => {
  const app = setup(); await app.run('enableAudio()');
  app.run('intervalMs = 10000; timer.reset(25000); timer.start(); scheduleTones()');
  assert.deepEqual(app.notes.filter(note => note.frequency.value === 660).map(note => note.at), [110, 120, 125]);
  const exact = setup(); await exact.run('enableAudio()');
  exact.run('intervalMs = 10000; timer.reset(30000); timer.start(); scheduleTones()');
  assert.deepEqual(exact.notes.filter(note => note.frequency.value === 660).map(note => note.at), [110, 120, 130]);
});
test('tauon jälkeen jaksotus pysyy alkuperäisessä rytmissä', async () => {
  const app = setup(); await app.run('enableAudio()');
  app.run('intervalMs = 10000; timer.reset(30000); timer.start(); scheduleTones()');
  app.advance(11500); app.run('timer.pause(); cancelTones()');
  app.advance(60000); app.run('timer.start(); scheduleTones()');
  assert.deepEqual(app.notes.slice(12).filter(note => note.frequency.value === 660).map(note => note.at), [108.5, 118.5]);
});
