import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const dir of ['.','scripts']){
 for(const name of await fs.readdir(path.join(root,dir))){
  if(/\.(?:js|mjs)$/.test(name))execFileSync(process.execPath,['--check',path.join(root,dir,name)],{stdio:'inherit'});
 }
}
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
for(const resource of [...html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)].map(m=>m[1]))await fs.access(path.join(root,resource));
console.log('JavaScript syntax and local HTML resources: OK');
