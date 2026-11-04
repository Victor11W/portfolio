import {CPU_REGISTERS} from './processor-engine.js';
import {REPORT_PROGRAM,REPORT_LISTING,REPORT_DATA,createReportCPUState,advanceReportCPU} from './report-cpu.js';
import {processorDiagramMarkup,updateProcessorDiagram,PROCESSOR_VIEW_BOXES} from './processor-diagram.js';
import {escapeHTML} from './project-utils.js';

const reportPath='./assets/Rapport_RISCV_Architecture_Processeur.pdf';
const labels={
  fr:{
    kicker:'Architecture du projet · Instructions de 16 bits',title:'Dans notre processeur',
    intro:'Le chemin de données est redessiné à partir du rapport. Les instructions lisent deux valeurs en mémoire, les additionnent et écrivent le résultat.',
    run:'Lancer',pause:'Pause',step:'Cycle suivant',restart:'Rejouer',cycle:'Cycle',slider:'Choisir un cycle',
    idle:'Aucune instruction',fetch:'PC & mémoire d’instructions',decode:'Décodage & registres',execute:'ALU, mémoire & écriture',
    memory:'Le calcul en mémoire',sample:'Les entrées A et B sont un jeu d’essai. C reçoit leur somme.',
    trace:'Voir les instructions et les registres',program:'Listing du rapport',registers:'Banc de registres',
    decoded:'Mot en décodage',reference:'Listing, p. 21 ↗',
    from:'Point de départ',loop:'L’addition · 0x20',entry:'L’entrée du programme · 0x00',
    scenario:'Fonctionnement',report:'Programme du rapport',hazards:'Variante pédagogique · aléas',
    reportNote:'Dans le rapport, le branchement est résolu en ID avant la lecture suivante. Le forwarding EX → ID est utilisé ; aucun flush n’est nécessaire.',
    hazardsNote:'Variante ajoutée pour observer les aléas : la mémoire devient indisponible pendant un cycle et IF anticipe la lecture séquentielle. Ces hypothèses ne décrivent pas le fonctionnement du rapport.',
    events:'Voir un événement',forwarding:'Forwarding',stall:'Stall',flush:'Flush',
    forwardingHint:'Résultat EX → ID',stallHint:'Variante mémoire',flushHint:'Variante avec anticipation',
    ongoing:'Exécution',before:'Pipeline vide',fill:'Remplissage du pipeline',
    beforeDetail:'Lancez le programme ou avancez d’un cycle.',fillDetail:'Les premières instructions entrent dans les étages IF, ID et EX.',
    stallTitle:'La mémoire n’est pas disponible',
    stallDetail:' attend en ID. Le PC et IF/ID restent figés pendant un cycle ; une bulle traverse EX sans écrire de résultat.',
    forwardingTitle:'Le résultat d’EX est transmis à ID',
    forwardingDetail:' arrive directement d’EX pour ',forwardingEnd:' en ID. Cette dépendance ne nécessite pas de stall.',
    flushTitle:'La lecture anticipée est annulée',
    flushDetail:' avait été lue à la suite du branchement. Elle est annulée avant ID : la cible ',flushEnd:' sera lue au cycle suivant.',
    taken:'Branchement pris',notTaken:'Branchement non pris',
    branchDetail:'La condition testée en ID détermine la prochaine adresse de lecture.',
    final:'Fin de l’extrait',finalDetail:'Le premier élément de C vaut 12. La cible du dernier branchement est affichée sans exécuter son STORE.',
    load:'Lecture',store:'Écriture',frozen:'figé',cancelled:'annulée',bubble:'Bulle',noWrite:'Aucune écriture',
    goal:'L’addition commence à 0x20. La lecture s’arrête au premier retour de boucle, avant d’exécuter le STORE cible une seconde fois.',
    fromEntry:'Depuis 0x00, le programme teste les pointeurs et construit un masque avant l’addition. À 0x1A, le déplacement est interprété comme −4 selon le commentaire du listing.',
    branch:'Le déplacement −12 inscrit à 0x3A mène à 0x2E. Le commentaire du listing indique −18, qui mènerait à 0x28. La démo suit l’encodage.',
    unavailable:'Événement absent de ce parcours.'
  },
  en:{
    kicker:'Project architecture · 16-bit instructions',title:'Inside our processor',
    intro:'The datapath is redrawn from the report. The instructions read two values from memory, add them and write the result.',
    run:'Run',pause:'Pause',step:'Next cycle',restart:'Replay',cycle:'Cycle',slider:'Choose a cycle',
    idle:'No instruction',fetch:'PC & instruction memory',decode:'Decoder & register file',execute:'ALU, memory & writeback',
    memory:'The calculation in memory',sample:'A and B contain sample inputs. Their sum is written to C.',
    trace:'Inspect the instructions and registers',program:'Program listing',registers:'Register file',
    decoded:'Word in decode',reference:'Listing, p. 21 ↗',
    from:'Start at',loop:'The addition · 0x20',entry:'Program entry · 0x00',
    scenario:'Behaviour',report:'Program from the report',hazards:'Teaching variant · hazards',
    reportNote:'In the report, branches are resolved in ID before the next fetch. EX → ID forwarding is used; no flush is needed.',
    hazardsNote:'Added teaching variant: memory is unavailable for one cycle and IF speculatively reads the next sequential instruction. These assumptions differ from the report’s behaviour.',
    events:'Inspect an event',forwarding:'Forwarding',stall:'Stall',flush:'Flush',
    forwardingHint:'EX → ID result',stallHint:'Memory variant',flushHint:'Speculative variant',
    ongoing:'Execution',before:'Empty pipeline',fill:'Filling the pipeline',
    beforeDetail:'Run the program or advance one cycle.',fillDetail:'The first instructions are entering IF, ID and EX.',
    stallTitle:'Memory is not available',
    stallDetail:' waits in ID. The PC and IF/ID stay frozen for one cycle; a bubble passes through EX without writing a result.',
    forwardingTitle:'The EX result is forwarded to ID',
    forwardingDetail:' comes directly from EX for ',forwardingEnd:' in ID. This dependency does not require a stall.',
    flushTitle:'The speculative fetch is discarded',
    flushDetail:' was fetched after the branch. It is discarded before ID: the target ',flushEnd:' will be fetched next cycle.',
    taken:'Branch taken',notTaken:'Branch not taken',
    branchDetail:'The condition tested in ID selects the next fetch address.',
    final:'End of the excerpt',finalDetail:'The first element of C is 12. The final branch target is shown without executing its STORE.',
    load:'Read',store:'Write',frozen:'frozen',cancelled:'discarded',bubble:'Bubble',noWrite:'No writeback',
    goal:'The addition begins at 0x20. Playback stops at the first loop return, before the target STORE can execute a second time.',
    fromEntry:'From 0x00, the program checks the pointers and builds a mask before the addition. The displacement at 0x1A is interpreted as −4 following the listing’s comment.',
    branch:'The −12 displacement at 0x3A targets 0x2E. The listing’s comment says −18, which would target 0x28. This demo follows the encoding.',
    unavailable:'This path does not contain that event.'
  }
};
const stages=[['fetch','IF'],['decode','ID'],['execute','EX']];

function hex(value,length=2){
  return '0x'+value.toString(16).toUpperCase().padStart(length,'0');
}
function memorySlots(t){
  return '<section class="report-memory"><h4>'+t.memory+'</h4><p>'+t.sample+'</p><div class="report-arrays">'+
    [['A',REPORT_DATA.left],['B',REPORT_DATA.right],['C',REPORT_DATA.dest]].map(([name,address])=>
      '<div class="report-array" data-address="'+address+'"><div><span>'+name+'[0]</span><small>'+hex(address,3)+
      '</small></div><output aria-live="off">—</output></div>').join('')+'</div></section>';
}
export function processorLabMarkup(language){
  const t=labels[language];
  return '<section class="processor-lab" aria-labelledby="processor-lab-title">'+
    '<p class="report-eyebrow">'+t.kicker+'</p><h3 id="processor-lab-title" class="sr-only">'+t.title+'</h3>'+
    '<p class="report-intro">'+t.intro+'</p>'+
    '<div class="report-options">'+
      '<label class="report-presets"><span>'+t.from+'</span><select id="processor-entry"><option value="loop">'+t.loop+'</option><option value="entry">'+t.entry+'</option></select></label>'+
      '<label class="report-presets"><span>'+t.scenario+'</span><select id="processor-scenario" aria-describedby="processor-mode-note"><option value="report">'+t.report+'</option><option value="hazards">'+t.hazards+'</option></select></label>'+
    '</div><p class="report-mode-note" id="processor-mode-note">'+t.reportNote+'</p>'+
    '<div class="report-controls">'+
      '<button type="button" class="button button-primary" id="processor-play" aria-pressed="false">'+t.run+'</button>'+
      '<button type="button" class="button button-secondary" id="processor-step">'+t.step+'</button>'+
      '<label class="report-scrub"><span id="processor-cycle">'+t.cycle+' 01</span><input type="range" id="processor-clock" min="0" max="1" value="0" step="1" aria-label="'+t.slider+'"></label>'+
    '</div>'+
    '<div class="report-event-shortcuts" role="group" aria-label="'+t.events+'">'+
      ['forwarding','stall','flush'].map(name=>'<button type="button" data-event="'+name+'" aria-pressed="false"><strong>'+t[name]+'</strong><span>'+t[name+'Hint']+'</span></button>').join('')+
    '</div>'+
    '<div id="processor-status" class="report-status" role="status"><div class="report-status-heading"><span class="report-event-label"></span><strong class="report-status-title"></strong></div><p class="report-status-detail"></p><p class="report-status-effect"></p></div>'+
    '<div class="report-stage-grid">'+stages.map(([key,code])=>
      '<div class="report-stage" data-stage="'+key+'"><div><strong>'+code+'</strong><span>'+t[key]+'</span></div><code>—</code><small></small></div>').join('')+
    '</div>'+processorDiagramMarkup(language)+memorySlots(t)+
    '<details class="report-inspector"><summary>'+t.trace+'</summary><div class="report-columns">'+
      '<div><h4>'+t.program+' <a href="'+reportPath+'#page=21" target="_blank" rel="noopener noreferrer">'+t.reference+'</a></h4><ol class="report-listing"></ol></div>'+
      '<div><h4>'+t.registers+'</h4><dl class="report-registers">'+CPU_REGISTERS.map((name,i)=>
        '<div data-register="'+i+'"><dt>r'+i+' · '+name+'</dt><dd>0</dd></div>').join('')+'</dl>'+
        '<h4>'+t.decoded+'</h4><code id="processor-word" class="report-word">—</code></div>'+
    '</div></details><p class="report-scope">'+t.goal+'</p></section>';
}
function effectDescription(state,t){
  const effect=state.effect,notes=[];
  if(effect){
    const inst=effect.instruction;
    if(inst.op==='LOAD')notes.push(t.load+' · MEM['+hex(effect.address,3)+'] → '+CPU_REGISTERS[effect.register]+' = '+effect.value);
    else if(inst.op==='STORE')notes.push(t.store+' · MEM['+hex(effect.address,3)+'] ← '+effect.value);
    else if(['ADD','SUB','AND','OR'].includes(inst.op)){
      const op={ADD:'+',SUB:'−',AND:'&',OR:'|'}[inst.op];
      notes.push(CPU_REGISTERS[effect.register]+' ← '+effect.a+' '+op+' '+effect.b+' = '+effect.value);
    }else if(effect.register!=null)notes.push(CPU_REGISTERS[effect.register]+' ← '+effect.value);
  }
  if(state.forwarding)notes.push('EX → ID · '+CPU_REGISTERS[state.forwarding.register]+' = '+state.forwarding.value);
  return notes.join('   ·   ');
}
function cycleDescription(state,t){
  if(state.stall)return {event:'stall',title:t.stallTitle,detail:state.stall.instruction.assembly+t.stallDetail};
  if(state.flush)return {event:'flush',title:t.flushTitle,detail:hex(state.flush.instruction.address)+' · '+state.flush.instruction.assembly+t.flushDetail+hex(state.flush.target)+t.flushEnd};
  if(state.done)return {event:'done',title:t.final,detail:t.finalDetail+' '+t.branch};
  if(state.forwarding){
    const value=CPU_REGISTERS[state.forwarding.register]+' = '+state.forwarding.value;
    return {event:'forwarding',title:t.forwardingTitle,detail:value+t.forwardingDetail+state.stages.decode.assembly+t.forwardingEnd};
  }
  if(state.branch)return {event:'branch',title:state.branch.taken?t.taken+' → '+hex(state.branch.target):t.notTaken,detail:t.branchDetail};
  if(state.effect)return {event:'execute',title:state.stages.execute.assembly,detail:effectDescription(state,t)};
  return {event:'fill',title:state.cycle?t.fill:t.before,detail:state.cycle?t.fillDetail:t.beforeDetail};
}

export function mountProcessorLab(container,language){
  const t=labels[language],root=container.querySelector('.processor-lab');
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  const listeners=new AbortController(),options={signal:listeners.signal};
  let frames=[],listing=[],index=1,timer=null;
  const play=$('#processor-play'),step=$('#processor-step'),clock=$('#processor-clock');
  const entry=$('#processor-entry'),scenario=$('#processor-scenario');
  const status=$('#processor-status'),figureEl=$('[data-report-figure]');
  const stagesUI=$$('.report-stage'),cells=$$('.report-array[data-address]'),registers=$$('.report-registers [data-register]');
  const shortcuts=$$('.report-event-shortcuts [data-event]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  function chooseStart(){
    const hazards=scenario.value==='hazards';
    frames=[createReportCPUState(entry.value==='entry'?'entry':'body',{hazards})];
    while(!frames.at(-1).done){
      if(frames.length>=300)throw new Error('The processor trace did not finish within 300 cycles');
      frames.push(advanceReportCPU(frames.at(-1)));
    }
    index=1;
    clock.max=String(frames.length-1);
    const instructions=entry.value==='entry'?REPORT_LISTING:hazards
      ?[...REPORT_PROGRAM,REPORT_LISTING.find(instruction=>instruction.address===0x3c)]
      :REPORT_PROGRAM;
    $('.report-listing').innerHTML=instructions.map(ins=>
      '<li data-ins="'+ins.address+'"><span>'+hex(ins.address)+'</span><code>'+escapeHTML(ins.assembly)+'</code><b></b></li>').join('');
    listing=$$('[data-ins]');
    $('.report-scope').textContent=(entry.value==='entry'?t.fromEntry+' ':'')+t.goal;
    $('#processor-mode-note').textContent=hazards?t.hazardsNote:t.reportNote;
    root.dataset.scenario=scenario.value;
  }

  function render(){
    const state=frames[index],namedStages=new Map();
    root.dataset.playing=String(timer!==null);
    for(const item of stagesUI){
      const key=item.dataset.stage,instruction=state.stages[key];
      const cancelled=key==='fetch'?state.flush?.instruction:null;
      const shown=instruction||cancelled;
      const frozen=Boolean(state.stall&&key!=='execute');
      const bubble=Boolean(state.stall&&key==='execute');
      item.dataset.active=String(Boolean(instruction));
      item.dataset.hazard=cancelled?'flush':frozen||bubble?'stall':state.forwarding&&key!=='fetch'?'forwarding':'';
      item.querySelector('code').textContent=shown?.assembly||(bubble?t.bubble:'—');
      item.querySelector('small').textContent=shown
        ?hex(shown.address)+(cancelled?' · '+t.cancelled:frozen?' · '+t.frozen:'')
        :bubble?t.noWrite:t.idle;
      if(instruction)namedStages.set(instruction.address,key);
    }
    if(state.flush)namedStages.set(state.flush.instruction.address,'flush');
    updateProcessorDiagram(figureEl,state);
    for(const slot of cells){
      const address=Number(slot.dataset.address),stored=state.memory[address];
      slot.querySelector('output').textContent=stored===undefined?'—':String(stored);
      slot.dataset.access=state.effect?.address===address?state.effect.instruction.op:'';
    }
    for(const row of listing){
      const stage=namedStages.get(Number(row.dataset.ins));
      row.dataset.stage=stage||'';
      row.querySelector('b').textContent=stage?{fetch:'IF',decode:'ID',execute:'EX',flush:'×'}[stage]:'';
    }
    for(const slot of registers){
      const i=Number(slot.dataset.register);
      slot.querySelector('dd').textContent=state.registers[i];
      slot.dataset.written=String(state.effect?.register===i);
    }
    const decoded=state.stages.decode,description=cycleDescription(state,t);
    $('#processor-word').textContent=decoded?.word!=null?hex(decoded.word,4)+' · '+decoded.bits:'—';
    $('#processor-cycle').textContent=t.cycle+' '+String(state.cycle).padStart(2,'0');
    clock.value=String(index);
    clock.setAttribute('aria-valuetext',t.cycle+' '+state.cycle);
    status.dataset.event=description.event;
    status.querySelector('.report-event-label').textContent=t[description.event]||t.ongoing;
    status.querySelector('.report-status-title').textContent=description.title;
    status.querySelector('.report-status-detail').textContent=description.detail;
    const effect=effectDescription(state,t),effectEl=status.querySelector('.report-status-effect');
    effectEl.textContent=effect;
    effectEl.hidden=!effect||effect===description.detail;
    for(const shortcut of shortcuts)shortcut.setAttribute('aria-pressed',String(description.event===shortcut.dataset.event));
    play.textContent=timer!==null?t.pause:state.done?t.restart:t.run;
    play.setAttribute('aria-pressed',String(timer!==null));
    step.disabled=state.done;
  }
  function pause(){
    if(timer!==null)clearInterval(timer);
    timer=null;
    status.setAttribute('aria-live','polite');
  }
  function advance(){
    if(index<frames.length-1)index++;
    if(index===frames.length-1)pause();
    render();
  }
  function start(){
    if(timer!==null)return;
    if(index===frames.length-1)index=0;
    status.setAttribute('aria-live','off');
    timer=setInterval(advance,1250);
    render();
  }
  function setZoom(next){
    figureEl.setAttribute('viewBox',PROCESSOR_VIEW_BOXES[next]);
    figureEl.dataset.zoom=next;
    for(const option of $$('.report-zoom button'))option.setAttribute('aria-pressed',String(option.dataset.zoom===next));
  }
  function changeConfiguration(){
    const playing=timer!==null;
    pause();chooseStart();
    if(playing&&!reduced.matches)start();else render();
  }
  play.addEventListener('click',()=>{if(timer===null)start();else{pause();render();}},options);
  step.addEventListener('click',()=>{pause();advance();},options);
  clock.addEventListener('input',()=>{pause();index=Number(clock.value);render();},options);
  entry.addEventListener('change',changeConfiguration,options);
  scenario.addEventListener('change',changeConfiguration,options);
  for(const shortcut of shortcuts)shortcut.addEventListener('click',()=>{
    pause();
    const event=shortcut.dataset.event;
    if(event!=='forwarding'&&scenario.value!=='hazards'){
      scenario.value='hazards';
      chooseStart();
    }
    let found=event==='forwarding'
      ?frames.findIndex(frame=>frame.forwarding&&frame.stages.decode?.address===0x2c&&frame.effect?.instruction.op==='LOAD')
      :frames.findIndex(frame=>frame[event]&&(event!=='flush'||frame.branch?.instruction.address===0x3a));
    if(found<0)found=frames.findIndex(frame=>frame[event]);
    if(found<0){
      render();status.querySelector('.report-status-detail').textContent=t.unavailable;return;
    }
    index=found;
    setZoom('all');
    render();
  },options);
  for(const button of $$('.report-zoom button[data-zoom]'))button.addEventListener('click',()=>setZoom(button.dataset.zoom),options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();render();}},options);
  reduced.addEventListener('change',()=>{if(reduced.matches){pause();render();}},options);
  chooseStart();
  if(!reduced.matches&&!document.hidden)start();else render();
  return {destroy(){pause();listeners.abort();}};
}
