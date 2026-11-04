import {loadDigitModel} from './digit-loader.js';
import {predictDigit,prepareDigitPixels} from './digit-engine.js';
import {drawDigitExample} from './digit-samples.js';

// A reduced 2D view of the real CNN: sampled channels and actual activations.
export function createNeuralScene(ctx,onReady) {
 let results=null,pending=false,failed=false,lastAnnouncement='';
 const channels1=[0,5,11,17,23,31],channels2=[0,12,25,38,50,63],units=[0,18,36,54,72,90,108,127];
 const meanAbs=(values,start,length)=>{let sum=0;for(let i=start;i<start+length;i++)sum+=Math.abs(values[i]);return sum/length;};
 function bitmap(pixels){const canvas=document.createElement('canvas');canvas.width=28;canvas.height=28;const c=canvas.getContext('2d'),image=c.createImageData(28,28);pixels.forEach((v,i)=>{image.data[i*4]=image.data[i*4+1]=image.data[i*4+2]=v;image.data[i*4+3]=255;});c.putImageData(image,0,0);return canvas;}
 async function activate(){
  if(results||pending)return;pending=true;failed=false;
  try{
   const model=await loadDigitModel();
   results=[7,2,0].map(digit=>{
    const sketch=document.createElement('canvas');sketch.width=sketch.height=280;const c=sketch.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,280,280);drawDigitExample(c,digit);
    const {pixels}=prepareDigitPixels(c.getImageData(0,0,280,280).data,280,280),result=predictDigit(pixels,model);
    const values=[[1],channels1.map(channel=>meanAbs(result.features,channel*169,169)),channels2.map(channel=>meanAbs(result.features2,channel*25,25)),units.map(unit=>result.hidden[unit]),result.scores];
    const links=[channels1.map(channel=>meanAbs(model['conv1.weight'],channel*9,9)),channels1.flatMap(ic=>channels2.map(oc=>meanAbs(model['conv2.weight'],(oc*32+ic)*9,9))),channels2.flatMap(ic=>units.map(oc=>meanAbs(model['fc1.weight'],oc*1600+ic*25,25))),units.flatMap(ic=>result.scores.map((_,oc)=>Math.abs(model['fc2.weight'][oc*128+ic])))];
    return {digit,prediction:result.scores.indexOf(Math.max(...result.scores)),values,links,image:bitmap(pixels)};
   });
  }catch{failed=true;}finally{pending=false;onReady();}
 }
 function paint(width,height,time,light,language){
  const ink=light?'#41651c':'#d5f590',muted=light?'#59674d':'#a5b79a',line=light?'66,103,28':'192,225,145';
  const label=(value,x,y,size=9,align='center',color=muted)=>{ctx.font='400 '+size+'px Consolas, monospace';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);};
  if(!results){label(failed?(language==='fr'?'Modèle indisponible · réessayez':'Model unavailable · try again'):(language==='fr'?'Chargement du CNN…':'Loading the CNN…'),width/2,height*.45,11);return;}
  const result=results[Math.floor(time/7.5)%results.length],phase=time%7.5,stage=Math.min(4,Math.floor(phase/1.15)),top=132,bottom=height-202,cy=(top+bottom)/2,span=Math.min(184,bottom-top);
  const columns=[.10,.31,.51,.71,.89].map(r=>r*width),nodes=result.values.map((values,layer)=>values.map((value,index)=>({x:columns[layer],y:cy+(index-(values.length-1)/2)*(values.length===1?0:span/(values.length-1)),value,index})));
  for(let layer=0;layer<4;layer++){
   const strength=result.links[layer],peak=Math.max(...strength,.001);let edge=0;
   for(const from of nodes[layer])for(const to of nodes[layer+1]){
    const power=strength[edge++]/peak,active=stage>=layer,opacity=(light?.13:.11)+(active?power*.22:0),start=from.x+(layer===0?18:0),middle=(from.x+to.x)/2;
    ctx.beginPath();ctx.moveTo(start,from.y);ctx.bezierCurveTo(middle,from.y,middle,to.y,to.x,to.y);ctx.strokeStyle='rgba('+line+','+opacity+')';ctx.lineWidth=.55+power*.45;ctx.stroke();
    if(stage===layer&&power>.4){const t=(phase/1.15)%1,u=1-t,x=u*u*u*start+3*u*u*t*middle+3*u*t*t*middle+t*t*t*to.x,y=u*u*u*from.y+3*u*u*t*from.y+3*u*t*t*to.y+t*t*t*to.y;ctx.beginPath();ctx.arc(x,y,1.45,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();}
   }
  }
  const imageSize=width<360?34:44;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(result.image,columns[0]-imageSize/2,cy-imageSize/2,imageSize,imageSize);ctx.restore();ctx.strokeStyle='rgba('+line+',.5)';ctx.lineWidth=.8;ctx.strokeRect(columns[0]-imageSize/2-.5,cy-imageSize/2-.5,imageSize+1,imageSize+1);
  for(let layer=1;layer<5;layer++){
   const peak=Math.max(.001,...result.values[layer]);
   nodes[layer].forEach(node=>{
    const value=node.value/peak,active=stage>=layer,winning=layer===4&&node.index===result.prediction,radius=winning?5.9:3.5+value*1.4;
    if(active&&value>.15){const glow=ctx.createRadialGradient(node.x,node.y,1,node.x,node.y,radius*2.7);glow.addColorStop(0,'rgba('+line+','+(.12+value*.20)+')');glow.addColorStop(1,'rgba('+line+',0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(node.x,node.y,radius*2.7,0,Math.PI*2);ctx.fill();}
    ctx.beginPath();ctx.arc(node.x,node.y,radius,0,Math.PI*2);ctx.fillStyle=light?'#f3f2eb':'#131b12';ctx.fill();ctx.fillStyle=active?'rgba('+line+','+(.15+value*.85)+')':(light?'#e4e9d9':'#20291c');ctx.fill();ctx.strokeStyle=active?ink:muted;ctx.lineWidth=winning?1.3:.8;ctx.stroke();
    if(layer===4)label(String(node.index),node.x+11,node.y,winning?11:8,'left',winning&&active?ink:muted);
   });
  }
  const captions=['28 × 28','32','64','128','10'],names=language==='fr'?['PIXELS','CONV.','CONV.','DENSE','SORTIE']:['PIXELS','CONV.','CONV.','DENSE','OUTPUT'];
  columns.forEach((x,index)=>{label(names[index],x,height-187,width<360?6.8:8);label(captions[index],x,height-173,width<360?8:10,'center',ink);});
  label(language==='fr'?'CNN DU PROJET · MNIST':'PROJECT CNN · MNIST',22,94,width<360?7:8,'left',ink);if(stage===4)label(result.digit+' → '+result.prediction,width-22,94,12,'right',ink);
  label(language==='fr'?'VUE SIMPLIFIÉE · ACTIVATIONS RÉELLES':'REDUCED VIEW · REAL ACTIVATIONS',width/2,height-147,width<360?6.8:8);
  const announce=language+':'+result.digit+':'+result.prediction;if(announce!==lastAnnouncement){lastAnnouncement=announce;ctx.canvas.setAttribute('aria-label',language==='fr'?'Réseau convolutif MNIST du projet. Exemple '+result.digit+', réponse calculée '+result.prediction+'. Canaux et neurones représentatifs, activations réelles.':'The project’s MNIST convolutional network. Example '+result.digit+', computed prediction '+result.prediction+'. Representative channels and neurons, real activations.');}
 }
 return {activate,paint};
}
