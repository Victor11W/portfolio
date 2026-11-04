import {CPU_REGISTERS} from './processor-engine.js';
import {REPORT_PROGRAM,REPORT_LISTING,REPORT_DATA,createReportCPUState,advanceReportCPU} from './report-cpu.js';
import {escapeHTML} from './project-utils.js';

const imagePath = './assets/processor-report-diagram.png';
const reportPath = './assets/Rapport_RISCV_Architecture_Processeur.pdf';
const labels = {
  fr: {
    kicker: 'Figure 2 · Rapport du projet', title: 'Dans notre processeur',
    intro: 'Le schéma est celui du rapport. Suivez nos instructions qui lisent deux valeurs en mémoire, les additionnent et écrivent le résultat.',
    run: 'Lancer', pause: 'Pause', step: 'Cycle suivant', restart: 'Rejouer', cycle: 'Cycle', slider: 'Choisir un cycle',
    zoom: 'Agrandir une partie du schéma', all: 'Vue entière', original: 'Figure originale ↗',
    scheme: 'Architecture du rapport avec les trois étages Fetch, Decode et Execute. Les blocs en couleur participent au cycle affiché.',
    idle: 'Aucune instruction', fetch: 'Lecture', decode: 'Décodage', execute: 'Exécution',
    memory: 'Le calcul en mémoire', sample: 'Les entrées A et B sont un jeu d’essai. C reçoit leur somme.',
    trace: 'Voir les instructions et les registres', program: 'Listing du rapport', registers: 'Banc de registres',
    decoded: 'Mot en décodage', reference: 'Listing, p. 21 ↗', before: 'Avancez pour remplir le pipeline.',
    fill: 'Les premières instructions entrent dans le pipeline.', forwarded: 'Transfert EX → ID',
    from: 'Commencer par', loop: 'L’addition · 0x20', entry: 'L’entrée du programme · 0x00',
    goal: 'L’addition commence à 0x20. La lecture s’arrête lorsque le branchement à 0x3A choisit sa destination.',
    fromEntry: 'Depuis 0x00, suivez les tests des pointeurs et la construction du masque avant l’addition. À 0x1A, le déplacement est interprété comme −4 conformément au commentaire du listing.',
    taken: 'Branchement pris', notTaken: 'Branchement non pris',
    final: 'Fin de l’extrait. Le premier élément du tableau C a été écrit.',
    branch: 'La valeur testée est non nulle. Le déplacement −12 inscrit à 0x3A ramène le PC à 0x2E.',
    load: 'Lecture', store: 'Écriture', skip: 'En attente'
  },
  en: {
    kicker: 'Figure 2 · Project report', title: 'Inside our processor',
    intro: 'This is the diagram from our report. Follow the instructions that read two values from memory, add them and write the result.',
    run: 'Run', pause: 'Pause', step: 'Next cycle', restart: 'Replay', cycle: 'Cycle', slider: 'Choose a cycle',
    zoom: 'Zoom in on a stage', all: 'Full diagram', original: 'Original figure ↗',
    scheme: 'Architecture from the report with its Fetch, Decode and Execute stages. Highlighted blocks participate in the displayed cycle.',
    idle: 'No instruction', fetch: 'Fetch', decode: 'Decode', execute: 'Execute',
    memory: 'The calculation in memory', sample: 'A and B contain sample inputs. Their sum is written to C.',
    trace: 'Inspect the instructions and registers', program: 'Program listing', registers: 'Register file',
    decoded: 'Word in decode', reference: 'Listing, p. 21 ↗', before: 'Step forward to fill the pipeline.',
    fill: 'The first instructions are entering the pipeline.', forwarded: 'EX → ID forwarding',
    from: 'Start at', loop: 'The addition · 0x20', entry: 'Program entry · 0x00',
    goal: 'The addition begins at 0x20. Playback stops when the branch at 0x3A selects its target.',
    fromEntry: 'From 0x00, follow the pointer checks and construction of the mask before the addition. The displacement at 0x1A is interpreted as −4 following the listing’s comment.',
    taken: 'Branch taken', notTaken: 'Branch not taken',
    final: 'End of the excerpt. The first element of array C has been written.',
    branch: 'The tested value is nonzero. The −12 displacement printed at 0x3A sends the PC back to 0x2E.',
    load: 'Read', store: 'Write', skip: 'Pending'
  }
};

const stages = [['fetch', 'IF'], ['decode', 'ID'], ['execute', 'EX']];
const viewBoxes = {
  all: '0 0 1084 570',
  fetch: '0 286 291 234',
  decode: '286 145 386 372',
  execute: '695 227 365 295'
};

function hex(value, length = 2) {
  return '0x' + value.toString(16).toUpperCase().padStart(length, '0');
}

function figure(t) {
  return `<figure class="report-figure">
    <svg viewBox="${viewBoxes.all}" role="img" aria-label="${t.scheme}" data-report-figure>
      <image href="${imagePath}" width="1084" height="570"/>
      <g class="report-overlay">
        <g data-block="fetch"><rect x="2" y="372" width="67" height="92"/><rect x="141" y="374" width="96" height="88"/><path class="route" d="M70 418H139"/></g>
        <g data-block="decode"><ellipse cx="356" cy="418" rx="44" ry="22"/></g>
        <g data-block="registers"><rect x="471" y="251" width="98" height="158"/></g>
        <g data-block="immediate"><ellipse cx="473" cy="470" rx="39" ry="14"/></g>
        <g data-block="branch"><rect x="457" y="152" width="74" height="28"/></g>
        <g data-block="alu"><path d="M783 274L860 306V349L783 382V339L798 327L783 317Z"/></g>
        <g data-block="memory"><rect x="914" y="311" width="119" height="69"/><path class="route" d="M862 327H911"/></g>
        <g data-block="store"><path class="route" d="M690 409H853V362H910"/></g>
        <g data-block="load"><path class="route" d="M1034 346H1054V476H780"/></g>
      </g>
      <g class="report-live-values">
        <g transform="translate(25 29)"><rect width="210" height="25" rx="3"/><text x="105" y="17" data-value="pc">PC 0x20</text></g>
        <g transform="translate(393 29)"><rect width="220" height="25" rx="3"/><text x="110" y="17" data-value="decode">—</text></g>
        <g transform="translate(769 29)"><rect width="280" height="25" rx="3"/><text x="140" y="17" data-value="execute">—</text></g>
      </g>
    </svg>
    <figcaption>
      <div class="report-zoom" role="group" aria-label="${t.zoom}">
        ${[['all',t.all],...stages].map(([key,text])=>`<button type="button" data-zoom="${key}" aria-pressed="${key==='all'}">${text}</button>`).join('')}
      </div>
      <a href="${reportPath}#page=23" target="_blank" rel="noopener noreferrer">${t.original}</a>
    </figcaption>
  </figure>`;
}

function memorySlots(t) {
  const tables = [['A',REPORT_DATA.left],['B',REPORT_DATA.right],['C',REPORT_DATA.dest]];
  return `<section class="report-memory">
    <h4>${t.memory}</h4><p>${t.sample}</p>
    <div class="report-arrays">
      ${tables.map(([name,base])=>`<div class="report-array" data-address="${base}">
        <div><span>${name}[0]</span><small>${hex(base,3)}</small></div><output aria-live="off">—</output>
      </div>`).join('')}
    </div>
  </section>`;
}

export function processorLabMarkup(language) {
  const t=labels[language];
  return `<section class="processor-lab" aria-labelledby="processor-lab-title">
    <p class="report-eyebrow">${t.kicker}</p>
    <h3 id="processor-lab-title" class="sr-only">${t.title}</h3>
    <div class="report-controls">
      <button type="button" class="button button-primary" id="processor-play" aria-pressed="false">${t.run}</button>
      <button type="button" class="button button-secondary" id="processor-step">${t.step}</button>
      <label class="report-scrub"><span id="processor-cycle">${t.cycle} 01</span><input type="range" id="processor-clock" min="0" max="1" value="0" step="1" aria-label="${t.slider}"></label>
    </div>
    ${figure(t)}
    <p class="report-intro">${t.intro}</p>
    <label class="report-presets"><span>${t.from}</span><select id="processor-entry"><option value="loop">${t.loop}</option><option value="entry">${t.entry}</option></select></label>
    <div class="report-stage-grid">
      ${stages.map(([key,code])=>`<div class="report-stage" data-stage="${key}"><div><strong>${code}</strong><span>${t[key]}</span></div><code>—</code><small></small></div>`).join('')}
    </div>
    <p id="processor-status" class="report-status" role="status"></p>
    ${memorySlots(t)}
    <details class="report-inspector">
      <summary>${t.trace}</summary>
      <div class="report-columns">
        <div>
          <h4>${t.program} <a href="${reportPath}#page=21" target="_blank" rel="noopener noreferrer">${t.reference}</a></h4>
          <ol class="report-listing"></ol>
        </div>
        <div>
          <h4>${t.registers}</h4>
          <dl class="report-registers">${CPU_REGISTERS.map((name,i)=>`<div data-register="${i}"><dt>r${i} · ${name}</dt><dd>0</dd></div>`).join('')}</dl>
          <h4>${t.decoded}</h4><code id="processor-word" class="report-word">—</code>
        </div>
      </div>
    </details>
    <p class="report-scope">${t.goal}</p>
  </section>`;
}

function cycleDescription(state,t) {
  const effect=state.effect, notes=[];
  if (effect) {
    const inst=effect.instruction;
    if (inst.op==='LOAD') notes.push(`${t.load} · MEM[${hex(effect.address,3)}] → ${CPU_REGISTERS[effect.register]} = ${effect.value}`);
    else if (inst.op==='STORE') notes.push(`${t.store} · MEM[${hex(effect.address,3)}] ← ${effect.value}`);
    else if (['ADD','SUB','AND','OR'].includes(inst.op)) {
      const op={ADD:'+',SUB:'−',AND:'&',OR:'|'}[inst.op];
      notes.push(`${CPU_REGISTERS[effect.register]} ← ${effect.a} ${op} ${effect.b} = ${effect.value}`);
    } else if (effect.register!=null) notes.push(`${CPU_REGISTERS[effect.register]} ← ${effect.value}`);
  }
  if (state.forwarding) notes.push(t.forwarded+' · '+CPU_REGISTERS[state.forwarding.register]+' = '+state.forwarding.value);
  if (state.done) notes.push(t.final);
  if (state.branch) {
    const branch=state.branch;
    if (branch.instruction.address===0x3A&&branch.taken) notes.push(t.branch);
    else notes.push(branch.taken?t.taken+' → '+hex(branch.target):t.notTaken);
  }
  return notes.join('   ·   ') || (state.cycle ? t.fill : t.before);
}

function activeBlocks(state) {
  const active=new Set();
  const id=state.stages.decode, ex=state.stages.execute;
  if (state.stages.fetch) active.add('fetch');
  if (id) {
    active.add('decode');
    if (id.sources?.length) active.add('registers');
    if (['LOAD','STORE','MOVI','BNEZ'].includes(id.op)) active.add('immediate');
    if (id.op==='BNEZ') active.add('branch');
  }
  if (ex && ['ADD','SUB','AND','OR','LOAD','STORE'].includes(ex.op)) active.add('alu');
  if (ex?.op==='LOAD' || ex?.op==='STORE') {
    active.add('memory');active.add(ex.op.toLowerCase());
  }
  return active;
}

export function mountProcessorLab(container,language) {
  const t=labels[language];
  const root=container.querySelector('.processor-lab');
  const $=selector=>root.querySelector(selector);
  const $$=selector=>[...root.querySelectorAll(selector)];
  const listeners=new AbortController(), options={signal:listeners.signal};
  let frames=[],listing=[],index=1,timer=null;
  const play=$('#processor-play'),step=$('#processor-step'),clock=$('#processor-clock');
  const status=$('#processor-status'),figureEl=$('[data-report-figure]');
  const stagesUI=$$('.report-stage'), areas=$$('[data-block]'), cells=$$('[data-address]');
  const registers=$$('[data-register]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function chooseStart(entry) {
    frames=[entry==='entry'?createReportCPUState('entry'):createReportCPUState()];
    while (!frames.at(-1).done) frames.push(advanceReportCPU(frames.at(-1)));
    index=1;
    clock.max=String(frames.length-1);
    const instructions=entry==='entry'?REPORT_LISTING:REPORT_PROGRAM;
    $('.report-listing').innerHTML=instructions.map(ins=>`<li data-ins="${ins.address}"><span>${hex(ins.address)}</span><code>${escapeHTML(ins.assembly)}</code><b></b></li>`).join('');
    listing=$$('[data-ins]');
    $('.report-scope').textContent=entry==='entry'?t.fromEntry+' '+t.goal:t.goal;
  }

  function render() {
    const state=frames[index], active=activeBlocks(state);
    const namedStages=new Map();
    for (const item of stagesUI) {
      const key=item.dataset.stage, instruction=state.stages[key];
      item.dataset.active=String(Boolean(instruction));
      item.querySelector('code').textContent=instruction?.assembly || '—';
      item.querySelector('small').textContent=instruction ? hex(instruction.address) : t.idle;
      if (instruction) namedStages.set(instruction.address,key);
    }
    for (const area of areas) area.classList.toggle('is-live',active.has(area.dataset.block));
    for (const slot of cells) {
      const address=Number(slot.dataset.address);
      const stored=state.memory[address];
      slot.querySelector('output').textContent=stored===undefined?'—':String(stored);
      slot.dataset.access=state.effect?.address===address?state.effect.instruction.op:'';
    }
    for (const row of listing) {
      const stage=namedStages.get(Number(row.dataset.ins));
      row.dataset.stage=stage || '';
      row.querySelector('b').textContent=stage ? {fetch:'IF',decode:'ID',execute:'EX'}[stage] : '';
    }
    for (const slot of registers) {
      const i=Number(slot.dataset.register);
      slot.querySelector('dd').textContent=state.registers[i];
      slot.dataset.written=String(state.effect?.register===i);
    }
    const decoded=state.stages.decode;
    $('[data-value="pc"]').textContent='PC '+hex(state.registers[15]);
    $('[data-value="decode"]').textContent=decoded?.assembly || '—';
    const effect=state.effect;
    $('[data-value="execute"]').textContent=effect
      ? (effect.kind==='memory'?'MEM['+hex(effect.address,3)+']':CPU_REGISTERS[effect.register])+' ← '+effect.value
      : '—';
    $('#processor-word').textContent=decoded?.word!=null ? hex(decoded.word,4)+' · '+decoded.bits : '—';
    $('#processor-cycle').textContent=t.cycle+' '+String(state.cycle).padStart(2,'0');
    clock.value=String(index);
    clock.setAttribute('aria-valuetext',t.cycle+' '+state.cycle);
    status.textContent=cycleDescription(state,t);
    play.textContent=timer!==null?t.pause:state.done?t.restart:t.run;
    play.setAttribute('aria-pressed',String(timer!==null));
    step.disabled=state.done;
  }

  function pause() {
    if (timer!==null) clearInterval(timer);
    timer=null;
    status.setAttribute('aria-live','polite');
  }
  function advance() {
    if (index<frames.length-1) index++;
    if (index===frames.length-1) pause();
    render();
  }
  function start() {
    if (index===frames.length-1) index=0;
    status.setAttribute('aria-live','off');
    timer=setInterval(advance,1250);
    render();
  }
  play.addEventListener('click',()=>{
    if (timer===null) start();
    else {pause();render();}
  },options);
  step.addEventListener('click',()=>{pause();advance();},options);
  clock.addEventListener('input',()=>{pause();index=Number(clock.value);render();},options);
  $('#processor-entry').addEventListener('change',event=>{
    const playing=timer!==null;
    pause();chooseStart(event.target.value);
    if(playing)start();else render();
  },options);
  for (const button of $$('[data-zoom]')) button.addEventListener('click',()=>{
    const next=button.dataset.zoom;
    figureEl.setAttribute('viewBox',viewBoxes[next]);
    figureEl.dataset.zoom=next;
    for (const option of $$('.report-zoom button')) option.setAttribute('aria-pressed',String(option===button));
  },options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();render();}},options);
  reduced.addEventListener('change',()=>{if(reduced.matches){pause();render();}},options);
  chooseStart('loop');
  if (!reduced.matches&&!document.hidden) start();
  else render();
  return {destroy(){pause();listeners.abort();}};
}
