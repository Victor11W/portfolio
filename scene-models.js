// Original schematic models for the portfolio.
export function createProcessorModel() {
 const vertices=[],faces=[],traces=[],holes=[],details=[];
 function prism(center,size,material,bevel=0,role='component'){
  const [x,y,z]=center,[sx,sy,sz]=size,hx=sx/2,hz=sz/2,b=Math.min(bevel,hx/2,hz/2);
  const ring=b>0?[[-hx+b,-hz],[hx-b,-hz],[hx,-hz+b],[hx,hz-b],[hx-b,hz],[-hx+b,hz],[-hx,hz-b],[-hx,-hz+b]]:[[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]];
  const offset=vertices.length,n=ring.length;
  for(const h of [-sy/2,sy/2])for(const [a,c] of ring)vertices.push([x+a,y+h,z+c]);
  faces.push({indices:ring.map((_,i)=>offset+n+i).reverse(),normal:[0,1,0],material,role});
  faces.push({indices:ring.map((_,i)=>offset+i),normal:[0,-1,0],material,role});
  for(let i=0;i<n;i++){
   const j=(i+1)%n,dx=ring[j][0]-ring[i][0],dz=ring[j][1]-ring[i][1],l=Math.hypot(dx,dz);
   faces.push({indices:[offset+n+i,offset+n+j,offset+j,offset+i],normal:[dz/l,0,-dx/l],material,role});
  }
 }
 prism([0,-.085,0],[3.35,.17,3.35],'board',.18,'board');
 for(const x of [-1.43,1.43])for(const z of [-1.43,1.43])holes.push([x,.008,z]);
 for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  for(let i=0;i<8;i++){
   const u=-.77+i*.22,t=[-nz,nx],point=(radius,y,along=u)=>[nx*radius+t[0]*along,y,nz*radius+t[1]*along];
   const transverse=nx!==0;
   prism(point(1.055,.18),transverse?[.29,.065,.09]:[.09,.065,.29],'metal');
   prism(point(1.19,.115),transverse?[.05,.15,.09]:[.09,.15,.05],'metal');
   prism(point(1.30,.035),transverse?[.23,.07,.11]:[.11,.07,.23],'gold');
   traces.push([point(1.63,.012,u*.92),point(1.51,.012,u*.92),point(1.43,.012),point(1.29,.012)]);
  }
 }
 prism([0,.19,0],[1.96,.28,1.96],'body',.11);
 prism([0,.352,0],[1.78,.075,1.78],'cap',.09);
 prism([0,.408,-.12],[1.22,.055,1.14],'die',.045);
 for(let j=0;j<3;j++)for(let i=0;i<3;i++){
  prism([-.38+i*.38,.444,-.47+j*.35],[.31,.018,.27],(i+j)%3===0?'coreAccent':'core',.015,'stage'+i);
 }
 for(const [x,z] of [[-1.25,-1.39],[-.9,-1.39],[.9,1.39],[1.25,1.39],[-1.39,.9],[1.39,-.9]]){
  prism([x,.055,z],[.17,.11,.1],'body',.015);
  prism([x-.065,.057,z],[.035,.12,.105],'metal');
  prism([x+.065,.057,z],[.035,.12,.105],'metal');
 }
 details.push({kind:'label',text:'CPU',point:[0,.394,.69]});
 return {vertices,faces,traces,holes,details,pinCount:32};
}
// A schematic pick-and-place cycle. Not a claim of a robot physically built by Victor.
export const ROBOT_CYCLE_SECONDS=19.8;
const robotSources=[{radius:1.24,yaw:-.44},{radius:1.46,yaw:-.05},{radius:1.31,yaw:.34}];
const robotStack={radius:1.26,yaw:2.67};
const robotEase=t=>{const a=Math.max(0,Math.min(1,t));return a*a*(3-2*a);};
const robotMix=(a,b,t)=>a+(b-a)*robotEase(t);
const robotWorld=(radius,y,yaw)=>[radius*Math.cos(yaw),y,radius*Math.sin(yaw)];
export function robotKinematics(time=0) {
 const cycle=((time%ROBOT_CYCLE_SECONDS)+ROBOT_CYCLE_SECONDS)%ROBOT_CYCLE_SECONDS,index=Math.min(2,Math.floor(cycle/5.6)),local=Math.min(5.6,cycle-index*5.6);
 const source=robotSources[index],target=robotStack,previous=index===0?robotSources[0]:target;
 const pickY=.37,placeY=.37+index*.28,hoverY=1.74,open=.265,closed=.18;
 let radius=source.radius,y=hoverY,yaw=source.yaw,jawGap=open,phase='approach';
 if(local<.8){radius=robotMix(previous.radius,source.radius,local/.8);yaw=robotMix(previous.yaw,source.yaw,local/.8);}
 else if(local<1.6){y=robotMix(hoverY,pickY,(local-.8)/.8);phase='pick';}
 else if(local<2){y=pickY;jawGap=robotMix(open,closed,(local-1.6)/.4);phase='grip';}
 else if(local<2.7){y=robotMix(pickY,hoverY,(local-2)/.7);jawGap=closed;phase='lift';}
 else if(local<3.8){radius=robotMix(source.radius,target.radius,(local-2.7)/1.1);yaw=robotMix(source.yaw,target.yaw,(local-2.7)/1.1);jawGap=closed;phase='carry';}
 else if(local<4.5){radius=target.radius;y=robotMix(hoverY,placeY,(local-3.8)/.7);yaw=target.yaw;jawGap=closed;phase='place';}
 else if(local<4.9){radius=target.radius;y=placeY;yaw=target.yaw;jawGap=robotMix(closed,open,(local-4.5)/.4);phase='release';}
 else {radius=target.radius;y=robotMix(placeY,hoverY,(local-4.9)/.7);yaw=target.yaw;phase='return';}
 let resetOpacity=1;
 if(cycle>=16.8){
  radius=robotMix(target.radius,robotSources[0].radius,(cycle-17.7)/1.6);yaw=robotMix(target.yaw,robotSources[0].yaw,(cycle-17.7)/1.6);y=hoverY;jawGap=open;phase=cycle<17.7?'complete':'reset';
  resetOpacity=1-robotEase((cycle-19.2)/.6);
 }
 const shoulder=[0,.77,0],upperLength=1.15,forearmLength=.97,dx=radius,dy=y-shoulder[1];
 const bend=-Math.acos(Math.max(-1,Math.min(1,(dx*dx+dy*dy-upperLength*upperLength-forearmLength*forearmLength)/(2*upperLength*forearmLength))));
 const shoulderAngle=Math.atan2(dy,dx)-Math.atan2(forearmLength*Math.sin(bend),upperLength+forearmLength*Math.cos(bend)),forearmAngle=shoulderAngle+bend;
 const elbow=[upperLength*Math.cos(shoulderAngle),shoulder[1]+upperLength*Math.sin(shoulderAngle),0];
 const wrist=[elbow[0]+forearmLength*Math.cos(forearmAngle),elbow[1]+forearmLength*Math.sin(forearmAngle),0];
 const rotate=p=>[p[0]*Math.cos(yaw)-p[2]*Math.sin(yaw),p[1],p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw)];
 const grasp=rotate([wrist[0],wrist[1]-.38,0]);
 const objects=robotSources.map((position,i)=>{
  let center=robotWorld(position.radius,-.01,position.yaw),objectYaw=position.yaw,state='waiting';
  if(i<index||cycle>=16.8||(i===index&&local>=4.7)){center=robotWorld(target.radius,-.01+i*.28,target.yaw);objectYaw=target.yaw;state='stacked';}
  else if(i===index&&local>=2&&local<4.7){center=grasp.slice();objectYaw=yaw;state='held';}
  return {center,yaw:objectYaw,state,opacity:resetOpacity};
 });
 return {shoulder:rotate(shoulder),elbow:rotate(elbow),wrist:rotate(wrist),local:{shoulder,elbow,wrist},grasp,yaw,shoulderAngle,forearmAngle,toolAngle:-Math.PI/2,jawGap,upperLength,forearmLength,objects,phase,index,cycle,stacked:objects.filter(o=>o.state==='stacked').length};
}
export function createRobotModel(time=0) {
 const vertices=[],faces=[],pose=robotKinematics(time),localPose=pose.local;
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
 const norm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 function prism(center,size,material,bevel=.025,transform=null){
  const [sx,sy,sz]=size,hx=sx/2,hz=sz/2,b=Math.min(bevel,hx*.5,hz*.5);
  const ring=b>0?[[-hx+b,-hz],[hx-b,-hz],[hx,-hz+b],[hx,hz-b],[hx-b,hz],[-hx+b,hz],[-hx,hz-b],[-hx,-hz+b]]:[[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]];
  const offset=vertices.length,n=ring.length;
  const point=p=>transform?add(center,transform(p)):add(center,p),normal=p=>transform?transform(p):p;
  for(const h of [-sy/2,sy/2])for(const [x,z] of ring)vertices.push(point([x,h,z]));
  faces.push({indices:ring.map((_,i)=>offset+n+i).reverse(),normal:normal([0,1,0]),material});
  faces.push({indices:ring.map((_,i)=>offset+i),normal:normal([0,-1,0]),material});
  for(let i=0;i<n;i++){
   const j=(i+1)%n,dx=ring[j][0]-ring[i][0],dz=ring[j][1]-ring[i][1],l=Math.hypot(dx,dz);
   faces.push({indices:[offset+n+i,offset+n+j,offset+j,offset+i],normal:normal([dz/l,0,-dx/l]),material});
  }
 }
 function cylinder(center,radius,length,axis,material,segments=24){
  const w=norm(axis),reference=Math.abs(w[1])<.9?[0,1,0]:[0,0,1],u=norm(cross(reference,w)),v=cross(w,u),offset=vertices.length;
  for(const sign of [-1,1])for(let i=0;i<segments;i++){
   const a=i/segments*Math.PI*2;
   vertices.push(add(center,add(mul(w,sign*length/2),add(mul(u,Math.cos(a)*radius),mul(v,Math.sin(a)*radius)))));
  }
  faces.push({indices:Array.from({length:segments},(_,i)=>offset+segments+i),normal:w,material});
  faces.push({indices:Array.from({length:segments},(_,i)=>offset+i).reverse(),normal:mul(w,-1),material});
  for(let i=0;i<segments;i++){
   const j=(i+1)%segments,a=(i+.5)/segments*Math.PI*2;
   faces.push({indices:[offset+i,offset+j,offset+segments+j,offset+segments+i],normal:add(mul(u,Math.cos(a)),mul(v,Math.sin(a))),material,curved:true});
  }
 }
 function beam(start,end,width,depth,material,zOffset=0){
  const d=sub(end,start),length=Math.hypot(...d),uy=mul(d,1/length),ux=[uy[1],-uy[0],0],center=mul(add(start,end),.5);center[2]+=zOffset;
  const transform=p=>[ux[0]*p[0]+uy[0]*p[1],ux[1]*p[0]+uy[1]*p[1],p[2]];
  prism(center,[width,length,depth],material,.035,transform);
 }
 function interpolate(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
 function joint(center,radius,depth){
  cylinder(center,radius,depth,[0,0,1],'body');
  for(const side of [-1,1]){
   const p=add(center,[0,0,side*(depth/2+.015)]);
   cylinder(p,radius*.77,.04,[0,0,1],'coreAccent');
   cylinder(add(p,[0,0,side*.025]),radius*.38,.065,[0,0,1],'metal');
  }
 }
 prism([0,-.075,0],[1.52,.15,1.30],'cap',.16);
 for(const x of [-.61,.61])for(const z of [-.50,.50])cylinder([x,.012,z],.065,.035,[0,1,0],'metal',12);
 cylinder([0,.13,0],.48,.26,[0,1,0],'body');
 cylinder([0,.275,0],.485,.045,[0,1,0],'coreAccent');
 cylinder([0,.33,0],.41,.08,[0,1,0],'cap');
 const armVertexStart=vertices.length,armFaceStart=faces.length;
 prism([0,.52,0],[.52,.34,.47],'cap',.05);
 beam(localPose.shoulder,localPose.elbow,.31,.40,'cap');
 beam(interpolate(localPose.shoulder,localPose.elbow,.16),interpolate(localPose.shoulder,localPose.elbow,.84),.15,.035,'coreAccent',.223);
 beam(localPose.elbow,localPose.wrist,.27,.34,'cap');
 beam(interpolate(localPose.elbow,localPose.wrist,.18),interpolate(localPose.elbow,localPose.wrist,.80),.13,.035,'coreAccent',.196);
 joint(localPose.shoulder,.29,.56);joint(localPose.elbow,.245,.48);joint(localPose.wrist,.17,.39);
 const down=[Math.cos(pose.toolAngle),Math.sin(pose.toolAngle),0],across=[-down[1],down[0],0];
 const palm=add(localPose.wrist,mul(down,.175)),palmFaceStart=faces.length;
 beam(localPose.wrist,palm,.23,.28,'body');
 const crossA=add(palm,mul(across,-.22)),crossB=add(palm,mul(across,.22));
 beam(crossA,crossB,.115,.30,'metal');
 for(let i=palmFaceStart;i<faces.length;i++)faces[i].role='palm';
 for(const sign of [-1,1]){
  const root=add(palm,mul(across,sign*pose.jawGap)),tip=add(root,mul(down,.305));
  const gripperFaceStart=faces.length;
  beam(root,tip,.065,.20,'cap');
  // Contact pad remains outside the cube: no inward hook through the payload.
  const padCenter=add(root,add(mul(down,.20),mul(across,-sign*.027)));
  prism(padCenter,[.016,.10,.16],'coreAccent',.004);
  for(let i=gripperFaceStart;i<faces.length;i++)faces[i].role='gripper';
 }
 const rotate=p=>[p[0]*Math.cos(pose.yaw)-p[2]*Math.sin(pose.yaw),p[1],p[0]*Math.sin(pose.yaw)+p[2]*Math.cos(pose.yaw)];
 for(let i=armVertexStart;i<vertices.length;i++)vertices[i]=rotate(vertices[i]);
 for(let i=armFaceStart;i<faces.length;i++)faces[i].normal=rotate(faces[i].normal);
 pose.objects.forEach((object,index)=>{
  const firstFace=faces.length,c=Math.cos(object.yaw),s=Math.sin(object.yaw);
  prism(object.center,[.28,.28,.28],['cargoGold','cargoMint','coreAccent'][index],.025,p=>[p[0]*c-p[2]*s,p[1],p[0]*s+p[2]*c]);
  for(let i=firstFace;i<faces.length;i++){faces[i].opacity=object.opacity;faces[i].role='cargo';}
 });
 return {vertices,faces,pose};
}

let robotFramingVertices;
export function sceneProjection(vertices,width,height,{mode='cpu',panX=0,panY=0,time=0}={}) {
 const yaw=-.59+panX*.32+(mode==='cpu'?Math.sin(time*.18)*.022:0);
 const elevation=(mode==='cpu'?.85:.47)+panY*.14;
 const cy=Math.cos(yaw),sy=Math.sin(yaw),ce=Math.cos(elevation),se=Math.sin(elevation);
 function raw(p){
  const x=p[0]*cy-p[2]*sy,z=p[0]*sy+p[2]*cy,y=p[1];
  const depth=y*se+z*ce,perspective=6/(6-depth*.08);
  return {x:x*perspective,y:-(y*ce-z*se)*perspective,depth};
 }
 const points=vertices.map(raw);
 if(mode==='robot'&&!robotFramingVertices){
  robotFramingVertices=[];
  const box=(center,radius)=>{const r=Array.isArray(radius)?radius:[radius,radius,radius];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])robotFramingVertices.push([center[0]+x*r[0],center[1]+y*r[1],center[2]+z*r[2]]);};
  for(let t=0;t<ROBOT_CYCLE_SECONDS;t+=.3){const pose=robotKinematics(t);box(pose.elbow,.30);box(pose.wrist,.23);box(pose.grasp,[.34,.22,.34]);pose.objects.forEach(o=>box(o.center,.21));}
  box([0,.475,0],[.78,.645,.67]);
 }
 const frameVertices=mode==='robot'?robotFramingVertices:vertices;
 const bounds=frameVertices.map(raw);
 const minX=Math.min(...bounds.map(p=>p.x)),maxX=Math.max(...bounds.map(p=>p.x)),minY=Math.min(...bounds.map(p=>p.y)),maxY=Math.max(...bounds.map(p=>p.y));
 const top=width<400?96:100,bottom=height-(mode==='cpu'?220:140),margin=width<400?26:36;
 const scale=Math.min((width-2*margin)/(maxX-minX),(bottom-top)/(maxY-minY));
 const ox=width/2-(minX+maxX)/2*scale,oy=(top+bottom)/2-(minY+maxY)/2*scale;
 const project=p=>{const a=raw(p);return {x:ox+a.x*scale,y:oy+a.y*scale,depth:a.depth};};
 return {project,view:[sy*ce,se,cy*ce],points:points.map(p=>({x:ox+p.x*scale,y:oy+p.y*scale,depth:p.depth})),scale};
}
