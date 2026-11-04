import {createProcessorModel,createRobotModel,sceneProjection} from './scene-models.js';
import {createNeuralScene} from './neural-scene.js';
import {createSolidRenderer} from './solid-renderer.js';
import {cpuTimeline,CPU_REGISTERS} from './processor-engine.js';

// Original CPU, pick-and-place robot and a view of the real digit CNN.
export function createScene(canvas) {
 let ctx=canvas.getContext('2d');
 const overlayContext=ctx,floorCanvas=document.getElementById('scene-underlay'),floorContext=floorCanvas.getContext('2d');
 const solid=createSolidRenderer(document.getElementById('scene-solid'));
 const onFloor=callback=>{ctx=floorContext;try{return callback();}finally{ctx=overlayContext;}};
 if(!ctx)return {setMode(){},setLanguage(){},toggle(){return true;},get paused(){return true;}};
 const cpu=createProcessorModel(),cpuFrames=cpuTimeline();
 const neural=createNeuralScene(ctx,()=>draw());
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let mode='cpu',language='fr',paused=reduced.matches,visible=true,frame=0,age=0,last=0,width=0,height=0,targetX=0,targetY=0,panX=0,panY=0;
 const labels={
  fr:{core:'CŒUR DE CALCUL',ports:'CONNEXIONS',joints:'ARTICULATIONS',gripper:'PINCE'},
  en:{core:'COMPUTE CORE',ports:'CONNECTIONS',joints:'JOINTS',gripper:'GRIPPER'}
 };
 const palettes={
  dark:{board:[31,48,34],body:[32,38,30],cap:[49,58,43],die:[61,84,44],core:[78,107,51],coreAccent:[156,193,96],metal:[148,164,126],gold:[172,184,112],cargoGold:[224,183,106],cargoMint:[133,207,187],stageFetch:[119,207,193],stageDecode:[222,192,103],stageExecute:[191,229,130]},
  light:{board:[192,207,169],body:[41,49,37],cap:[62,72,50],die:[84,111,51],core:[111,143,68],coreAccent:[180,210,120],metal:[138,154,113],gold:[151,160,87],cargoGold:[209,155,65],cargoMint:[78,161,143],stageFetch:[57,150,133],stageDecode:[186,150,55],stageExecute:[117,159,58]}
 };
 const light=()=>document.documentElement.dataset.theme==='light';
 const rgba=(a,opacity=1)=>'rgba('+a.map(n=>Math.round(n)).join(',')+','+opacity+')';
 const shade=(a,f)=>a.map(c=>Math.max(0,Math.min(255,c*f)));
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const accent=()=>light()?[66,103,28]:[213,245,144];
 function polygon(points,fill,stroke,lineWidth=.7){
  if(!points.length)return;
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}
 }
 function worldLine(points,project,color,lineWidth=1,dash=[]){
  ctx.beginPath();points.map(project).forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});
  ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
 }
 function worldRing(center,radius,project,fill,stroke,lineWidth=.8){
  const points=Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return project([center[0]+Math.cos(a)*radius,center[1],center[2]+Math.sin(a)*radius]);});
  polygon(points,fill,stroke,lineWidth);
 }
 function text(value,x,y,color,size=9,align='left'){
  ctx.font='400 '+size+'px Consolas, monospace';ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.fillText(value,x,y);
 }
 function shadow(project,scale){
  const p=project([0,-.22,0]);
  ctx.save();ctx.translate(p.x,p.y+scale*.18);ctx.scale(1,.42);
  const g=ctx.createRadialGradient(0,0,0,0,0,scale*2);g.addColorStop(0,light()?'rgba(39,61,18,.16)':'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,scale*2,scale*2,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 function paintMesh(faces,fit){
  const colors=light()?palettes.light:palettes.dark,illumination=[-.42,.85,.32];
  if(solid){
   const visibleFaces=faces.filter(f=>dot(f.normal,fit.view)>.001);
   solid.draw(visibleFaces,fit,width,height,f=>[...shade(colors[f.material],.62+Math.max(0,dot(f.normal,illumination))*.47),f.opacity??1],f=>[...accent(),(light()?.20:.19)*(f.opacity??1)]);
   return;
  }
  faces.filter(f=>dot(f.normal,fit.view)>.001).map(f=>({...f,depth:f.indices.reduce((s,i)=>s+fit.points[i].depth,0)/f.indices.length})).sort((a,b)=>a.depth-b.depth).forEach(f=>{
   const brightness=.62+Math.max(0,dot(f.normal,illumination))*.47+(f.material==='coreAccent'?Math.sin(age*1.7)*.025:0);
   polygon(f.indices.map(i=>fit.points[i]),rgba(shade(colors[f.material],brightness),f.opacity??1),f.curved?null:rgba(accent(),(light()?.27:.29)*(f.opacity??1)),f.material==='metal'?.45:.7);
  });
 }
 function paintCPU(){
  const cpuFrame=cpuFrames[Math.min(cpuFrames.length-1,Math.floor(age/1.7)%(cpuFrames.length+2))],stageNames=['fetch','decode','execute'];
  const cpuFaces=cpu.faces.map(face=>{const index=Number(face.role?.replace('stage',''));return face.role?.startsWith('stage')?{...face,material:cpuFrame.stages[stageNames[index]]?['stageFetch','stageDecode','stageExecute'][index]:'core'}:face;});
  const fit=sceneProjection(cpu.vertices,width,height,{mode,panX,panY,time:age}),{project,points,scale}=fit;
  onFloor(()=>shadow(project,scale));
  paintMesh(cpuFaces.filter(f=>f.role==='board'),fit);
  for(const hole of cpu.holes){
   worldRing(hole,.10,project,light()?'#879776':'#0e170f',rgba(accent(),.3));
   worldRing(hole,.057,project,light()?'#dbe3d1':'#0c120d',null);
  }
  cpu.traces.forEach((trace,index)=>{
   worldLine(trace,project,rgba(accent(),light()?.35:.28),.85);
   if(index%2===0){
    const t=(age*.29+index*.061)%1;
    const segment=Math.min(2,Math.floor(t*3)),f=t*3-segment,a=trace[segment],b=trace[segment+1];
    const p=project(a.map((v,i)=>v+(b[i]-v)*f));
    ctx.fillStyle=rgba(accent(),.95);ctx.beginPath();ctx.arc(p.x,p.y,width<400?1.1:1.5,0,Math.PI*2);ctx.fill();
   }
  });
  // Fine PCB markings reinforce the difference between the board and the package.
  worldLine([[-1.54,.015,-1.15],[-1.54,.015,-1.54],[-1.15,.015,-1.54]],project,rgba(accent(),.48),.8);
  paintMesh(cpuFaces.filter(f=>f.role!=='board'),fit);
  for(const [index,title] of ['IF','ID','EX'].entries()){
   const x=-.38+index*.38,o=project([x,.464,-.12]),ex=project([x+1,.464,-.12]),ez=project([x,.464,.88]);
   ctx.save();ctx.transform((ex.x-o.x)/100,(ex.y-o.y)/100,(ez.x-o.x)/100,(ez.y-o.y)/100,o.x,o.y);ctx.font='600 18px Consolas, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=cpuFrame.stages[stageNames[index]]?'#172218':rgba(accent(),.95);ctx.fillText(title,0,0);ctx.restore();
  }
  text('ISA 16 BITS · '+(language==='fr'?'CYCLE ':'CYCLE ')+String(cpuFrame.cycle).padStart(2,'0'),22,94,rgba(accent(),.8),width<400?7.5:8.5);
  text('PC 0x'+cpuFrame.registers[15].toString(16).padStart(2,'0'),width-22,94,rgba(accent(),.8),width<400?7.5:8.5,'right');
  const y=height-205,gap=8,boxWidth=(width-44-gap*2)/3,pipelineColors=light()?[[57,150,133],[158,130,47],[97,142,39]]:[[119,207,193],[222,192,103],[191,229,130]];
  stageNames.forEach((name,index)=>{
   const instruction=cpuFrame.stages[name],x=22+index*(boxWidth+gap),color=pipelineColors[index];
   ctx.fillStyle=light()?'rgba(243,242,235,.88)':'rgba(16,22,16,.88)';ctx.strokeStyle=rgba(instruction?color:accent(),instruction?.7:.22);ctx.lineWidth=.8;ctx.fillRect(x,y,boxWidth,43);ctx.strokeRect(x,y,boxWidth,43);
   text(['01 / FETCH','02 / DECODE','03 / EXECUTE'][index],x+7,y+12,rgba(instruction?color:accent(),.85),width<400?6.5:7.5);
   const short=instruction?(instruction.op+(instruction.rd!==null&&instruction.rd!==undefined?' '+CPU_REGISTERS[instruction.rd]:instruction.op==='STORE'?' '+CPU_REGISTERS[instruction.rs2]:'')):'—';
   const readable=instruction?(width<400?instruction.assembly.replaceAll('zero','0').replaceAll(', ',','):instruction.assembly):short;
   text(readable,x+7,y+31,rgba(accent(),instruction?1:.45),width<300?7:width<400?8.5:10);
   if(index<2){const from=x+boxWidth,to=from+gap;ctx.beginPath();ctx.moveTo(from,y+23);ctx.lineTo(to,y+23);ctx.strokeStyle=rgba(color,.6);ctx.stroke();if(instruction){const fraction=(age/1.7)%1;ctx.fillStyle=rgba(color,1);ctx.beginPath();ctx.arc(from+(to-from)*fraction,y+23,1.6,0,Math.PI*2);ctx.fill();}}
  });
  const effect=cpuFrame.effect,caption=cpuFrame.forwarding?'EX → ID · '+CPU_REGISTERS[cpuFrame.forwarding.register]+' = '+cpuFrame.forwarding.value:effect?.kind==='memory'?'MEM[0] ← '+effect.value:effect?.kind==='register'?CPU_REGISTERS[effect.register]+' ← '+effect.value:(language==='fr'?'LIRE → DÉCODER → EXÉCUTER':'FETCH → DECODE → EXECUTE');
  text(caption,width/2,y+62,rgba(accent(),.82),width<400?7.5:9,'center');
 }
 function paintRobot(){
  const robot=createRobotModel(age),fit=sceneProjection(robot.vertices,width,height,{mode,panX,panY,time:age}),{project,scale}=fit,pose=robot.pose;
  onFloor(()=>{
  worldRing([0,-.155,0],1.70,project,rgba(accent(),light()?.025:.018),rgba(accent(),.12));
  for(const n of [-1.2,-.6,0,.6,1.2])worldLine([[n,-.154,-1.25],[n,-.154,1.25]],project,rgba(accent(),.06),.6);
  shadow(project,scale*.65);
  pose.objects.forEach(object=>{
   const ground=[object.center[0],-.148,object.center[2]];
   worldRing(ground,.21,project,light()?'rgba(30,42,20,.10)':'rgba(0,0,0,.35)',null);
  });
  });
  paintMesh(robot.faces,fit);
  const names=language==='fr'?{approach:'APPROCHE',pick:'SAISIE',grip:'SAISIE',lift:'LEVAGE',carry:'TRANSPORT',place:'DÉPOSE',release:'DÉPOSE',return:'RETOUR',complete:'PILE TERMINÉE',reset:'NOUVEAU CYCLE'}:{approach:'APPROACH',pick:'PICK',grip:'GRIP',lift:'LIFT',carry:'TRANSFER',place:'PLACE',release:'RELEASE',return:'RETURN',complete:'STACK COMPLETE',reset:'NEW CYCLE'};
  text(names[pose.phase],22,94,rgba(accent(),.83),width<400?8:9);
  text(String(pose.stacked).padStart(2,'0')+' / 03',width-22,94,rgba(accent(),.83),width<400?8:9,'right');
 }
 function draw(delta=0){
  if(!width||!height)return;
  if(!paused)age+=delta;
  if(paused){panX=targetX;panY=targetY;}else{panX+=(targetX-panX)*.06;panY+=(targetY-panY)*.06;}
  ctx.clearRect(0,0,width,height);floorContext.clearRect(0,0,width,height);solid?.clear();
  onFloor(()=>{
  const glow=ctx.createRadialGradient(width*.5,height*.45,0,width*.5,height*.45,width*.55);
  glow.addColorStop(0,rgba(accent(),light()?.035:.055));glow.addColorStop(1,rgba(accent(),0));ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  });
  if(mode==='cpu')paintCPU();else if(mode==='robot')paintRobot();else neural.paint(width,height,age,light(),language,panX,panY,solid);
 }
 function tick(now){const delta=last?(now-last)/1000:0;last=now;draw(delta);if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
 function start(){cancelAnimationFrame(frame);last=0;if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);else draw();}
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);floorCanvas.width=canvas.width;floorCanvas.height=canvas.height;floorContext.setTransform(dpr,0,0,dpr,0,0);solid?.resize(canvas.width,canvas.height);draw();}
 function pointerMove(event){const r=canvas.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5;if(paused)draw();}
 function pointerLeave(){targetX=0;targetY=0;if(paused)draw();}
 function visibility(){if(document.hidden)cancelAnimationFrame(frame);else start();}
 function motionChange(){paused=reduced.matches;canvas.dispatchEvent(new CustomEvent('motionchange',{detail:{paused}}));start();}
 canvas.addEventListener('pointermove',pointerMove,{passive:true});canvas.addEventListener('pointerleave',pointerLeave,{passive:true});
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motionChange);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
 const intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else cancelAnimationFrame(frame);});intersectionObserver.observe(canvas);
 const themeObserver=new MutationObserver(()=>{if(paused)draw();});themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 canvas.dataset.scene=mode;resize();start();
 return {
  setMode(next){if(!['cpu','robot','neural'].includes(next))return;mode=next;age=0;canvas.dataset.scene=mode;if(mode==='neural')neural.activate();start();},
  setLanguage(next){language=next==='en'?'en':'fr';if(paused)draw();},
  toggle(){paused=!paused;start();return paused;},
  get paused(){return paused;},
  destroy(){solid?.destroy();cancelAnimationFrame(frame);resizeObserver.disconnect();intersectionObserver.disconnect();themeObserver.disconnect();canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',pointerLeave);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChange);}
 };
}
