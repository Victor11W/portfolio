import {CPU_REGISTERS} from './processor-engine.js';

// Figure 2, redrawn as a readable vector datapath. Values and highlighted
// routes describe the teaching model; they do not constitute an RTL netlist.
export const PROCESSOR_VIEW_BOXES = {
  all: '0 0 1280 700',
  fetch: '0 50 316 630',
  decode: '300 50 520 630',
  execute: '804 50 476 630'
};

const words = {
  fr: {
    diagram: 'Chemin de données du processeur 16 bits redessiné depuis la figure 2 du rapport. Lecture, décodage et exécution, avec les connexions de contrôle et les retours de résultat.',
    zoom: 'Agrandir un étage du processeur', all: 'Vue entière', original: 'Comparer avec le rapport ↗',
    fetch: 'PC et mémoire d’instructions', decode: 'Décodage, registres et branchements', execute: 'Calcul, mémoire et écriture',
    scroll: 'Faites défiler le schéma ou choisissez un étage pour l’agrandir.',
    data: 'Données', control: 'Contrôle', forward: 'Forwarding EX → ID',
    check: 'TEST ≠ 0', sign: 'EXT. DE SIGNE', next: 'PC SUIVANT', result: 'RÉSULTAT',
    branch: 'CIBLE', controlLabel: 'SIGNAUX DU DÉCODEUR', idle: '—'
  },
  en: {
    diagram: '16-bit processor datapath redrawn from figure 2 of the report. Fetch, decode and execute, including control connections and result feedback.',
    zoom: 'Zoom in on a processor stage', all: 'Full diagram', original: 'Compare with the report ↗',
    fetch: 'PC and instruction memory', decode: 'Decode, registers and branches', execute: 'ALU, memory and writeback',
    scroll: 'Scroll the diagram or select a stage to enlarge it.',
    data: 'Data', control: 'Control', forward: 'EX → ID forwarding',
    check: 'TEST ≠ 0', sign: 'SIGN EXTEND', next: 'NEXT PC', result: 'RESULT',
    branch: 'TARGET', controlLabel: 'DECODER CONTROL SIGNALS', idle: '—'
  }
};

function wire(id,d,extra='') {
  return `<path class="dp-wire ${extra}" data-route="${id}" d="${d}" marker-end="url(#cpu-datapath-arrow)"/>`;
}

function note(x,y,text,extra='') {
  return `<text class="dp-note ${extra}" x="${x}" y="${y}">${text}</text>`;
}

function box(id,x,y,w,h,lines,value,sub='') {
  const centre=x+w/2;
  const first=y+(value&&h<70?18:lines.length===1?29:25);
  return `<g class="dp-block" data-block="${id}">
    <rect class="dp-shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>
    <text class="dp-label" x="${centre}" y="${first}" text-anchor="middle">${lines.map((line,i)=>`<tspan x="${centre}" dy="${i?19:0}">${line}</tspan>`).join('')}</text>
    ${value?`<text class="dp-value" data-value="${value}" x="${centre}" y="${y+h-19}" text-anchor="middle">—</text>`:''}
    ${sub?`<text class="dp-note" x="${centre}" y="${y+h-44}" text-anchor="middle">${sub}</text>`:''}
  </g>`;
}

function mux(id,x,y,label) {
  return `<g class="dp-mux" data-block="${id}"><path class="dp-shape" d="M${x} ${y}L${x+28} ${y+13}V${y+59}L${x} ${y+72}Z"/>
    <text class="dp-pin" x="${x+8}" y="${y+25}">0</text><text class="dp-pin" x="${x+8}" y="${y+57}">1</text>
    <text class="dp-note" x="${x+14}" y="${y-12}" text-anchor="middle">${label}</text></g>`;
}

export function processorDiagramMarkup(language='fr') {
  const t=words[language]||words.fr;
  return `<figure class="report-figure processor-diagram">
    <figcaption>
      <div class="report-zoom" role="group" aria-label="${t.zoom}">${[['all',t.all],['fetch','IF'],['decode','ID'],['execute','EX']].map(([key,label])=>`<button type="button" data-zoom="${key}" aria-pressed="${key==='all'}">${label}</button>`).join('')}</div>
      <a href="./assets/Rapport_RISCV_Architecture_Processeur.pdf#page=23" target="_blank" rel="noopener noreferrer">${t.original}</a>
    </figcaption>
    <div class="dp-viewport" tabindex="0" role="region" aria-label="${t.diagram}">
      <svg viewBox="${PROCESSOR_VIEW_BOXES.all}" role="img" aria-label="${t.diagram}" data-report-figure="" data-diagram-language="${language}" data-zoom="all">
        <defs>
          <marker id="cpu-datapath-arrow" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0L7 3.5L0 7Z" fill="context-stroke"/></marker>
        </defs>
        <g class="dp-panels" aria-hidden="true">
          <rect class="dp-stage-bg" x="16" y="50" width="272" height="618" rx="5"/>
          <rect class="dp-stage-bg" x="312" y="50" width="492" height="618" rx="5"/>
          <rect class="dp-stage-bg" x="828" y="50" width="436" height="618" rx="5"/>
          <text class="dp-stage-caption" x="32" y="78">IF / FETCH</text>
          <text class="dp-stage-caption" x="330" y="78">ID / DECODE</text>
          <text class="dp-stage-caption" x="846" y="78">EX / EXECUTE</text>
        </g>
        <g class="dp-connections" fill="none">
          ${wire('pc-read','M114 426H162')}
          ${wire('pc-increment','M138 426V214H98V208')}
          ${wire('constant-two','M53 188H78')}
          ${wire('sequential','M118 188H252V30H690V132H706')}
          ${wire('pc-base','M138 426V226H330V208H532V180H588V162')}
          ${wire('pc-next','M348 130H26V404H38')}
          ${wire('branch-select','M734 152H776V94H394V114H376')}
          ${wire('instruction','M274 426H338')}
          ${wire('rs1-index','M438 408H486V352H548')}
          ${wire('rs2-index','M438 440H500V384H548')}
          ${wire('immediate','M388 472V510H443V530')}
          ${wire('immediate-branch','M506 558H522V176H440V142H456')}
          ${wire('call-target','M440 176V146H376')}
          ${wire('shift','M532 142H568')}
          ${wire('branch-target','M608 142H648V164H706')}
          ${wire('branch-test','M712 364H746V240H676')}
          ${wire('branch-decision','M676 216H720V175')}
          ${wire('operand-a','M712 364H918V386H938')}
          ${wire('operand-b','M712 422H790V414H856')}
          ${wire('alu-immediate','M506 558H776V446H856')}
          ${wire('alu-selected-b','M884 430H920V474H938')}
          ${wire('alu-address','M1028 426H1114')}
          ${wire('store-data','M712 422H768V510H1092V458H1114')}
          ${wire('alu-result','M1050 426V512H1100V552H1084')}
          ${wire('load-result','M1242 438H1252V584H1084')}
          ${wire('writeback','M1056 568H622V502')}
          ${wire('forwarding','M1034 568V642H758V364H784','dp-forward')}
          ${wire('decode-control','M388 382V278H1088','dp-control')}
          ${wire('control-branch','M480 278V226H544','dp-control')}
          ${wire('control-pc','M464 278V196H362V157','dp-control')}
          ${wire('control-alu','M980 278V370','dp-control')}
          ${wire('control-source','M870 278V400','dp-control')}
          ${wire('control-write-select','M1088 278V506H1070V539','dp-control')}
          ${wire('control-write-index','M388 288H1104V608H592V502','dp-control')}
          ${wire('control-write-enable','M388 300H1109V624H566V502','dp-control')}
        </g>
        <g class="dp-junctions" aria-hidden="true">
          <circle cx="138" cy="426" r="3"/><circle cx="138" cy="226" r="3"/><circle cx="712" cy="422" r="3"/><circle cx="746" cy="364" r="3"/>
          <circle cx="1050" cy="426" r="3"/><circle cx="1034" cy="568" r="3"/><circle cx="440" cy="176" r="3"/><circle cx="522" cy="558" r="3"/>
          <circle data-forward-junction="" cx="758" cy="364" r="3"/>
        </g>
        <g class="dp-latches">
          <g class="dp-latch" data-block="if-id"><rect class="dp-shape" x="294" y="170" width="12" height="418"/><text x="300" y="611" text-anchor="middle">IF/ID</text></g>
          <g class="dp-latch" data-block="id-ex"><rect class="dp-shape" x="814" y="270" width="12" height="318"/><text x="820" y="611" text-anchor="middle">ID/EX</text></g>
        </g>
        ${box('pc',38,382,76,90,['PC'],'pc')}
        ${box('instruction-memory',162,382,112,90,['INSTR.','MEMORY'],'instruction-word')}
        <g class="dp-block" data-block="increment"><circle class="dp-shape" cx="98" cy="188" r="20"/><text class="dp-label" x="98" y="194" text-anchor="middle">+</text></g>
        ${note(38,193,'2')}
        <g class="dp-mux" data-block="pc-mux"><path class="dp-shape" d="M376 92L348 105V151L376 164Z"/>
          <text class="dp-pin" x="362" y="117">0</text><text class="dp-pin" x="362" y="149">1</text>
          <text class="dp-note" x="410" y="111">PCWr</text></g>
        ${box('decode',338,382,100,90,['DECODE'],'decode-op')}
        ${box('shift',456,120,76,44,['SHIFT'])}
        <g class="dp-block" data-block="branch-add"><circle class="dp-shape" cx="588" cy="142" r="20"/><text class="dp-label" x="588" y="148" text-anchor="middle">+</text></g>
        ${mux('branch-mux',706,110,t.branch)}
        ${box('branch-compare',544,202,132,50,[t.check])}
        <text class="dp-value dp-branch-value" x="610" y="194" text-anchor="middle" data-value="branch">—</text>
        <g class="dp-block" data-block="registers">
          <rect class="dp-shape" x="548" y="322" width="164" height="180" rx="4"/>
          <text class="dp-label" x="630" y="349" text-anchor="middle">REGISTER FILE</text>
          <text class="dp-note" x="630" y="375" text-anchor="middle">16 × r · 32 bits</text>
          <text class="dp-value" x="630" y="423" text-anchor="middle" data-value="register-a">—</text>
          <text class="dp-value" x="630" y="451" text-anchor="middle" data-value="register-b">—</text>
          <text class="dp-pin" x="557" y="490">WE</text><text class="dp-pin" x="588" y="490">rd</text><text class="dp-pin" x="619" y="490">wd</text>
        </g>
        ${note(509,344,'rs1')}${note(509,376,'rs2')}
        ${box('immediate',380,530,126,56,[t.sign],'immediate')}
        ${mux('alu-source',856,394,'ALUSrc')}
        <g class="dp-ex-operands">
          ${note(890,324,'ID/EX · A')}${note(1008,324,'ID/EX · B')}
          <text class="dp-value" data-value="execute-a" x="890" y="346">—</text>
          <text class="dp-value" data-value="execute-b" x="1008" y="346">—</text>
        </g>
        <g class="dp-block" data-block="alu">
          <path class="dp-shape" d="M938 350L1028 392V464L938 506V458L956 430L938 410Z"/>
          <text class="dp-label" x="983" y="419" text-anchor="middle">ALU</text>
          <text class="dp-value" x="983" y="446" text-anchor="middle" data-value="alu">—</text>
        </g>
        ${box('memory',1114,386,128,98,['DATA MEMORY'],'memory')}
        <g class="dp-mux" data-block="write-select"><path class="dp-shape" d="M1084 532L1056 546V590L1084 604Z"/>
          <text class="dp-pin" x="1070" y="556">0</text><text class="dp-pin" x="1070" y="588">1</text>
          <text class="dp-note" x="1070" y="522" text-anchor="middle">RegWrSel</text></g>
        <g class="dp-wire-labels" aria-hidden="true">
          ${note(184,178,'PC + 2')}${note(170,218,'PC')}
          ${note(342,225,'PC (ID)')}
          <text class="dp-value" data-value="pc-id" x="411" y="225">—</text>
          ${note(344,263,t.controlLabel,'dp-small')}
          ${note(486,216,'Branch','dp-control-label')}
          ${note(892,267,'ALUop','dp-control-label')}
          ${note(1070,267,'RegWrSel','dp-control-label')}
          ${note(1110,601,'RegWrIdx','dp-control-label dp-signal-label')}
          ${note(1110,640,'RegWrEn','dp-control-label dp-signal-label')}
          ${note(840,356,'rdata1')}${note(908,464,'rdata2')}
          ${note(1084,418,'addr')}${note(1084,450,'wdata')}
          ${note(1117,578,'rdata')}${note(922,559,t.result)}
          ${note(785,634,'EX → ID')}
          <text class="dp-value" data-value="writeback" x="878" y="589" text-anchor="middle">—</text>
          <text class="dp-value" data-value="forwarding" x="940" y="662" text-anchor="middle">—</text>
          <text class="dp-note" x="42" y="533">${t.next}</text>
          <text class="dp-value" data-value="next-pc" x="42" y="558">—</text>
        </g>
      </svg>
    </div>
    <p class="dp-scroll-note">${t.scroll}</p>
    <div class="dp-legend" aria-hidden="true"><span class="dp-legend-data">${t.data}</span><span class="dp-legend-control">${t.control}</span><span class="dp-legend-forward">${t.forward}</span></div>
  </figure>`;
}

function hex(value,width=2) {
  return Number.isInteger(value)?'0x'+(value>>>0).toString(16).toUpperCase().padStart(width,'0'):'—';
}

function value(value) {
  return !Number.isFinite(value)?'—':Math.abs(value)>99999?hex(value):String(value);
}

export function updateProcessorDiagram(svg,state) {
  const id=state.stages.decode, ex=state.stages.execute, effect=state.effect;
  const branch=state.branch, forwarding=state.forwarding;
  const activeBlocks=new Set(), activeRoutes=new Set();
  const heldRoutes=new Set(['pc-read','pc-increment','pc-base','sequential','pc-next','instruction']);
  const add=(blocks,routes)=>{blocks.forEach(v=>activeBlocks.add(v));routes.forEach(v=>activeRoutes.add(v));};
  if(state.stages.fetch) add(['pc','instruction-memory','increment','if-id'],['pc-read','pc-increment','constant-two','sequential','instruction','pc-next']);
  if(id) {
    add(['decode','id-ex'],['decode-control']);
    if(id.sources?.length)add(['registers'],['rs1-index',...(id.sources.length>1?['rs2-index']:[])]);
    if(id.imm!=null)add(['immediate'],['immediate']);
  }
  if(ex&&effect) {
    if(['ADD','SUB','AND','OR','LOAD','STORE'].includes(ex.op))add(['alu'],['operand-a','alu-selected-b','control-alu']);
    if(ex.op==='MOVI')add(['alu','alu-source'],['alu-immediate','alu-selected-b','control-alu','control-source']);
    if(['LOAD','STORE'].includes(ex.op))add(['memory','alu-source'],['alu-address','alu-immediate','control-source']);
    else if(['ADD','SUB','AND','OR'].includes(ex.op))add(['alu-source'],['operand-b']);
    if(ex.op==='STORE')activeRoutes.add('store-data');
    if(effect.kind==='register'&&effect.register!==0)add(['write-select','registers'],['writeback','control-write-select','control-write-index','control-write-enable',ex.op==='LOAD'?'load-result':'alu-result']);
  }
  if(branch) {
    add(['branch-compare','branch-mux','pc-mux'],['branch-test','control-branch','branch-decision','branch-select','pc-next']);
    if(branch.taken)add(['immediate','shift','branch-add'],['immediate-branch','shift','pc-base','branch-target']);
  }
  if(forwarding)activeRoutes.add('forwarding');
  // A held IF/ID stage is a retained snapshot, not another fetch. In this
  // teaching cycle ID is held and EX contains a bubble, so no route transfers
  // a new value. Only the frozen PC / instruction paths remain highlighted.
  if(state.stall) {activeBlocks.clear();activeRoutes.clear();}
  const forwardRoute=svg.querySelector('[data-route="forwarding"]');
  const forwardToSecond=forwarding&&id?.rs2===forwarding.register&&id?.rs1!==forwarding.register;
  forwardRoute.setAttribute('d',forwardToSecond?'M1034 568V642H758V422H780':'M1034 568V642H758V364H784');
  svg.querySelector('[data-forward-junction]').setAttribute('cy',forwardToSecond?'422':'364');
  for(const element of svg.querySelectorAll('[data-block]')) {
    element.classList.toggle('is-live',activeBlocks.has(element.dataset.block));
    element.classList.toggle('is-stalled',Boolean(state.stall)&&['pc','if-id','decode','instruction-memory','memory'].includes(element.dataset.block));
    element.classList.toggle('is-flushed',Boolean(state.flush)&&['instruction-memory','if-id'].includes(element.dataset.block));
  }
  for(const element of svg.querySelectorAll('[data-route]')) {
    element.classList.toggle('is-live',activeRoutes.has(element.dataset.route));
    element.classList.toggle('is-forwarded',element.dataset.route==='forwarding'&&Boolean(forwarding)&&!state.stall);
    element.classList.toggle('is-stalled',Boolean(state.stall)&&heldRoutes.has(element.dataset.route));
    element.classList.toggle('is-flushed',Boolean(state.flush)&&element.dataset.route==='instruction');
  }
  svg.dataset.stalled=String(Boolean(state.stall));
  svg.dataset.flushed=String(Boolean(state.flush));
  const operand=(register,fallback)=>register==null?'—':CPU_REGISTERS[register]+' = '+value(fallback??state.registers[register]);
  // Register-file values belong to the current ID instruction. The ALU
  // consumes the previous instruction's operands captured in ID/EX.
  const executeInstruction=effect?.instruction;
  const memoryOperation=['LOAD','STORE'].includes(executeInstruction?.op);
  const immediateOperand=memoryOperation||executeInstruction?.op==='MOVI';
  const text={
    pc:hex(state.registers[15]), 'next-pc':hex(state.stall?state.registers[15]:branch?.taken?branch.target:state.nextFetch),
    'pc-id':hex(branch?.instruction.address??id?.address),
    'instruction-word':hex((state.stages.fetch||state.flush?.instruction)?.word,4), 'decode-op':id?.op||'—',
    'register-a':operand(id?.rs1??(id?.op==='BNEZ'?id.rd:null),state.decodedOperands?.a),
    'register-b':operand(id?.rs2,state.decodedOperands?.b),
    immediate:id?.imm==null?'—':value(id.imm),
    'execute-a':effect?(memoryOperation?hex(effect.a,3):value(effect.a)):'—',
    'execute-b':effect?value(immediateOperand?executeInstruction.imm:effect.b):'—',
    alu:effect?value(['LOAD','STORE'].includes(ex?.op)?effect.address:effect.value):'—',
    memory:state.stall?hex(state.stall.address,3)+' …':effect?.address!=null?hex(effect.address,3)+(ex?.op==='STORE'?' ← ':' → ')+value(effect.value):'—',
    branch:branch?CPU_REGISTERS[branch.register]+' = '+value(branch.value):'—',
    writeback:effect?.kind==='register'?CPU_REGISTERS[effect.register]+' ← '+value(effect.value):'—',
    forwarding:forwarding?CPU_REGISTERS[forwarding.register]+' = '+value(forwarding.value):'—'
  };
  for(const element of svg.querySelectorAll('[data-value]'))element.textContent=text[element.dataset.value]??'—';
}
