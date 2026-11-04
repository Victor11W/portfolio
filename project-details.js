import {projectNotes} from './project-notes.js';
import {escapeHTML} from './project-utils.js';
import {digitLabMarkup,mountDigitLab} from './digit-lab.js';
import {processorLabMarkup,mountProcessorLab} from './processor-lab.js';
import {hardwareLabMarkup,mountHardwareLab} from './hardware-labs.js';
import {qlearningLabMarkup,mountQlearningLab} from './qlearning-lab.js';

// Dossiers and their controls load only when a reader opens one.
const caseCopy={
 fr:{role:'Ma contribution',decision:'Le choix technique',result:'Ce que ça donne',evidence:'Pièce technique',source:'Ouvrir la source',skip:'Essayer la démo',details:'Lire le dossier',workshop:'Expérience interactive'},
 en:{role:'My contribution',decision:'The technical choice',result:'The result',evidence:'Technical exhibit',source:'Open the source',skip:'Try the demo',details:'Read the case study',workshop:'Interactive experiment'}
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
 const note=projectNotes[id]?.[lang], t=caseCopy[lang], e=escapeHTML;
 const hardware=id==='stm32-c'||id==='fpga';
 const lab=id==='processor'?processorLabMarkup(lang):id==='neural-networks'?digitLabMarkup(lang):id==='q-learning'?qlearningLabMarkup(lang):hardware?hardwareLabMarkup(id,lang):'';
 // A reader coming for the simulation can jump past the notes without losing the share URL.
 const jump=note&&lab?'<button type="button" class="text-button case-jump" data-detail-jump>'+e(t.skip)+' <span aria-hidden="true">↓</span></button>':'';
 host.innerHTML=jump+(note?caseMarkup(note,lang):'')+(lab?'<div data-detail-lab>'+lab+'</div>':'');
 const heading=host.querySelector('[data-detail-lab] h3');
 if(heading)heading.tabIndex=-1;
 host.querySelector('[data-detail-jump]')?.addEventListener('click',()=>{
  heading.focus({preventScroll:true});
  heading.scrollIntoView({block:'start',behavior:'instant'});
 });
 const controller=id==='processor'?mountProcessorLab(host,lang):id==='neural-networks'?mountDigitLab(host,lang):id==='q-learning'?mountQlearningLab(host,lang):hardware?mountHardwareLab(host,id,lang):null;
 return {hasNotes:Boolean(note),destroy(){controller?.destroy();}};
}
