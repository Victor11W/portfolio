import test from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_DATA, REPORT_LISTING, createReportCPUState, advanceReportCPU} from '../report-cpu.js';

function trace(start, options) {
  const states = [createReportCPUState(start, options)];
  while (!states.at(-1).done) {
    assert.ok(states.length < 140, 'The selected path should reach its first loop branch');
    states.push(advanceReportCPU(states.at(-1)));
  }
  return states;
}

test('register fields, store operand order and relative branch follow the report tables', () => {
  const at = address => REPORT_LISTING[address / 2];
  assert.equal(at(0x22).word, 0x0bb8); // ADD v3, a3, a3. Table 7 gives v3=1000 and a3=1011.
  assert.equal(at(0x28).word, 0x409a); // LOAD v1, 0(v2).
  assert.equal(at(0x2e).word, 0x60ac); // STORE v1, 0(a2).
  assert.equal(at(0x3a).word, 0xff46); // op 11 | immediate 1111110100 | v5 0110.
  assert.deepEqual([0x06, 0x0a, 0x0e].map(address => at(address).word), [null, null, null]);
});

test('the source path exercises both outcomes of the mask loop and agrees with the body shortcut', () => {
  const full = trace('entry'), body = trace('body');
  const branches = full.flatMap(state => state.branch?.instruction.address === 0x1a ? [state.branch] : []);
  assert.equal(branches.length, 23);
  assert.equal(branches.filter(branch => branch.taken && branch.target === 0x16).length, 22);
  assert.equal(branches.at(-1).taken, false);
  assert.equal(full.find(state => state.stages.execute?.address === 0x1c).effect.a, -2147483648);
  assert.ok(full.every(state => state.stages.execute?.word !== null));
  assert.deepEqual(full.at(-1).registers, body.at(-1).registers);
  assert.deepEqual(full.at(-1).memory, body.at(-1).memory);
});

test('the data and control path fetch the printed target without committing its second store', () => {
  const frames = trace('body');
  const result = frames.at(-1);
  const changes = frames.flatMap(frame => frame.effect?.kind === 'memory' ? [frame.effect] : []);
  assert.equal(changes.length, 1);
  assert.deepEqual([changes[0].address, changes[0].value], [REPORT_DATA.dest, 12]);
  assert.equal(frames[0].memory[REPORT_DATA.dest], undefined);
  assert.equal(result.memory[REPORT_DATA.dest + 4], undefined);
  assert.equal(result.stopReason, 'loop-branch');
  assert.deepEqual(Object.values(result.stages).map(i => i.address), [0x2e, 0x3a, 0x38]);
  assert.equal(result.registers[15], 0x2e);
  assert.deepEqual(result.forwarding, {register: 9, value: 0x104 - 12});
  assert.equal(result.branch.target, 0x2e);
  assert.equal(advanceReportCPU(result), result);
});

test('optional memory unavailability freezes PC and IF/ID and inserts one EX bubble', () => {
  const frames = trace('body', {hazards: true});
  const stalls = frames.filter(frame => frame.stall);
  assert.equal(stalls.length, 1);
  const held = stalls[0], index = frames.indexOf(held), before = frames[index - 1];
  assert.deepEqual(held.stages.fetch, before.stages.fetch);
  assert.deepEqual(held.stages.decode, before.stages.decode);
  assert.equal(held.stages.fetch.address, 0x2c);
  assert.equal(held.stages.decode.address, 0x2a);
  assert.equal(held.stages.execute, null);
  assert.equal(held.nextFetch, before.nextFetch);
  assert.deepEqual(held.registers, before.registers);
  assert.deepEqual(held.memory, before.memory);
  assert.deepEqual(held.decodedOperands, before.decodedOperands);
  assert.equal(held.effect, null);
  assert.equal(held.forwarding, null);
  assert.equal(held.stall.address, REPORT_DATA.right);
  assert.equal(frames[index + 1].stall, null);
  assert.equal(frames[index + 1].stages.execute.address, 0x2a);
  // The original path has neither an inserted stall nor an anticipated read.
  assert.ok(trace('body').every(frame => !frame.stall && !frame.flush));
});

test('the resumed LOAD bypasses its actual result to ADD and the following STORE writes it once', () => {
  const frames = trace('body', {hazards: true});
  const resume = frames.findIndex((frame, i) => i > 0 && frames[i - 1].stall);
  const loaded = frames[resume], added = frames[resume + 1], stored = frames[resume + 2];
  assert.equal(loaded.effect.instruction.op, 'LOAD');
  assert.equal(loaded.effect.address, REPORT_DATA.right);
  assert.equal(loaded.effect.value, 5);
  assert.deepEqual(loaded.forwarding, {register: 8, value: 5});
  assert.equal(loaded.stages.decode.address, 0x2c);
  assert.equal(loaded.decodedOperands.b, 5);
  assert.deepEqual([added.effect.a, added.effect.b, added.effect.value], [7, 5, 12]);
  assert.deepEqual(added.forwarding, {register: 5, value: 12});
  assert.equal(added.stages.decode.address, 0x2e);
  assert.equal(added.decodedOperands.b, 12);
  assert.deepEqual([stored.effect.kind, stored.effect.address, stored.effect.value], ['memory', REPORT_DATA.dest, 12]);
  assert.equal(frames.filter(frame => frame.effect?.kind === 'memory').length, 1);
});

test('a taken branch flushes the anticipated instruction before decoding and refills IF on the next cycle', () => {
  const frames = trace('body', {hazards: true});
  const index = frames.findIndex(frame => frame.flush);
  const flushed = frames[index], refilled = frames[index + 1];
  assert.equal(flushed.branch.instruction.address, 0x3a);
  assert.equal(flushed.branch.taken, true);
  assert.equal(flushed.branch.value, 248);
  assert.equal(flushed.decodedOperands.a, 248);
  assert.deepEqual(flushed.forwarding, {register: 9, value: 248});
  assert.equal(flushed.flush.instruction.address, 0x3c);
  assert.equal(flushed.flush.instruction.assembly, 'ADD v1, lr, zero');
  assert.equal(flushed.flush.target, 0x2e);
  assert.equal(flushed.stages.fetch, null);
  assert.equal(flushed.nextFetch, 0x2e);
  assert.equal(flushed.done, false);
  assert.equal(refilled.stages.decode, null);
  assert.equal(refilled.stages.fetch.address, 0x2e);
  assert.equal(refilled.effect, null);
  assert.equal(refilled.done, true);
  assert.equal(refilled.stopReason, 'loop-branch');
  // If the cancelled ADD had executed, v1 would have been overwritten by lr=0.
  assert.equal(refilled.registers[5], 12);
  assert.ok(frames.every(frame => frame.stages.decode?.address !== 0x3c && frame.stages.execute?.address !== 0x3c));
  assert.equal(refilled.memory[REPORT_DATA.dest], 12);
  assert.equal(refilled.memory[REPORT_DATA.dest + 4], undefined);
});

test('both hazard entry points retain the report effects and branch decisions without mutating prior snapshots', () => {
  for (const start of ['body', 'entry']) {
    const reference = trace(start), demonstration = trace(start, {hazards: true});
    assert.deepEqual(demonstration.flatMap(frame => frame.effect ? [frame.effect] : []), reference.flatMap(frame => frame.effect ? [frame.effect] : []));
    assert.deepEqual(demonstration.flatMap(frame => frame.branch ? [frame.branch] : []), reference.flatMap(frame => frame.branch ? [frame.branch] : []));
    assert.deepEqual(demonstration.at(-1).registers, reference.at(-1).registers);
    assert.deepEqual(demonstration.at(-1).memory, reference.at(-1).memory);
    const flushedCount = demonstration.filter(frame => frame.flush).length;
    assert.equal(demonstration.at(-1).cycle, reference.at(-1).cycle + flushedCount + 1);
    for (const state of demonstration) {
      const saved = structuredClone(state);
      advanceReportCPU(state);
      assert.deepEqual(state, saved);
    }
  }
});
