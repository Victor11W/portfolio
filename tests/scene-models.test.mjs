import test from 'node:test';
import assert from 'node:assert/strict';
import {createProcessorModel,robotKinematics,createRobotModel,sceneProjection,ROBOT_CYCLE_SECONDS} from '../scene-models.js';

function checkMesh(model){
 for(const v of model.vertices)assert.ok(v.length===3&&v.every(Number.isFinite));
 for(const f of model.faces){
  assert.ok(f.indices.length>=3&&f.indices.every(i=>i>=0&&i<model.vertices.length));
  assert.ok(Math.abs(Math.hypot(...f.normal)-1)<1e-8);
  const [a,b,c]=f.indices.map(i=>model.vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]);
  const actual=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  assert.ok(actual.reduce((s,n,i)=>s+n*f.normal[i],0)>0,'Outward face winding');
 }
}
test('the processor has valid outward geometry and a raised package',()=>{
 const model=createProcessorModel();checkMesh(model);
 assert.equal(model.pinCount,32);
 assert.ok(model.faces.some(f=>f.role==='board'));
 assert.ok(Math.min(...model.vertices.map(v=>v[1]))<0);
 assert.ok(Math.max(...model.vertices.map(v=>v[1]))>.4);
});
test('articulation preserves the lengths of both rigid robot links',()=>{
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 for(let time=0;time<=120;time+=.7){
  const p=robotKinematics(time);
  assert.ok(Math.abs(distance(p.shoulder,p.elbow)-p.upperLength)<1e-10);
  assert.ok(Math.abs(distance(p.elbow,p.wrist)-p.forearmLength)<1e-10);
 }
});
test('the gripper stays openable, bounded and attached to the moving wrist',()=>{
 const poses=[0,2,5,8,12].map(robotKinematics);
 assert.ok(new Set(poses.map(p=>p.jawGap.toFixed(5))).size>1);
 for(const p of poses){
  assert.ok(p.jawGap>=.18&&p.jawGap<=.265);
  assert.ok(p.wrist.every(Number.isFinite));
  assert.ok(p.wrist[1]>=.37-1e-10);
  assert.ok(Math.abs(Math.hypot(...p.grasp.map((v,i)=>v-p.wrist[i]))-.38)<1e-10);
 }
});
test('robot meshes keep valid normals and faces throughout the motion',()=>{
 for(const time of [0,3,7,12,20])checkMesh(createRobotModel(time));
});
test('both models remain inside the stage across sizes, angles and robot poses',()=>{
 for(const [width,height] of [[270,460],[335,470],[600,560],[360,490]])for(const mode of ['cpu','robot'])for(const pan of [-.5,0,.5])for(const time of [0,4,9,15,30]){
  const model=mode==='cpu'?createProcessorModel():createRobotModel(time);
  const fit=sceneProjection(model.vertices,width,height,{mode,panX:pan,panY:pan,time});
  for(const p of fit.points){
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
   assert.ok(p.x>=20&&p.x<=width-20,mode+' horizontal');
   assert.ok(p.y>=90&&p.y<=height-125,mode+' vertical');
  }
 }
});

test('the robot attaches each cube, releases it onto the stack and repeats continuously',()=>{
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 for(let i=0;i<3;i++){
  const held=robotKinematics(i*5.6+3.2),placed=robotKinematics(i*5.6+4.8);
  assert.equal(held.objects[i].state,'held');assert.ok(distance(held.objects[i].center,held.grasp)<1e-10);
  assert.equal(placed.objects[i].state,'stacked');assert.ok(Math.abs(placed.objects[i].center[1]-(-.01+i*.28))<1e-10);
 }
 assert.equal(robotKinematics(17).stacked,3);
 for(let time=0;time<ROBOT_CYCLE_SECONDS;time+=.1){
  const pose=robotKinematics(time),repeated=robotKinematics(time+ROBOT_CYCLE_SECONDS);
  assert.ok(distance(pose.wrist,repeated.wrist)<1e-8);
  for(const object of pose.objects)assert.ok(object.center[1]>=-.01-1e-10);
 }
 for(const boundary of [.8,1.6,2,2.7,3.8,4.5,4.7,4.9,5.6,11.2,16.8,17.7,19.3,19.8]){
  assert.ok(distance(robotKinematics(boundary-1e-6).wrist,robotKinematics(boundary+1e-6).wrist)<.0001,'Continuous wrist at '+boundary);
 }
});

test('payload cubes never intersect while being picked, carried or stacked',()=>{
 function overlaps(a,b){
  if(Math.abs(a.center[1]-b.center[1])>=.28-1e-8)return false;
  for(const angle of [a.yaw,b.yaw])for(const direction of [angle,angle+Math.PI/2]){
   const axis=[Math.cos(direction),Math.sin(direction)],distance=Math.abs((a.center[0]-b.center[0])*axis[0]+(a.center[2]-b.center[2])*axis[1]);
   const radius=yaw=>.14*(Math.abs(Math.cos(direction-yaw))+Math.abs(Math.sin(direction-yaw)));
   if(distance>=radius(a.yaw)+radius(b.yaw)-1e-8)return false;
  }
  return true;
 }
 for(let t=0;t<ROBOT_CYCLE_SECONDS;t+=.025){const objects=robotKinematics(t).objects;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal(overlaps(objects[i],objects[j]),false,'Cube overlap at '+t);}
});
test('the closed gripper stays outside the carried cube instead of hooking through it',()=>{
 for(const time of [2,3.1,4.4,7.7,8.8,10,13.4,14.4,15.5]){
  const model=createRobotModel(time),payload=model.pose.objects.find(o=>o.state==='held');if(!payload)continue;
  const palmIndices=new Set(model.faces.filter(f=>f.role==='palm').flatMap(f=>f.indices));
  for(const index of palmIndices)assert.ok(model.vertices[index][1]>=payload.center[1]+.14-1e-9,'Palm inside payload');
  const indices=new Set(model.faces.filter(f=>f.role==='gripper').flatMap(f=>f.indices));assert.ok(indices.size>0);
  for(const index of indices){const p=model.vertices[index],x=(p[0]-payload.center[0])*Math.cos(payload.yaw)+(p[2]-payload.center[2])*Math.sin(payload.yaw);assert.ok(Math.abs(x)>=.14-1e-9,'Finger inside payload at '+time);}
 }
});
