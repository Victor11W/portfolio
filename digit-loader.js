import {decodeDigitModel} from './digit-engine.js';
let digitModelPromise;
export function loadDigitModel() {
 if(!digitModelPromise)digitModelPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./assets/digit-model.js',document.baseURI).href;script.async=true;
  script.onload=()=>{try{resolve(decodeDigitModel(script.digitModelData));}catch(error){digitModelPromise=null;reject(error);}finally{script.remove();}};
  script.onerror=()=>{script.remove();digitModelPromise=null;reject(new Error('Digit model unavailable'));};
  document.head.append(script);
 });
 return digitModelPromise;
}
