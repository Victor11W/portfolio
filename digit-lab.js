import {predictDigit,prepareDigitPixels} from './digit-engine.js';
import {loadDigitModel} from './digit-loader.js';
import {drawDigitExample} from './digit-samples.js';
import {escapeHTML} from './project-utils.js';

const digitLabText={
 fr:{kicker:'À vous de jouer',title:'Un trait. Des pixels. Une prédiction.',intro:'Dessinez un chiffre : le CNN du projet propose sa réponse, directement dans votre navigateur.',draw:'01 / Votre chiffre',canvas:'Zone de dessin d’un chiffre. Utilisez la souris ou le doigt ; les boutons d’exemples sont accessibles au clavier.',hint:'Un seul chiffre, bien grand. Relâchez pour analyser.',examples:'Exemples',example:'Dessiner l’exemple',erase:'Effacer',input:'02 / Ce que voit le réseau',pixels:'Entrée 28 × 28',features:'4 filtres sur 32 · première couche',output:'03 / La réponse du modèle',loading:'Chargement du modèle…',ready:'Dessinez ou choisissez un exemple.',thinking:'Analyse du dessin…',prediction:'Chiffre proposé',empty:'À vous de dessiner.',error:'Le modèle n’a pas pu être chargé. Réessayez.',retry:'Réessayer',note:'Poids du CNN PyTorch du projet. Les scores sont ceux du modèle ; un dessin libre peut être mal reconnu.',privacy:'Tout reste sur cet appareil.',sample:'Exemple',architecture:'Deux façons de comprendre',numpy:'Écrire les mécanismes',numpyBody:'NumPy · 784 → 32 → 32 → 10. Propagation, sigmoïdes et tentative de rétropropagation écrites à la main.',cnn:'Construire avec PyTorch',cnnBody:'CNN · convolutions 32 / 64, max-pooling et couches denses 128 / 10. C’est ce modèle qui répond ci-dessus.'},
 en:{kicker:'Try it yourself',title:'A stroke. Pixels. A prediction.',intro:'Draw a digit: the project’s CNN suggests an answer, right here in your browser.',draw:'01 / Your digit',canvas:'Digit drawing area. Use a mouse or touch; example buttons are keyboard accessible.',hint:'Draw one large digit. Release to analyse.',examples:'Examples',example:'Draw example',erase:'Clear',input:'02 / What the network sees',pixels:'28 × 28 input',features:'4 of 32 filters · first layer',output:'03 / The model’s answer',loading:'Loading the model…',ready:'Draw a digit or choose an example.',thinking:'Analysing the drawing…',prediction:'Suggested digit',empty:'Your turn to draw.',error:'The model could not be loaded. Try again.',retry:'Try again',note:'Weights from the project’s PyTorch CNN. Scores come from the model; freehand drawings may be misread.',privacy:'Everything stays on this device.',sample:'Example',architecture:'Two ways to understand',numpy:'Write the mechanisms',numpyBody:'NumPy · 784 → 32 → 32 → 10. Handwritten forward passes, sigmoid activations and a backpropagation attempt.',cnn:'Build with PyTorch',cnnBody:'CNN · 32 / 64 convolution channels, max-pooling and 128 / 10 dense layers. This is the model responding above.'}
};
export function digitLabMarkup(language) {
 const t=digitLabText[language],e=escapeHTML;
 return '<section class="digit-lab" aria-labelledby="digit-lab-title"><p class="mono digit-lab-kicker">'+e(t.kicker)+' · MNIST</p><h3 id="digit-lab-title">'+e(t.title)+'</h3><p class="digit-lab-intro">'+e(t.intro)+'</p><div class="digit-workbench"><div class="digit-draw"><h4>'+e(t.draw)+'</h4><div class="digit-pad"><canvas id="digit-canvas" width="280" height="280" aria-label="'+e(t.canvas)+'"></canvas><span class="digit-pad-mark" aria-hidden="true">✳</span></div><p class="digit-hint">'+e(t.hint)+'</p><div class="digit-tools"><span>'+e(t.examples)+'</span>'+[0,2,7].map(n=>'<button type="button" data-digit-example="'+n+'" aria-label="'+e(t.example)+' '+n+'">'+n+'</button>').join('')+'<button type="button" id="digit-clear">'+e(t.erase)+'</button></div></div><div class="digit-inside"><h4>'+e(t.input)+'</h4><canvas id="digit-pixels" width="28" height="28" aria-label="'+e(t.pixels)+'"></canvas><p>'+e(t.pixels)+'</p><div class="digit-feature-grid">'+[0,1,2,3].map(()=>'<canvas width="13" height="13" aria-hidden="true"></canvas>').join('')+'</div><p>'+e(t.features)+'</p></div><div class="digit-answer"><h4>'+e(t.output)+'</h4><div class="digit-prediction"><span id="digit-answer-value">—</span><span>'+e(t.prediction)+'</span></div><ol id="digit-scores" aria-label="'+e(t.output)+'"></ol></div></div><p id="digit-status" class="digit-status" role="status">'+e(t.loading)+'</p><button type="button" class="text-button" id="digit-retry" hidden>'+e(t.retry)+'</button><p class="digit-lab-note">'+e(t.note)+' <span>'+e(t.privacy)+'</span></p></section><section class="digit-architectures" aria-labelledby="digit-architecture-title"><h3 id="digit-architecture-title" class="mono">'+e(t.architecture)+'</h3><div><article><span class="mono">01 / NumPy</span><h4>'+e(t.numpy)+'</h4><p>'+e(t.numpyBody)+'</p></article><article><span class="mono">02 / PyTorch</span><h4>'+e(t.cnn)+'</h4><p>'+e(t.cnnBody)+'</p></article></div></section>';
}
export function mountDigitLab(container,language) {
 const t=digitLabText[language],pad=container.querySelector('#digit-canvas'),ctx=pad.getContext('2d',{willReadFrequently:true});
 const pixelCanvas=container.querySelector('#digit-pixels'),pixelContext=pixelCanvas.getContext('2d');
 const featureCanvases=[...container.querySelectorAll('.digit-feature-grid canvas')];
 const status=container.querySelector('#digit-status'),answer=container.querySelector('#digit-answer-value'),scores=container.querySelector('#digit-scores'),retry=container.querySelector('#digit-retry');
 const controller=new AbortController(),options={signal:controller.signal};
 let model=null,drawing=false,last=null,disposed=false,hasDrawing=false;
 function clearViews(){pixelContext.clearRect(0,0,28,28);featureCanvases.forEach(c=>c.getContext('2d').clearRect(0,0,13,13));answer.textContent='—';scores.replaceChildren();}
 function clearPad(){ctx.fillStyle='#080e0d';ctx.fillRect(0,0,280,280);container.querySelector('.digit-pad-mark').hidden=false;hasDrawing=false;clearViews();status.textContent=model?t.empty:t.loading;}
 function heatmap(canvas,values){
  const context=canvas.getContext('2d'),image=context.createImageData(canvas.width,canvas.height),peak=Math.max(1,...values);
  for(let i=0;i<values.length;i++){const v=Math.max(0,Math.min(1,values[i]/peak));image.data[i*4]=Math.round(15+v*184);image.data[i*4+1]=Math.round(24+v*215);image.data[i*4+2]=Math.round(20+v*149);image.data[i*4+3]=255;}
  context.putImageData(image,0,0);
 }
 function analyse(){
  if(disposed||drawing)return;
  const rgba=ctx.getImageData(0,0,280,280).data;
  // Ink is the red-channel intensity above the dark drawing background.
  const mono=new Uint8ClampedArray(rgba.length);for(let i=0;i<rgba.length;i+=4){const ink=Math.round(Math.max(0,rgba[i]-8)*255/247);mono[i]=mono[i+1]=mono[i+2]=ink;mono[i+3]=255;}
  const prepared=prepareDigitPixels(mono,280,280);heatmap(pixelCanvas,prepared.pixels);
  if(prepared.empty){clearViews();status.textContent=model?t.empty:t.loading;return;}
  if(!model){status.textContent=t.loading;return;}
  const result=predictDigit(prepared.pixels,model),ranked=result.scores.map((score,digit)=>({score,digit})).sort((a,b)=>b.score-a.score);
  answer.textContent=String(ranked[0].digit);
  scores.innerHTML=ranked.slice(0,3).map(({digit,score})=>'<li><span>'+digit+'</span><div class="digit-score-track"><span style="width:'+Math.max(0.5,score*100).toFixed(2)+'%"></span></div><span>'+new Intl.NumberFormat(language,{style:'percent',maximumFractionDigits:1}).format(score)+'</span></li>').join('');
  // A fixed selection makes the same learned channels comparable across drawings.
  [0,8,16,24].forEach((channel,index)=>heatmap(featureCanvases[index],result.features.subarray(channel*169,(channel+1)*169)));
  status.textContent=t.prediction+' : '+ranked[0].digit+'.';
 }
 function point(event){const box=pad.getBoundingClientRect();return [(event.clientX-box.left)*280/box.width,(event.clientY-box.top)*280/box.height];}
 function ink(from,to){ctx.strokeStyle='#fff';ctx.fillStyle='#fff';ctx.lineWidth=18;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(...from);ctx.lineTo(...to);ctx.stroke();ctx.beginPath();ctx.arc(to[0],to[1],9,0,Math.PI*2);ctx.fill();hasDrawing=true;container.querySelector('.digit-pad-mark').hidden=true;}
 function end(event){if(!drawing)return;drawing=false;last=null;if(pad.hasPointerCapture(event.pointerId))pad.releasePointerCapture(event.pointerId);analyse();}
 pad.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;event.preventDefault();drawing=true;last=point(event);pad.setPointerCapture(event.pointerId);ink(last,last);status.textContent=t.thinking;},options);
 pad.addEventListener('pointermove',event=>{if(!drawing)return;const next=point(event);ink(last,next);last=next;},options);
 pad.addEventListener('pointerup',end,options);pad.addEventListener('pointercancel',end,options);pad.addEventListener('lostpointercapture',event=>{if(drawing){drawing=false;last=null;analyse();}},options);
 function example(digit){clearPad();drawDigitExample(ctx,digit);hasDrawing=true;container.querySelector('.digit-pad-mark').hidden=true;analyse();}
 container.querySelectorAll('[data-digit-example]').forEach(button=>button.addEventListener('click',()=>example(button.dataset.digitExample),options));
 container.querySelector('#digit-clear').addEventListener('click',clearPad,options);
 async function initialise(){status.textContent=t.loading;retry.hidden=true;try{const loaded=await loadDigitModel();if(disposed)return;model=loaded;if(hasDrawing)analyse();else status.textContent=t.ready;}catch{if(disposed)return;status.textContent=t.error;retry.hidden=false;}}
 retry.addEventListener('click',initialise,options);
 clearPad();initialise();
 return {destroy(){disposed=true;controller.abort();}};
}
