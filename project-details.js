import {projectNotes} from './project-notes.js';
import {escapeHTML} from './project-utils.js';
import {digitLabMarkup,mountDigitLab} from './digit-lab.js';
import {processorLabMarkup,mountProcessorLab} from './processor-lab.js';
import {hardwareLabMarkup,mountHardwareLab} from './hardware-labs.js';

// Dossiers and their controls load only when a reader opens one.
const caseCopy={
 fr:{role:'Ma contribution',decision:'Le choix technique',result:'Ce que ça donne',evidence:'Pièce technique',details:'Lire le dossier'},
 en:{role:'My contribution',decision:'The technical choice',result:'The result',evidence:'Technical exhibit',details:'Read the case study'}
};
function caseMarkup(note,lang){
 const t=caseCopy[lang],e=escapeHTML,ex=note.exhibit;
 const evidence=ex.image
  ? '<img class="case-drawing" src="'+e(ex.image)+'" alt="'+e(ex.alt)+'" loading="lazy">'
  : '<pre class="case-code" dir="ltr"><code>'+e(ex.body)+'</code></pre>';
 const reference=ex.href?'<a href="'+e(ex.href)+'" target="_blank" rel="noopener noreferrer">'+e(ex.reference)+' ↗</a>':e(ex.reference);
 return '<section class="case-study" aria-labelledby="case-title"><p class="case-kicker">'+e(t.details)+'</p><h3 id="case-title" tabindex="-1">'+e(note.title)+'</h3><dl class="case-rows">'+['role','decision','result'].map((key,i)=>'<div><dt><span aria-hidden="true">0'+(i+1)+'</span>'+e(t[key])+'</dt><dd>'+e(note[key])+'</dd></div>').join('')+'</dl><figure class="case-exhibit"><figcaption><span>'+e(t.evidence)+'</span><strong>'+e(ex.label)+'</strong></figcaption>'+evidence+'<p>'+e(ex.caption)+'</p><footer>'+reference+'</footer></figure></section>';
}
export function mountProjectDetails(host,id,lang){
 const note=projectNotes[id]?.[lang];
 let markup='';
 let mount;
 if(id==='processor'){
  markup=processorLabMarkup(lang);
  mount=()=>mountProcessorLab(host,lang);
 }else if(id==='neural-networks'){
  markup=digitLabMarkup(lang);
  mount=()=>mountDigitLab(host,lang);
 }else if(id==='stm32-c'||id==='fpga'){
  markup=hardwareLabMarkup(id,lang);
  mount=()=>mountHardwareLab(host,id,lang);
 }
 host.innerHTML=markup+(note?caseMarkup(note,lang):'');
 const controller=mount?.();
 return {hasNotes:Boolean(note),destroy(){controller?.destroy();}};
}
