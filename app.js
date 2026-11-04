import {profile,ui,projects,skills} from './content.js';
import {illustration} from './visuals.js';
import {createScene} from './scene.js';
import {digitLabMarkup,mountDigitLab} from './digit-lab.js';
import {processorLabMarkup,mountProcessorLab} from './processor-lab.js';
import {hardwareLabMarkup,mountHardwareLab} from './hardware-labs.js';
import {filterProjects,presentationFromSearch,escapeHTML as esc} from './project-utils.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const store = {get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
let language=store.get('vw-language')==='en'?'en':'fr';
const audience=presentationFromSearch(location.search);
let category=audience.category,query='',expanded=false,currentProject=null,activeScene=audience.scene,lastFocus=null,projectBackHash='#projects',hasProjectHistory=false,toastTimer;
const projectDialog=$('#project-dialog');
const scene=createScene($('#system-canvas'));
scene.setMode(activeScene);
let digitLab=null,processorLab=null,hardwareLab=null;
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const txt = () => ui[language];
const tags = values => '<ul class="tags">'+values.map(v=>'<li class="tag">'+esc(v)+'</li>').join('')+'</ul>';


function outcomeBlock(project,compact=false){
 if(!project?.outcome)return '';
 const result=project.outcome;
 return '<div class="project-outcome'+(compact?' project-outcome--compact':'')+'"><strong>'+esc(result.value)+'</strong><div><span>'+esc(result.label[language])+'</span>'+(!compact?'<p>'+esc(result.caption[language])+'</p>':'')+'</div></div>';
}

function updateSceneText() {
 const t=txt(),prefix=activeScene==='cpu'?'cpu':activeScene==='robot'?'robot':'neural';
 $$('button[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===activeScene)));
 $('#scene-title').textContent=t[prefix+'Title'];
 $('#scene-description').textContent=t[prefix+'Description'];
 $('#scene-index').textContent=String(['cpu','robot','neural'].indexOf(activeScene)+1).padStart(2,'0')+' / 03';
 $('#system-canvas').setAttribute('aria-label',t[prefix+'Aria']);
 scene.setLanguage(language);
}

function setText() {
 const t=txt();
 $('.summary-strip .summary-number').innerHTML=projects.length+'<span>↗</span>';
 $('.filter-count').textContent=projects.length;
 document.documentElement.lang=language;
 document.title=language==='fr'?'Victor Woelffel — Du signal au système':'Victor Woelffel — From signal to system';
 $$('[data-i18n]').forEach(el=>{const value=t[el.dataset.i18n];if(typeof value==='string')el.textContent=value;});
 const description=language==='fr'?'Victor Woelffel, élève ingénieur à Télécom Paris. Projets, recherche et expériences en IA, systèmes embarqués et robotique.':'Victor Woelffel, Télécom Paris engineering student. Projects, research and experience in AI, embedded systems and robotics.';
 $('meta[name="description"]').content=description;
 $('meta[property="og:title"]').content=document.title;
 $('meta[property="og:description"]').content=description;
 $('meta[property="og:locale"]').content=language==='fr'?'fr_FR':'en_GB';
 $('#language-toggle').setAttribute('aria-label',t.language);
 $('#theme-toggle').setAttribute('aria-label',t.theme);
 $('#menu-toggle').setAttribute('aria-label',$('#mobile-nav').hidden?t.menu:t.close);
 $('#project-search').placeholder=t.searchPlaceholder;
 $('#clear-search').setAttribute('aria-label',t.clearSearch);
 $('#copy-email').setAttribute('aria-label',t.copy);
 $('#close-project').setAttribute('aria-label',t.close);
 $('.brand').setAttribute('aria-label',language==='fr'?'Victor Woelffel — accueil':'Victor Woelffel — home');
 $('.desktop-nav').setAttribute('aria-label',language==='fr'?'Navigation principale':'Main navigation');
 $('#mobile-nav').setAttribute('aria-label',language==='fr'?'Navigation mobile':'Mobile navigation');
 $('.filter-group').setAttribute('aria-label',language==='fr'?'Filtrer les projets':'Filter projects');
 $('.scene-controls').setAttribute('aria-label',language==='fr'?'Choisir une visualisation':'Choose a visualisation');
 $('.summary-strip').setAttribute('aria-label',language==='fr'?'Quelques repères':'A few highlights');
 $('.about-portrait img').alt=t.portraitAlt;
 $('#cv-download').href='./assets/CV_Victor_Woelffel_EN.pdf';
 $('#cv-download').download='CV_Victor_Woelffel_EN.pdf';
 updateMotionButton();updateSceneText();
}

function renderProjects() {
 const t=txt(),filtered=filterProjects(projects,language,category,query);
 const showAll=expanded||category!=='all'||Boolean(query.trim());
 const visible=showAll?filtered:filtered.slice(0,6);
 $('#project-grid').innerHTML=visible.map(p=>{
  const index=String(projects.indexOf(p)+1).padStart(2,'0');
  return '<article class="project-card"><a class="project-open" href="#project/'+p.id+'" data-project="'+p.id+'" aria-labelledby="project-title-'+p.id+'" aria-describedby="project-desc-'+p.id+'"><div class="project-visual" style="--project-color:'+p.color+'">'+illustration(p.visual)+'<span class="project-figure">FIG. '+index+' / '+esc(t.illustrationNote)+'</span><span class="project-arrow" aria-hidden="true">↗</span></div><div class="project-info"><p class="project-meta">'+esc(p.kind[language])+'</p><h3 id="project-title-'+p.id+'">'+esc(p.title[language])+'</h3><p class="project-description" id="project-desc-'+p.id+'">'+esc(p.short[language])+'</p>'+outcomeBlock(p,true)+tags(p.tech.slice(0,4))+'<span class="project-explore"><span>'+esc(t.details)+'</span><span aria-hidden="true">↗</span></span></div></a></article>';
 }).join('');
 $('#result-count').textContent=filtered.length+' '+(filtered.length===1?t.result:t.results);
 $('#showing-count').textContent=visible.length+' / '+filtered.length+' '+t.showing;
 $('#empty-state').hidden=filtered.length>0;
 $('.more-projects').hidden=filtered.length===0;
 $('#show-more').hidden=category!=='all'||Boolean(query.trim())||filtered.length<=6;
 $('#show-more').setAttribute('aria-expanded',String(expanded));
 $('#show-more').setAttribute('aria-controls','project-grid');
 $('#show-more').innerHTML='<span>'+esc(expanded?t.showLess:t.showMore)+'</span><span aria-hidden="true">'+(expanded?'↑':'↓')+'</span>';
 $('#clear-search').hidden=!query;
 $$('.filter-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
}

function renderJourney() {
 const t=txt();
 $('#experience-list').innerHTML=[{n:1,company:'Emerton Data',tech:['Copilot Studio','LangChain','Gurobi','Docker']},{n:2,company:'Capgemini Engineering',tech:['EEG','eCCA','Neural networks','Real-time']}].map(({n,company,tech})=>{
  const stem='exp'+n;
  return '<article class="experience"><div class="experience-aside"><p class="mono">'+esc(t[stem+'Date'])+'</p><h3>'+company+'</h3><p class="experience-location">'+esc(t[stem+'Place'])+'</p></div><div class="experience-body"><h4>'+esc(t[stem+'Role'])+'</h4><p class="experience-intro">'+esc(t[stem+'Intro'])+'</p><ul>'+t[stem+'Bullets'].map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>'+tags(tech)+(n===2?'<div class="experience-results"><div><strong>≈ 95 %</strong><small>'+esc(t.accuracy)+'</small></div><div><strong>&lt; 10 ms</strong><small>'+esc(t.latency)+'</small></div></div><a class="text-button" href="#project/b-reality" data-project="b-reality">'+esc(t.viewStudy)+arrow+'</a>':outcomeBlock(projects.find(p=>p.id==='emerton-optimization'),true)+'<a class="text-button" href="#project/emerton-optimization" data-project="emerton-optimization">'+esc(t.viewOptimization)+arrow+'</a>')+'</div></article>';
 }).join('');
 $('#education-grid').innerHTML=[1,2,3].map(n=>'<article class="education-card"><p class="mono">'+esc(t['edu'+n+'Date'])+'</p><h4>'+esc(t['edu'+n+'Title'])+'</h4><p class="education-sub">'+esc(t['edu'+n+'Sub'])+'</p><p class="education-body">'+esc(t['edu'+n+'Body'])+'</p></article>').join('');
}
function renderAbout() {
 const t=txt();
 $('#skills-list').innerHTML=skills.map((s,i)=>'<div class="skill-group"><p class="mono">'+esc(t.skillCats[i])+'</p>'+tags(s)+'</div>').join('');
 $('#interest-list').innerHTML=t.interests.map(i=>'<span>'+esc(i)+'</span>').join('');
}
function render() {setText();renderProjects();renderJourney();renderAbout();if(currentProject)renderProjectDetail(currentProject);}

function resourceLink(link,index) {
 const attributes=link.download?' download="'+esc(link.download)+'"':' target="_blank" rel="noopener noreferrer"';
 const icon=link.download?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/></svg>':arrow;
 return '<a class="button '+(index===0?'button-primary':'button-secondary')+'" href="'+esc(link.url)+'"'+attributes+'>'+esc(txt()[link.label])+icon+'</a>';
}

function renderProjectDetail(id) {
 const p=projects.find(item=>item.id===id);
 if(!p)return;
 const t=txt(),index=projects.indexOf(p);
 digitLab?.destroy();digitLab=null;processorLab?.destroy();processorLab=null;hardwareLab?.destroy();hardwareLab=null;
 currentProject=id;
 $('#detail-index').textContent=String(index+1).padStart(2,'0')+' / '+String(projects.length).padStart(2,'0')+' — '+t.projectDialog;
 $('#project-detail').innerHTML='<div class="detail-hero '+(['neural-networks','processor','stm32-c','fpga'].includes(id)?'detail-hero--compact':'')+'" style="--project-color:'+p.color+'">'+illustration(p.visual)+'<span class="mono">'+esc(t.illustrationNote)+'</span></div><div class="detail-body"><p class="project-meta">'+esc(p.kind[language])+'</p><h2 id="detail-title">'+esc(p.title[language])+'</h2><p class="detail-lead">'+esc(p.short[language])+'</p>'+outcomeBlock(p)+tags(p.tech)+(p.links.length?'<div class="detail-links detail-links--intro">'+p.links.map(resourceLink).join('')+'</div>':'')+(id==='neural-networks'?digitLabMarkup(language):id==='processor'?processorLabMarkup(language):['stm32-c','fpga'].includes(id)?hardwareLabMarkup(id,language):'')+'<section class="detail-section"><h3>'+esc(t.context)+'</h3><p>'+esc(p.context[language])+'</p></section><section class="detail-section"><h3>'+esc(t.approach)+'</h3><ul>'+p.steps[language].map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></section><section class="detail-section"><h3>'+esc(t.learned)+'</h3><p>'+esc(p.learn[language])+'</p></section>'+(p.note[language]?'<p class="detail-note"><strong>'+esc(t.limits)+'.</strong> '+esc(p.note[language])+'</p>':'')+'</div>';
 if(id==='neural-networks')digitLab=mountDigitLab($('#project-detail'),language);
 if(id==='processor')processorLab=mountProcessorLab($('#project-detail'),language);
 if(['stm32-c','fpga'].includes(id))hardwareLab=mountHardwareLab($('#project-detail'),id,language);
 projectDialog.scrollTop=0;
}
function openProject(id,{route=false}={}) {
 if(!projects.some(p=>p.id===id))return;
 if(!projectDialog.open) {
  lastFocus=document.activeElement;
  if(!location.hash.startsWith('#project/'))projectBackHash=location.hash||'#projects';
  if(!route){history.pushState({vwProject:id},'','#project/'+id);hasProjectHistory=true;}
  renderProjectDetail(id);
  projectDialog.showModal();
  document.body.classList.add('modal-open');
 } else {renderProjectDetail(id);if(!route)history.replaceState({vwProject:id},'','#project/'+id);}
}
function closeProject({historyUpdate=true}={}) {
 if(!projectDialog.open)return;
 const returningId=currentProject;
 digitLab?.destroy();digitLab=null;processorLab?.destroy();processorLab=null;hardwareLab?.destroy();hardwareLab=null;
 currentProject=null;projectDialog.close();document.body.classList.remove('modal-open');
 if(historyUpdate){if(hasProjectHistory){hasProjectHistory=false;history.back();}else {history.replaceState(null,'',projectBackHash);$('#projects').scrollIntoView({behavior:'instant',block:'start'});}}
 const target=lastFocus?.isConnected&&lastFocus!==document.body?lastFocus:document.querySelector('[data-project="'+returningId+'"]')||$('.filter-button');
 if(target instanceof HTMLElement)target.focus({preventScroll:true});
}
function route() {
 const match=location.hash.match(/^#project\/([a-z0-9-]+)$/);
 if(match){if(projects.some(p=>p.id===match[1]))openProject(match[1],{route:true});else history.replaceState(null,'','#projects');}
 else if(projectDialog.open)closeProject({historyUpdate:false});
}
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-project]');
 if(!trigger)return;
 event.preventDefault();openProject(trigger.dataset.project);
});
$('#close-project').addEventListener('click',()=>closeProject());
projectDialog.addEventListener('cancel',event=>{event.preventDefault();closeProject();});
projectDialog.addEventListener('click',event=>{if(event.target!==projectDialog)return;const r=projectDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeProject();});
$('#next-project').addEventListener('click',()=>{const i=projects.findIndex(p=>p.id===currentProject);openProject(projects[(i+1)%projects.length].id);});
$('#previous-project').addEventListener('click',()=>{const i=projects.findIndex(p=>p.id===currentProject);openProject(projects[(i-1+projects.length)%projects.length].id);});
window.addEventListener('popstate',route);
window.addEventListener('hashchange',route);

$$('.filter-button').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;expanded=false;renderProjects();}));
$('#project-search').addEventListener('input',event=>{query=event.target.value;expanded=false;renderProjects();});
$('#clear-search').addEventListener('click',()=>{query='';$('#project-search').value='';renderProjects();$('#project-search').focus();});
$('#reset-filters').addEventListener('click',()=>{query='';category='all';expanded=false;$('#project-search').value='';renderProjects();$('.filter-button').focus();});
$('#show-more').addEventListener('click',()=>{expanded=!expanded;renderProjects();if(!expanded)$('#projects').scrollIntoView({behavior:motionBehavior(),block:'start'});});

$('#language-toggle').addEventListener('click',()=>{language=language==='fr'?'en':'fr';store.set('vw-language',language);render();});
function updateThemeButton() {
 const light=document.documentElement.dataset.theme==='light';
 $('#theme-toggle').innerHTML=light?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
 $('meta[name="theme-color"]').content=light?'#f3f2eb':'#10120f';
 $('#theme-toggle').setAttribute('aria-pressed',String(light));
}
$('#theme-toggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';store.set('vw-theme',document.documentElement.dataset.theme);updateThemeButton();});
function updateMotionButton() {
 const paused=scene.paused;
 $('#motion-toggle').innerHTML=paused?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
 $('#motion-toggle').setAttribute('aria-label',paused?txt().play:txt().pause);
 $('#motion-toggle').setAttribute('aria-pressed',String(paused));
}
$('#motion-toggle').addEventListener('click',()=>{scene.toggle();updateMotionButton();});
$('#system-canvas').addEventListener('motionchange',updateMotionButton);
$$('button[data-scene]').forEach(button=>button.addEventListener('click',()=>{activeScene=button.dataset.scene;scene.setMode(activeScene);$$('button[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateSceneText();}));

function closeMenu(){const menu=$('#mobile-nav');menu.hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').setAttribute('aria-label',txt().menu);}
$('#menu-toggle').addEventListener('click',()=>{const menu=$('#mobile-nav');menu.hidden=!menu.hidden;$('#menu-toggle').setAttribute('aria-expanded',String(!menu.hidden));$('#menu-toggle').setAttribute('aria-label',menu.hidden?txt().menu:txt().close);});
$$('#mobile-nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#mobile-nav').hidden){closeMenu();$('#menu-toggle').focus();}});
matchMedia('(min-width: 721px)').addEventListener('change',closeMenu);

function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},3500);}
$('#copy-email').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(profile.email);toast(txt().copied);}catch{toast(txt().copyFail+' '+profile.email);}});
function motionBehavior(){return matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';}
const sectionObserver=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{if(entry.isIntersecting){$$('.desktop-nav a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});
},{rootMargin:'-15% 0px -60% 0px',threshold:0});
$$('main>section[id]').forEach(section=>sectionObserver.observe(section));
const siteHeader=$('.site-header');
let progressFrame=0,lastScrollY=scrollY,scrollTravel=0;
siteHeader.addEventListener('focusin',()=>siteHeader.classList.remove('header-away'));
function updateProgress(){
 const y=Math.max(0,scrollY),max=document.documentElement.scrollHeight-innerHeight;
 $('.reading-progress').style.transform='scaleX('+(max>0?Math.min(y/max,1):0)+')';
 const delta=y-lastScrollY;
 if(Math.sign(delta)!==Math.sign(scrollTravel))scrollTravel=delta;else scrollTravel+=delta;
 if(y<64||!$('#mobile-nav').hidden||siteHeader.querySelector(':focus-visible'))siteHeader.classList.remove('header-away');
 else if(scrollTravel>16&&y>100)siteHeader.classList.add('header-away');
 else if(scrollTravel< -12)siteHeader.classList.remove('header-away');
 if(y<150)$$('.desktop-nav a').forEach(a=>a.removeAttribute('aria-current'));
 lastScrollY=y;progressFrame=0;
}
window.addEventListener('scroll',()=>{if(!progressFrame)progressFrame=requestAnimationFrame(updateProgress);},{passive:true});
window.addEventListener('resize',updateProgress,{passive:true});

render();updateThemeButton();updateProgress();route();
