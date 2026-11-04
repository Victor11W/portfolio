import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortfolioServer} from '../scripts/serve.mjs';
import {once} from 'node:events';
const server=createPortfolioServer();
server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
test.after(()=>new Promise(resolve=>server.close(resolve)));
test('local pages and scripts use correct MIME types',async()=>{
 for(const [url,mime] of [['/','text/html'],['/app.js','text/javascript'],['/styles.css','text/css'],['/assets/favicon.svg','image/svg+xml'],['/assets/portrait-victor.jpg','image/jpeg'],['/assets/CV_Victor_Woelffel_EN.pdf','application/pdf'],['/assets/Rapport_RISCV_Architecture_Processeur.pdf','application/pdf'],['/assets/Poster_Q_Learning_Chartichaud.pdf','application/pdf'],['/assets/Code_Reconnaissance_Chiffres.zip','application/zip'],['/assets/digit-model.js','text/javascript']]){
  const r=await fetch(base+url);assert.equal(r.status,200,url);assert.ok(r.headers.get('content-type').includes(mime));assert.ok((await r.arrayBuffer()).byteLength>0);
 }
});
test('HEAD serves headers without a response body',async()=>{const r=await fetch(base+'/',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');assert.ok(Number(r.headers.get('content-length'))>0);});
test('unknown assets return 404 and writes are refused',async()=>{assert.equal((await fetch(base+'/missing-file')).status,404);assert.equal((await fetch(base+'/',{method:'POST'})).status,405);});
test('server does not expose hidden files or parent directories',async()=>{
 for(const url of ['/.git/config','/%2e%2e%2f%2e%2e%2fprofil/bdd_fr.md','/%5c..%5csecret','/%00']){
  const r=await fetch(base+url);assert.ok([400,403,404].includes(r.status),url+' '+r.status);
 }
});

test('withdrawn public files are not served',async()=>{
 const response=await fetch(base+'/assets/CV_Victor_Woelffel_FR.pdf');assert.equal(response.status,404);
});
