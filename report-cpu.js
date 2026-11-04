import {CPU_REGISTERS, decodeCPUWord, encodeCPUInstruction} from './processor-engine.js';

// Listing on pages 21 and 33, using the register fields in table 7.
const [zero, a0, a1, a2, a3, v1, v2, v3, v4, v5] = CPU_REGISTERS.map((_, index) => index);
const lr = CPU_REGISTERS.indexOf('lr');
const pc = CPU_REGISTERS.indexOf('pc');

function arithmetic(op, rd, rs1, rs2) {
  return decodeCPUWord(encodeCPUInstruction({op, rd, rs1, rs2}));
}

function immediate(rd, imm) {
  return decodeCPUWord(encodeCPUInstruction({op: 'MOVI', rd, imm}));
}

function memoryInstruction(op, base, data) {
  const instruction = op === 'LOAD'
    ? {op, rs1: base, rd: data, imm: 0}
    : {op, rs1: base, rs2: data, imm: 0};
  return decodeCPUWord(encodeCPUInstruction(instruction));
}

function branch(rd, imm) {
  const word = 0xc000 | ((imm & 1023) << 4) | (15 - rd);
  const bits = word.toString(2).padStart(16, '0');
  return {
    op: 'BNEZ', rd, imm, word, bits, sources: [rd],
    assembly: 'BNEZ ' + CPU_REGISTERS[rd] + ', ' + imm,
    fields: [['opcode', bits.slice(0, 2)], ['imm', bits.slice(2, 12)], ['rd', bits.slice(12)]]
  };
}

function jumpRegister(rd) {
  const word = 0xa000 | (15 - rd);
  const bits = word.toString(2).padStart(16, '0');
  return {
    op: 'JUMP', rd, word, bits, sources: [rd], assembly: 'JUMP ' + CPU_REGISTERS[rd],
    fields: [['opcode', bits.slice(0, 2)], ['fct', bits.slice(2, 4)], ['reserved', bits.slice(4, 12)], ['rd', bits.slice(12)]]
  };
}

// These lines really are printed with an immediate, although table 12 only
// specifies a register operand. Keep the source and do not invent a word.
function unresolvedJump(operand) {
  return {op: 'JUMP', word: null, bits: null, fields: [], sources: [], assembly: 'JUMP ' + operand};
}

export const REPORT_LISTING = [
  arithmetic('ADD', v1, a0, zero), arithmetic('ADD', a0, a3, zero),
  branch(v1, 4), unresolvedJump('0x3C'),
  branch(a1, 4), unresolvedJump('0x40'),
  branch(a2, 4), unresolvedJump('0x36'),
  immediate(v2, -256), immediate(v3, 23), immediate(v4, 1),
  arithmetic('SUB', v3, v3, v4), arithmetic('ADD', v2, v2, v2),
  branch(v3, -4), // 0x1A: signed 9-bit text extended to the 10-bit SB field; see p.22.
  arithmetic('AND', v2, v2, a3), branch(v2, 0x2e),
  arithmetic('ADD', v2, v1, zero), arithmetic('ADD', v3, a3, a3),
  arithmetic('ADD', v3, v3, v3), arithmetic('ADD', v1, v1, v3),
  memoryInstruction('LOAD', v2, v1), memoryInstruction('LOAD', a1, v4),
  arithmetic('ADD', v1, v1, v4), memoryInstruction('STORE', a2, v1),
  immediate(v3, 4), arithmetic('ADD', v2, v2, v3),
  arithmetic('ADD', a1, a1, v3), arithmetic('ADD', a2, a2, v3),
  arithmetic('SUB', v5, v2, v1),
  branch(v5, -12), // 0x3A: the actual 10-bit field 1111110100 (table 11).
  arithmetic('ADD', v1, lr, zero), arithmetic('ADD', lr, zero, zero), jumpRegister(v1),
  immediate(a0, -1), arithmetic('ADD', v1, lr, zero), arithmetic('ADD', lr, zero, zero), jumpRegister(v1),
  immediate(a0, -1), arithmetic('ADD', v1, lr, zero), arithmetic('ADD', lr, zero, zero), jumpRegister(v1)
].map((instruction, index) => Object.freeze({...instruction, index, address: 2 * index}));

export const REPORT_PROGRAM = REPORT_LISTING.filter(({address}) => address >= 0x20 && address <= 0x3a);
export const REPORT_DATA = Object.freeze({
  left: 0x100, right: 0x140, dest: 0x180,
  first: Object.freeze([7, 3]), second: Object.freeze([5, 9])
});

function entryState() {
  const registers = Array(CPU_REGISTERS.length).fill(0);
  registers[a0] = REPORT_DATA.left;
  registers[a1] = REPORT_DATA.right;
  registers[a2] = REPORT_DATA.dest;
  registers[a3] = REPORT_DATA.first.length;
  const memory = {};
  REPORT_DATA.first.forEach((value, index) => {
    memory[REPORT_DATA.left + index * 4] = value;
    memory[REPORT_DATA.right + index * 4] = REPORT_DATA.second[index];
  });
  return {
    cycle: 0, registers, memory, stages: {fetch: null, decode: null, execute: null},
    nextFetch: 0, decodedOperands: null, effect: null, forwarding: null, branch: null,
    done: false, stopReason: null,
    scenario: 'report', stall: null, flush: null, memoryWaitUsed: false, pendingStop: null
  };
}

export function createReportCPUState(start = 'body', {hazards = false} = {}) {
  if (typeof hazards !== 'boolean') throw new TypeError('Expected a boolean hazards option');
  const state = entryState();
  state.scenario = hazards ? 'hazards' : 'report';
  if (start === 'entry') return state;
  if (start !== 'body') throw new RangeError('Unknown report entry point');
  // Architectural values immediately before 0x20, after the input checks
  // and mask calculation. Refill the teaching view's pipeline from here.
  state.registers[a0] = state.registers[a3];
  state.registers[v1] = REPORT_DATA.left;
  state.registers[v4] = 1;
  state.registers[pc] = state.nextFetch = 0x20;
  return state;
}

function executeReportInstruction(instruction, operands, registers, memory) {
  if (!instruction || instruction.op === 'BNEZ' || instruction.op === 'JUMP') return null;
  const {op, rd, imm = 0} = instruction;
  const {a, b} = operands;
  const address = op === 'LOAD' || op === 'STORE' ? a + imm : null;
  let value;
  switch (op) {
    case 'ADD': value = (a + b) | 0; break;
    case 'SUB': value = (a - b) | 0; break;
    case 'AND': value = a & b; break;
    case 'MOVI': value = imm; break;
    case 'LOAD':
      if (!Object.hasOwn(memory, address)) throw new RangeError('Uninitialised report input');
      value = memory[address];
      break;
    case 'STORE':
      memory[address] = b;
      return {kind: 'memory', register: null, address, value: b, a, b, instruction};
    default: throw new RangeError('Unsupported report operation: ' + op);
  }
  if (rd !== zero) registers[rd] = value;
  return {kind: 'register', register: rd, address, value, a, b, instruction};
}

function resolveControl(instruction, registers) {
  if (!instruction || !['BNEZ', 'JUMP'].includes(instruction.op) || instruction.word === null) return null;
  const value = registers[instruction.rd];
  const taken = instruction.op === 'JUMP' || value !== 0;
  const target = instruction.op === 'JUMP' ? value : instruction.address + instruction.imm;
  return {instruction, register: instruction.rd, value, taken, target};
}

export function advanceReportCPU(state) {
  if (state.done) return state;
  // The report mentions structural stalls as a possible extension, not an
  // implemented timing behaviour. This optional scenario makes the data
  // memory unavailable for one cycle before the second LOAD enters EX.
  // Holding PC and IF/ID prevents either waiting instruction from advancing;
  // the old EX instruction has already completed, so EX receives a bubble.
  if (state.scenario === 'hazards' && !state.memoryWaitUsed && state.stages.decode?.address === 0x2a) {
    const instruction = state.stages.decode;
    return {
      ...state, cycle: state.cycle + 1,
      registers: state.registers.slice(), memory: {...state.memory},
      stages: {...state.stages, execute: null},
      effect: null, forwarding: null, branch: null, flush: null,
      stall: {
        reason: 'memory-not-ready', instruction,
        address: state.decodedOperands.a + instruction.imm,
        held: ['pc', 'if-id'], bubble: 'execute'
      },
      memoryWaitUsed: true
    };
  }
  const registers = state.registers.slice();
  const memory = {...state.memory};
  const execute = state.stages.decode;
  const effect = executeReportInstruction(execute, state.decodedOperands, registers, memory);
  const decode = state.stages.fetch;
  // EX results are visible to ID in the same cycle through the bypass.
  const firstSource = decode && ['BNEZ', 'JUMP'].includes(decode.op) ? decode.rd : decode?.rs1;
  const decodedOperands = decode ? {a: registers[firstSource] ?? 0, b: registers[decode.rs2] ?? 0} : null;
  const forwarding = effect?.kind === 'register' && decode?.sources.includes(effect.register)
    ? {register: effect.register, value: effect.value} : null;
  const control = resolveControl(decode, registers);
  // Unlike the report's immediate ID -> IF redirect, the optional scenario
  // has already read the sequential instruction. Invalidate that read and
  // fetch the target only on the following cycle; it never reaches decode.
  const anticipated = REPORT_LISTING[state.nextFetch / 2] ?? null;
  const flush = state.scenario === 'hazards' && control?.taken && control.target !== state.nextFetch && anticipated
    ? {reason: 'taken-branch', instruction: anticipated, target: control.target} : null;
  const fetchAddress = control?.taken && !flush ? control.target : state.nextFetch;
  const fetch = flush ? null : REPORT_LISTING[fetchAddress / 2] ?? null;
  registers[pc] = fetchAddress;
  let stopReason = state.pendingStop;
  let pendingStop = null;
  if (decode?.address === 0x3a) {
    if (flush) pendingStop = 'loop-branch';
    else stopReason = 'loop-branch';
  }
  else if (decode?.word === null) stopReason = 'unencoded-jump';
  else if (!fetch && !flush) stopReason = 'outside-listing';
  return {
    cycle: state.cycle + 1, registers, memory, stages: {fetch, decode, execute},
    nextFetch: flush ? control.target : fetchAddress + 2,
    decodedOperands, forwarding, effect, branch: control,
    done: stopReason !== null, stopReason,
    scenario: state.scenario, stall: null, flush, memoryWaitUsed: state.memoryWaitUsed, pendingStop
  };
}
