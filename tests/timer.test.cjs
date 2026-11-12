const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Timer } = require('../dist/timer-core.js');
function setup() { let now = 0; return { timer: new Timer(10000, () => now), advance: ms => now += ms }; }
test('aika kasvaa, päättyy tarkasti ja jää tavoiteaikaan', () => {
  const { timer, advance } = setup(); timer.start(); advance(1000);
  assert.equal(timer.read().elapsed, 1000);
  advance(8999); assert.equal(timer.read().state, 'running');
  advance(1); assert.deepEqual(timer.read(), { elapsed: 10000, remaining: 0, state: 'finished' });
  advance(5000); assert.equal(timer.read().elapsed, 10000);
  timer.start(); assert.equal(timer.read().elapsed, 0);
});
test('tauko ei kuluta aikaa ja jatkaminen säilyttää millisekunnit', () => {
  const { timer, advance } = setup(); timer.start(); advance(1750); timer.pause(); advance(50000);
  assert.equal(timer.read().elapsed, 1750); timer.start(); advance(8250);
  assert.equal(timer.read().state, 'finished');
});
test('stop säilyttää lukeman, uusi käynnistys aloittaa nollasta', () => {
  const { timer, advance } = setup(); timer.start(); advance(2000); timer.stop(); advance(5000);
  assert.deepEqual(timer.read(), { elapsed: 2000, remaining: 8000, state: 'stopped' });
  timer.start(); assert.equal(timer.read().elapsed, 0);
});
test('reset pysäyttää, nollaa ja vaihtaa tarvittaessa keston', () => {
  const { timer, advance } = setup(); timer.start(); advance(3000); timer.reset(60000);
  assert.deepEqual(timer.read(), { elapsed: 0, remaining: 60000, state: 'idle' });
  advance(5000); assert.equal(timer.read().elapsed, 0);
  assert.throws(() => timer.reset(0), RangeError);
});
test('myöhästynyt tauko tai stop ei muuta täyttynyttä ajastinta', () => {
  for (const method of ['pause', 'stop']) { const { timer, advance } = setup(); timer.start(); advance(10010); timer[method](); assert.equal(timer.state, 'finished'); }
});
