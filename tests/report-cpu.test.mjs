import test from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_DATA, REPORT_LISTING, createReportCPUState, advanceReportCPU} from '../report-cpu.js';

function trace(start) {
  const states = [createReportCPUState(start)];
  while (!states.at(-1).done) {
    assert.ok(states.length < 110, 'The selected path should reach its first loop branch');
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
