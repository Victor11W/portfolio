import test from 'node:test';
import assert from 'node:assert/strict';
import {projects,ui} from '../content.js';
import {normalise,escapeHTML,filterProjects,presentationFromSearch} from '../project-utils.js';
import {illustration} from '../visuals.js';
test('project IDs are unique, safe, and stable',()=>{
 assert.equal(projects.length,13);
 assert.equal(new Set(projects.map(p=>p.id)).size,13);
 for(const p of projects)assert.match(p.id,/^[a-z0-9-]+$/);
});
test('all project narratives are present in both languages',()=>{
 for(const p of projects)for(const lang of ['fr','en']){
  for(const field of ['title','kind','short','context','learn'])assert.ok(p[field][lang].trim(),p.id+' '+lang+' '+field);
  assert.ok(p.steps[lang].length>=3);
  assert.ok(p.tech.length>=3);
 }
 assert.deepEqual(Object.keys(ui.fr).sort(),Object.keys(ui.en).sort());
 for(const lang of ['fr','en'])for(const key of ['cpuAria','robotAria','neuralAria','cpuDescription','robotDescription','neuralDescription'])assert.ok(ui[lang][key].length>20);
});
test('project links use HTTPS or packaged document downloads',()=>{
 for(const p of projects)for(const link of p.links){
  if(link.download){assert.match(link.url,/^\.\/assets\/[A-Za-z0-9_]+\.(?:pdf|zip)$/);assert.equal(link.url.split('/').at(-1),link.download);}
  else assert.equal(new URL(link.url).protocol,'https:');
  for(const lang of ['fr','en'])assert.ok(ui[lang][link.label],p.id+' '+lang+' link label');
 }
});
test('search ignores accents and case',()=>{
 assert.equal(normalise('  CŒUR ÉLECTRONIQUE  '),'coeur electronique');
 assert.deepEqual(filterProjects(projects,'fr','all','COEUR').map(p=>p.id),['processor']);
 assert.equal(filterProjects(projects,'fr','all','RISC-V')[0].id,'processor');
 assert.equal(filterProjects(projects,'fr','all','DEPUIS ZERO')[0].id,'stm32-c');
});
test('multi-term queries and domain filters work together',()=>{
 assert.deepEqual(filterProjects(projects,'fr','embedded','STM32 C').map(p=>p.id),['stm32-c','stm32-rust']);
 assert.deepEqual(filterProjects(projects,'en','ai','ONNX').map(p=>p.id),['optiframe']);
 assert.equal(filterProjects(projects,'en','embedded','Hugging Face').length,0);
 assert.equal(filterProjects(projects,'fr','all','not-a-real-project').length,0);
 assert.equal(filterProjects(projects,'en','all','').length,13);
});
test('text encoding protects generated markup',()=>{
 assert.equal(escapeHTML('<img src="x" onerror=\'x\'> &'), '&lt;img src=&quot;x&quot; onerror=&#39;x&#39;&gt; &amp;');
});
test('every project has an original vector illustration with unique definitions',()=>{
 const svgs=projects.map(p=>illustration(p.visual));
 assert.ok(svgs.every(s=>s.includes('<svg')&&s.includes('aria-hidden="true"')&&s.length>800));
 const ids=svgs.flatMap(s=>[...s.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 assert.equal(ids.length,new Set(ids).size);
});

test('presentation links select the intended initial scene and domain',()=>{
 assert.deepEqual(presentationFromSearch(''),{scene:'cpu',category:'all'});
 assert.deepEqual(presentationFromSearch('?focus=embedded'),{scene:'cpu',category:'embedded'});
 assert.deepEqual(presentationFromSearch('?focus=ai'),{scene:'neural',category:'ai'});
 assert.deepEqual(presentationFromSearch('?focus=unknown'),{scene:'cpu',category:'all'});
});

test('contribution-only case studies keep internal documents out of their links',()=>{
 const limited=projects.filter(p=>p.disclosure==='contribution-only');assert.ok(limited.length>0);
 for(const project of limited){assert.deepEqual(project.links,[]);for(const lang of ['fr','en'])assert.ok(project.note[lang].trim());assert.equal(project.outcome.source,'user-confirmed');}
});
