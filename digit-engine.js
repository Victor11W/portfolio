// CPU inference for Victor's saved MNIST CNN. No training and no network service.
export function decodeDigitModel(record) {
 if(record?.format!=='float32-le'||record.tensors?.length!==8)throw new Error('Invalid digit model');
 const expected=[['conv1.weight',32,1,3,3],['conv1.bias',32],['conv2.weight',64,32,3,3],['conv2.bias',64],['fc1.weight',128,1600],['fc1.bias',128],['fc2.weight',10,128],['fc2.bias',10]];
 const result={};
 for(let index=0;index<expected.length;index++) {
  const [name,...shape]=expected[index],tensor=record.tensors[index];
  if(tensor.name!==name||JSON.stringify(tensor.shape)!==JSON.stringify(shape))throw new Error('Unexpected tensor shape');
  const decoded=atob(tensor.base64),count=shape.reduce((a,b)=>a*b,1);
  if(decoded.length!==count*4)throw new Error('Unexpected tensor length');
  const bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0)),view=new DataView(bytes.buffer),values=new Float32Array(count);
  for(let i=0;i<count;i++){values[i]=view.getFloat32(i*4,true);if(!Number.isFinite(values[i]))throw new Error('Invalid weight');}
  result[name]=values;
 }
 return result;
}

function digitConvPool(input,size,inChannels,outChannels,weights,bias) {
 const convSize=size-2,outSize=Math.floor(convSize/2),output=new Float32Array(outChannels*outSize*outSize);
 for(let oc=0;oc<outChannels;oc++)for(let oy=0;oy<outSize;oy++)for(let ox=0;ox<outSize;ox++) {
  let best=0;
  for(let py=0;py<2;py++)for(let px=0;px<2;px++) {
   let sum=bias[oc];
   for(let ic=0;ic<inChannels;ic++)for(let ky=0;ky<3;ky++) {
    const ii=ic*size*size+(oy*2+py+ky)*size+ox*2+px,wi=(oc*inChannels+ic)*9+ky*3;
    sum+=input[ii]*weights[wi]+input[ii+1]*weights[wi+1]+input[ii+2]*weights[wi+2];
   }
   if(sum>best)best=sum;
  }
  output[(oc*outSize+oy)*outSize+ox]=best;
 }
 return output;
}
function digitLinear(input,weights,bias,relu=false) {
 const out=new Float32Array(bias.length);
 for(let j=0;j<out.length;j++){let value=bias[j];const offset=j*input.length;for(let i=0;i<input.length;i++)value+=input[i]*weights[offset+i];out[j]=relu?Math.max(0,value):value;}
 return out;
}
export function predictDigit(pixels,model) {
 if(pixels.length!==784||Array.from(pixels).some(v=>!Number.isFinite(v)||v<0||v>255))throw new Error('Expected 28×28 pixels in [0,255]');
 const input=Float32Array.from(pixels,v=>v/127.5-1);
 const features=digitConvPool(input,28,1,32,model['conv1.weight'],model['conv1.bias']);
 const layer2=digitConvPool(features,13,32,64,model['conv2.weight'],model['conv2.bias']);
 const hidden=digitLinear(layer2,model['fc1.weight'],model['fc1.bias'],true);
 const logits=digitLinear(hidden,model['fc2.weight'],model['fc2.bias']);
 const peak=Math.max(...logits),exps=Array.from(logits,v=>Math.exp(v-peak)),sum=exps.reduce((a,b)=>a+b,0);
 return {scores:exps.map(v=>v/sum),logits:Array.from(logits),features,features2:layer2,hidden};
}

// Fit the handwritten bounding box into a 20-pixel square, then centre its mass.
export function prepareDigitPixels(rgba,width,height) {
 if(rgba.length!==width*height*4||width<1||height<1)throw new Error('Invalid drawing');
 const value=(x,y)=>rgba[(y*width+x)*4];
 let left=width,right=-1,top=height,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(value(x,y)>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const pixels=new Float32Array(784);
 if(right<left)return {pixels,empty:true};
 const w=right-left+1,h=bottom-top+1,scale=20/Math.max(w,h),nw=Math.max(1,Math.round(w*scale)),nh=Math.max(1,Math.round(h*scale));
 const dx=Math.floor((28-nw)/2),dy=Math.floor((28-nh)/2);
 for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){
  let total=0;
  for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){
   const fx=left+(x+(sx+.5)/4)*w/nw-.5,fy=top+(y+(sy+.5)/4)*h/nh-.5;
   const x0=Math.max(0,Math.min(width-1,Math.floor(fx))),y0=Math.max(0,Math.min(height-1,Math.floor(fy))),x1=Math.min(width-1,x0+1),y1=Math.min(height-1,y0+1),tx=Math.max(0,fx-x0),ty=Math.max(0,fy-y0);
   total+=value(x0,y0)*(1-tx)*(1-ty)+value(x1,y0)*tx*(1-ty)+value(x0,y1)*(1-tx)*ty+value(x1,y1)*tx*ty;
  }
  pixels[(dy+y)*28+dx+x]=total/16;
 }
 let mass=0,mx=0,my=0;for(let y=0;y<28;y++)for(let x=0;x<28;x++){const v=pixels[y*28+x];mass+=v;mx+=x*v;my+=y*v;}
 if(mass<=0)return {pixels,empty:true};
 const shiftX=Math.round(13.5-mx/mass),shiftY=Math.round(13.5-my/mass),centred=new Float32Array(784);
 for(let y=0;y<28;y++)for(let x=0;x<28;x++){const nx=x+shiftX,ny=y+shiftY;if(nx>=0&&nx<28&&ny>=0&&ny<28)centred[ny*28+nx]=pixels[y*28+x];}
 return {pixels:centred,empty:false};
}
