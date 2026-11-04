import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProcessorModel,createRobotModel} from '../scene-models.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'design');
await fs.mkdir(output,{recursive:true});
const palette={board:[31,48,34],body:[32,38,30],cap:[49,58,43],die:[61,84,44],core:[78,107,51],coreAccent:[156,193,96],metal:[148,164,126],gold:[172,184,112],cargoGold:[224,183,106],cargoMint:[133,207,187]};
const mtl=['# Original portfolio materials. Y-up geometry.'];
for(const [name,color] of Object.entries(palette)){
 mtl.push('newmtl '+name,'Kd '+color.map(c=>(c/255).toFixed(5)).join(' '),'Ks 0.2 0.2 0.2','Ns 45','');
}
await fs.writeFile(path.join(output,'scene-materials.mtl'),mtl.join('\n'));
for(const [name,model] of [['processor',createProcessorModel()],['robot',createRobotModel()]]){
 const lines=['# Original educational model for Victor Woelffel','mtllib scene-materials.mtl','o '+name,'s off'];
 for(const v of model.vertices)lines.push('v '+v.map(n=>n.toFixed(6)).join(' '));
 let material='';
 for(const face of model.faces){
  const next=face.material||'body';
  if(next!==material){lines.push('usemtl '+next);material=next;}
  lines.push('f '+face.indices.map(i=>i+1).join(' '));
 }
 await fs.writeFile(path.join(output,name+'.obj'),lines.join('\n')+'\n');
}
console.log('Original OBJ models exported in design/.');
