import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {projects,profile} from '../content.js';
import {projectNotes} from '../project-notes.js';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const html=await fs.readFile(path.join(dist,'index.html'),'utf8');
const refs=[...html.matchAll(/\b(?:src|href)="(\.\/[^"]+)"/g)].map(m=>m[1]);
const resources=new Set([...refs,'./details.bundle.js','./project-details.css','./assets/digit-model.js','./assets/processor-report-diagram.png']);
for(const filename of Object.values(profile.resume))resources.add('./assets/'+filename);
for(const p of projects)for(const link of p.links)if(link.url.startsWith('./'))resources.add(link.url);
for(const translations of Object.values(projectNotes))for(const n of Object.values(translations)){
 for(const url of [n.exhibit.href,n.exhibit.image])if(url?.startsWith('./'))resources.add(url);
}
for(const ref of resources){
 const file=path.join(dist,ref.split(/[?#]/)[0]);
 assert((await fs.stat(file)).size>0,'Missing or empty '+ref);
}
// Check both scripts independently; classic scripts also work on file://.
for(const name of ['app.bundle.js','details.bundle.js'])new vm.Script(await fs.readFile(path.join(dist,name),'utf8'),{filename:name});
assert(!html.includes('type="module"'),'Built page still references source modules');
for(const tag of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/g)){
 assert(!/details\.bundle|digit-model\.js|project-details\.css/.test(tag[1]),'Optional resources should not block the home page');
}
assert(!(await fs.readFile(path.join(dist,'project-details.css'),'utf8')).includes('@import'),'Unresolved optional stylesheet');
const entry=['index.html','app.bundle.js','styles.css','preferences.js','assets/favicon.svg'];
let raw=0,gzip=0;
for(const name of entry){const file=await fs.readFile(path.join(dist,name));raw+=file.length;gzip+=gzipSync(file).length;}
console.log('Entry files: '+raw+' bytes raw, '+gzip+' bytes gzip (per-file estimate, no downloads or model).');
assert(gzip<=68*1024,'Home page entry files exceed the 68 KiB gzip budget');
console.log(resources.size+' packaged resources verified.');
