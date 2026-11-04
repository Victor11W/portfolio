import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
// An explicit dependency order keeps this small build transparent and dependency-free.
const initial=['content.js','project-utils.js','visuals.js','scene-models.js','digit-engine.js','digit-samples.js','digit-loader.js','neural-scene.js','solid-renderer.js','processor-engine.js','scene.js','app.js'];
const details=['project-notes.js','digit-lab.js','report-cpu.js','processor-diagram.js','processor-lab.js','hardware-engines.js','hardware-labs.js','project-details.js'];
// File:// cannot import ES modules in all browsers. Build two classic scripts;
// each module keeps its private scope, and the second reuses the first's engines.
async function pack(names) {
 const parts=[];
 for(const name of names){
  let source=await fs.readFile(path.join(root,name),'utf8');
  const exported=[...source.matchAll(/^export (?:const|function|class) (\w+)/gm)].map(m=>m[1]);
  source=source.replace(/^import\s*\{([^}]+)\}\s*from ['"]\.\/([^'"]+)['"];\r?$/gm,(_,bindings,dep)=>'const {'+bindings.trim().replace(/\s+as\s+/g,':')+'}=registry['+JSON.stringify(dep)+'];')
   .replace(/^export (?=(?:const|function|class)\b)/gm,'');
  if(name==='app.js'){
   const hook="()=>import('./project-details.js')";
   if(!source.includes(hook))throw new Error('Missing detail loader');
   source=source.replace(hook,'loadBuiltDetails');
  }
  parts.push('registry['+JSON.stringify(name)+']=(()=>{\n'+source+'\nreturn {'+exported.join(',')+'};\n})();');
 }
 return parts.join('\n');
}
const lazyLoader=`
let detailPromise;
function loadBuiltDetails(){
 if(!detailPromise)detailPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./details.bundle.js',document.baseURI).href;
  script.onload=()=>{try{resolve(script.install(registry));}catch(error){detailPromise=null;reject(error);}finally{script.remove();}};
  script.onerror=()=>{detailPromise=null;script.remove();reject(new Error('Project details unavailable'));};
  document.head.append(script);
 });
 return detailPromise;
}`;
const bundle='/* Generated portfolio entry */\n(()=>{"use strict";\nconst registry={};\n'+lazyLoader+'\n'+await pack(initial)+'\n})();\n';
const secondary='/* Generated on-demand project details */\ndocument.currentScript.install=registry=>{"use strict";\n'+await pack(details)+'\nreturn registry["project-details.js"];};\n';
new vm.Script(bundle);new vm.Script(secondary);
// Only the generated dist folder is removed. Refuse a symlink/junction.
if(path.relative(root,output)!=='dist'||!output.startsWith(root+path.sep))throw new Error('Unexpected build output path');
const previous=await fs.lstat(output).catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
if(previous?.isSymbolicLink())throw new Error('Refusing to replace a linked output directory');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
await fs.writeFile(path.join(output,'app.bundle.js'),bundle);
await fs.writeFile(path.join(output,'details.bundle.js'),secondary);
await fs.copyFile(path.join(root,'project-details.css'),path.join(output,'project-details.css'));
const html=(await fs.readFile(path.join(root,'index.html'),'utf8')).replace('<script type="module" src="./app.js"></script>','<script defer src="./app.bundle.js"></script>');
await fs.writeFile(path.join(output,'index.html'),html);
for(const name of ['styles.css','preferences.js'])await fs.copyFile(path.join(root,name),path.join(output,name));
await fs.cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
await fs.writeFile(path.join(output,'.nojekyll'),'');
console.log('Built dist/ — open dist/index.html directly, or run npm run preview.');
