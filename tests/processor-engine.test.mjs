import test from 'node:test';
import assert from 'node:assert/strict';
import {CPU_PROGRAM,CPU_REGISTERS,encodeCPUInstruction,decodeCPUWord,createCPUState,advanceCPU,cpuTimeline} from '../processor-engine.js';
test('custom ISA words follow the report field layouts and register codes',()=>{
 assert.deepEqual(CPU_PROGRAM.map(i=>i.word),[0x807e,0x805d,0x0dea,0x60af,0x40fc]);
 for(const op of ['ADD','SUB','AND','OR'])for(const rd of [0,1,5,14]){
  const decoded=decodeCPUWord(encodeCPUInstruction({op,rd,rs1:2,rs2:3}));assert.equal(decoded.op,op);assert.equal(decoded.rd,rd);assert.equal(decoded.rs1,2);assert.equal(decoded.rs2,3);
 }
 for(const op of ['MOVI','LOAD','STORE'])for(const imm of op==='MOVI'?[-256,-1,0,255]:[-16,-1,0,15]){
  const decoded=decodeCPUWord(encodeCPUInstruction({op,rd:3,rs1:1,rs2:5,imm}));assert.equal(decoded.imm,imm);assert.equal(decoded.op,op);
  if(op==='STORE'){assert.equal(decoded.rs1,1);assert.equal(decoded.rs2,5);}
 }
 assert.throws(()=>encodeCPUInstruction({op:'MOVI',imm:256}),/immediate/);
 assert.throws(()=>decodeCPUWord(0xc000),/outside/);
 assert.equal(CPU_REGISTERS[0],'zero');assert.equal(CPU_REGISTERS[15],'pc');
});
test('overlapped IF / ID / EX executes the program with forwarding and memory writes',()=>{
 const frames=cpuTimeline();assert.equal(frames.length,8);
 assert.equal(frames[1].stages.fetch.index,0);assert.equal(frames[1].stages.decode,null);
 assert.deepEqual(Object.values(frames[3].stages).map(i=>i.index),[2,1,0]);
 assert.deepEqual(frames[4].forwarding,{register:2,value:5});assert.deepEqual(frames[5].forwarding,{register:5,value:12});
 const final=frames.at(-1);assert.equal(final.registers[1],7);assert.equal(final.registers[2],5);assert.equal(final.registers[5],12);assert.equal(final.memory[0],12);assert.equal(final.registers[3],12);assert.equal(final.registers[15],10);assert.equal(final.registers[0],0);assert.equal(final.done,true);
 assert.deepEqual(frames[0],createCPUState());assert.strictEqual(advanceCPU(final),final);
});
test('writing zero is ignored and instructions advance the PC by two bytes',()=>{
 const program=[{...decodeCPUWord(encodeCPUInstruction({op:'MOVI',rd:0,imm:7})),address:0,index:0}];
 let state=createCPUState();for(let i=0;i<3;i++)state=advanceCPU(state,program);
 assert.equal(state.registers[0],0);assert.equal(state.registers[15],2);assert.equal(state.effect.kind,'discard');
});
