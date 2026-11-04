// Educational subset of the custom ISA in the supplied TP1 report (pp.16–24).
// Logical register names follow p.16; encoded register fields follow table 7, p.17.
export const CPU_REGISTERS=['zero','a0','a1','a2','a3','v1','v2','v3','v4','v5','v6','fp','ip','sp','lr','pc'];
const cpuRegisterCode=index=>15-index;
const cpuRegisterIndex=code=>15-code;
const cpuSigned=(value,width)=>(value&(1<<(width-1)))?value-(1<<width):value;
export function encodeCPUInstruction(instruction){
 const {op,rd=0,rs1=0,rs2=0,imm=0}=instruction;
 for(const r of [rd,rs1,rs2])if(!Number.isInteger(r)||r<0||r>15)throw new RangeError('Invalid register');
 if(['ADD','SUB','AND','OR'].includes(op))return (['ADD','SUB','AND','OR'].indexOf(op)<<12)|(cpuRegisterCode(rs2)<<8)|(cpuRegisterCode(rs1)<<4)|cpuRegisterCode(rd);
 if(op==='MOVI'){if(!Number.isInteger(imm)||imm< -256||imm>255)throw new RangeError('MOVI immediate');return 0x8000|((imm&511)<<4)|cpuRegisterCode(rd);}
 if(op==='LOAD'||op==='STORE'){
  if(!Number.isInteger(imm)||imm< -16||imm>15)throw new RangeError('Memory immediate');
  return (op==='STORE'?0x6000:0x4000)|((imm&31)<<8)|(cpuRegisterCode(op==='STORE'?rs2:rs1)<<4)|cpuRegisterCode(op==='STORE'?rs1:rd);
 }
 throw new RangeError('Unsupported demonstration opcode');
}
export function decodeCPUWord(word){
 if(!Number.isInteger(word)||word<0||word>65535)throw new RangeError('Expected 16-bit instruction');
 const opcode=word>>>14,bits=word.toString(2).padStart(16,'0'),reg=CPU_REGISTERS;
 let decoded;
 if(opcode===0){
  const op=['ADD','SUB','AND','OR'][(word>>>12)&3],rd=cpuRegisterIndex(word&15),rs1=cpuRegisterIndex((word>>>4)&15),rs2=cpuRegisterIndex((word>>>8)&15);
  decoded={op,rd,rs1,rs2,sources:[rs1,rs2],assembly:op+' '+reg[rd]+', '+reg[rs1]+', '+reg[rs2],fields:[['opcode',bits.slice(0,2)],['fct',bits.slice(2,4)],['rs2',bits.slice(4,8)],['rs1',bits.slice(8,12)],['rd',bits.slice(12)]]};
 }else if(opcode===1){
  const store=Boolean(word&0x2000),imm=cpuSigned((word>>>8)&31,5),first=cpuRegisterIndex((word>>>4)&15),last=cpuRegisterIndex(word&15),rs1=store?last:first,rd=store?null:last,rs2=store?first:null,op=store?'STORE':'LOAD';
  decoded={op,rd,rs1,rs2,imm,sources:store?[rs1,rs2]:[rs1],assembly:op+' '+reg[store?rs2:rd]+', '+imm+'('+reg[rs1]+')',fields:[['opcode',bits.slice(0,2)],['fct',bits.slice(2,3)],['imm',bits.slice(3,8)],['rs',bits.slice(8,12)],[store?'base':'rd',bits.slice(12)]]};
 }else if(opcode===2&&!(word&0x2000)){
  const rd=cpuRegisterIndex(word&15),imm=cpuSigned((word>>>4)&511,9);decoded={op:'MOVI',rd,imm,sources:[],assembly:'MOVI '+reg[rd]+', '+imm,fields:[['opcode',bits.slice(0,2)],['fct',bits.slice(2,3)],['imm',bits.slice(3,12)],['rd',bits.slice(12)]]};
 }else throw new RangeError('Branches and calls are outside this demonstration');
 return {...decoded,word,bits};
}
export const CPU_PROGRAM=[{op:'MOVI',rd:1,imm:7},{op:'MOVI',rd:2,imm:5},{op:'ADD',rd:5,rs1:1,rs2:2},{op:'STORE',rs1:0,rs2:5,imm:0},{op:'LOAD',rd:3,rs1:0,imm:0}].map((instruction,index)=>Object.freeze({...decodeCPUWord(encodeCPUInstruction(instruction)),address:index*2,index}));
export function createCPUState(){return {cycle:0,registers:Array(16).fill(0),memory:{0:0},stages:{fetch:null,decode:null,execute:null},effect:null,forwarding:null,done:false};}
export function advanceCPU(state,program=CPU_PROGRAM){
 if(state.done)return state;
 const cycle=state.cycle+1,registers=state.registers.slice(),memory={...state.memory};
 const at=index=>index>=0&&index<program.length?program[index]:null,fetch=at(cycle-1),decode=at(cycle-2),execute=at(cycle-3);
 let effect=null;
 if(execute){
  const {op,rd,rs1,rs2,imm=0}=execute,a=registers[rs1]||0,b=registers[rs2]||0;
  let result;
  if(op==='MOVI')result=imm;
  else if(op==='ADD')result=a+b;else if(op==='SUB')result=a-b;else if(op==='AND')result=a&b;else if(op==='OR')result=a|b;
  else if(op==='LOAD')result=memory[a+imm]??0;
  if(op==='STORE'){memory[a+imm]=b;effect={kind:'memory',address:a+imm,value:b,instruction:execute,a,b};}
  else if(rd!==0&&rd!==15){registers[rd]=result;effect={kind:'register',register:rd,value:result,instruction:execute,a,b,address:op==='LOAD'?a+imm:null};}
  else effect={kind:'discard',value:result,instruction:execute,a,b};
 }
 if(fetch)registers[15]=fetch.address+2;
 registers[0]=0;
 const forwarding=decode&&effect?.kind==='register'&&decode.sources.includes(effect.register)?{register:effect.register,value:effect.value}:null;
 return {cycle,registers,memory,stages:{fetch,decode,execute},effect,forwarding,done:cycle>=program.length+2};
}
export function cpuTimeline(){const frames=[createCPUState()];while(!frames.at(-1).done)frames.push(advanceCPU(frames.at(-1)));return frames;}
