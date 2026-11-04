import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {decodeDigitModel,predictDigit,prepareDigitPixels} from '../digit-engine.js';
const doc={currentScript:{}};
vm.runInNewContext(await fs.readFile(new URL('../assets/digit-model.js',import.meta.url),'utf8'),{document:doc});
const model=decodeDigitModel(doc.currentScript.digitModelData);
const reference=JSON.parse(await fs.readFile(new URL('./fixtures/digit-reference.json',import.meta.url),'utf8'));
test('browser CNN matches independent NumPy reference logits',()=>{
 for(const fixture of reference){
  const result=predictDigit(fixture.pixels,model);
  for(let i=0;i<10;i++)assert.ok(Math.abs(result.logits[i]-fixture.logits[i])<0.0001,fixture.name+' class '+i);
  assert.ok(Math.abs(result.scores.reduce((a,b)=>a+b,0)-1)<1e-10);
  assert.equal(result.features.length,32*13*13);
  assert.equal(result.features2.length,64*5*5);assert.equal(result.hidden.length,128);
 }
});
test('model decoder refuses altered dimensions and invalid drawing inputs',()=>{
 const altered=structuredClone(doc.currentScript.digitModelData);altered.tensors[0].shape=[1,32,3,3];
 assert.throws(()=>decodeDigitModel(altered),/shape/);
 assert.throws(()=>predictDigit(new Float32Array(783),model),/28/);
 const invalid=new Float32Array(784);invalid[0]=NaN;assert.throws(()=>predictDigit(invalid,model),/pixels/);
});
test('blank drawings stay empty and off-centre ink is fitted and centred',()=>{
 const width=80,height=60,rgba=new Uint8ClampedArray(width*height*4);
 assert.equal(prepareDigitPixels(rgba,width,height).empty,true);
 for(let y=10;y<45;y++)for(let x=2;x<8;x++)rgba[(y*width+x)*4]=255;
 const {pixels,empty}=prepareDigitPixels(rgba,width,height);
 assert.equal(empty,false);assert.equal(pixels.length,784);
 let mass=0,mx=0,my=0;for(let y=0;y<28;y++)for(let x=0;x<28;x++){const v=pixels[y*28+x];mass+=v;mx+=v*x;my+=v*y;assert.ok(v>=0&&v<=255);}
 assert.ok(Math.abs(mx/mass-13.5)<=.5);assert.ok(Math.abs(my/mass-13.5)<=.5);
 const occupiedRows=Array.from({length:28},(_,y)=>pixels.subarray(y*28,y*28+28).some(v=>v>0)).filter(Boolean).length;
 assert.ok(occupiedRows<=20);
});
