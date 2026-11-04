import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const name of ['content.js','project-utils.js','visuals.js','scene-models.js','digit-engine.js','digit-samples.js','digit-loader.js','neural-scene.js','solid-renderer.js','processor-engine.js','scene.js','digit-lab.js','processor-lab.js','hardware-engines.js','hardware-labs.js','app.js','preferences.js','scripts/build.mjs','scripts/check.mjs','scripts/git.mjs','scripts/serve.mjs','scripts/deploy.mjs','scripts/ci/package.mjs','scripts/ci/deploy.mjs','scripts/export-scene-models.mjs'])execFileSync(process.execPath,['--check',path.join(root,name)],{stdio:'inherit'});
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
for(const resource of [...html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)].map(m=>m[1]))await fs.access(path.join(root,resource));
console.log('JavaScript syntax and local HTML resources: OK');
