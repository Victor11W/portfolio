let sequence = 0;
const line = (x1,y1,x2,y2,extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const circle = (x,y,r,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
const rect = (x,y,w,h,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
const text = (x,y,t,extra='') => `<text x="${x}" y="${y}" font-family="Consolas,monospace" ${extra.includes('font-size=')?'':'font-size="9"'} ${extra.includes('fill=')?'':'fill="currentColor"'} stroke="none" ${extra}>${t}</text>`;

function pipelineDrawing() {
 const stages=[['IF','FETCH'],['ID','DECODE'],['EX','EXECUTE']];
 const pads=Array.from({length:12},(_,i)=>{
   const x=103+i*25;
   return line(x,82,x,103)+line(x,218,x,239);
 }).join('');
 const blocks=stages.map(([symbol,label],index)=>{
   const x=97+index*99;
   return `<g>${rect(x,126,89,68,'rx="3" fill="#f6e8ff"')}
     ${text(x+11,155,symbol,'style="font-size:22px"')}${text(x+11,178,label,'letter-spacing="1.2"')}
     ${index<2?line(x+89,160,x+99,160):''}</g>`;
 }).join('');
 return `<g stroke-width="1.3">
   ${pads}${rect(78,101,324,119,'rx="7" fill="#b689cb"')}${rect(85,108,310,105,'rx="4" fill="#d9a9ed"')}
   <path d="M36 161h42m324 0h42M344 194v10H240v-10" stroke-width="1.8"/>
   ${circle(35,161,3,'fill="currentColor"')}${circle(445,161,3,'fill="currentColor"')}${blocks}
   ${text(92,65,'ISA / 16 BIT','letter-spacing="1.6"')}
   ${text(239,264,'EX → ID','text-anchor="middle" letter-spacing="1.4"')}
 </g>`;
}

function displayControllerDrawing() {
 const pixels=['0000000','0100010','0010100','0001000','0010100','0100010','0000000'];
 const bitmap=pixels.flatMap((row,y)=>[...row].map((on,x)=>rect(315+x*11,125+y*11,9,9,
   on==='1'?'fill="#f8eab8" stroke="none"':'fill="#546049" stroke="none"'))).join('');
 return `<g stroke-width="1.25">
   ${rect(47,105,106,108,'rx="4" fill="#fff3cd"')}
   ${[0,1,2,3].map(i=>rect(61,121+i*20,77,12,'rx="1" fill="#d7b87b"')).join('')}
   <path d="M153 160h40m-6-5 6 5-6 5m76-5h35m-6-5 6 5-6 5"/>
   ${rect(198,136,62,46,'rx="3" fill="#e8c57c"')}
   ${[0,1,2].map(i=>rect(208+i*16,146,10,26,'fill="#fff3cd"')).join('')}
   ${rect(297,104,116,110,'rx="5" fill="#354738"')}${bitmap}
   <path d="M355 214v13m-20 0h40"/>
   ${text(99,257,'MEMORY','text-anchor="middle" letter-spacing="1.5"')}
   ${text(229,257,'FIFO','text-anchor="middle" letter-spacing="1.5"')}
   ${text(355,257,'RGB','text-anchor="middle" letter-spacing="1.5"')}
 </g>`;
}

function digitDrawing() {
 // A hand-authored schematic input and two indicative feature maps.
 const input=['0111110','0000110','0000100','0001100','0001000','0011000','0010000'];
 const features=[['0111','0001','0010','0100'],['0001','0011','0010','0100']];
 function pixelGrid(rows,x,y,size) {
   return rows.flatMap((row,iy)=>[...row].map((on,ix)=>rect(x+ix*size,y+iy*size,size-1,size-1,
     on==='1'?'fill="#286254" stroke="none"':'fill="#a0cec1" stroke="none"'))).join('');
 }
 return `<g stroke-width="1.2">
   ${rect(42,100,115,115,'rx="4" fill="#d5f0e3"')}${pixelGrid(input,56,114,12.5)}
   <path d="M161 157h29m-6-5 6 5-6 5m94-5h36m-6-5 6 5-6 5"/>
   ${rect(198,76,77,75,'rx="3" fill="#c7e9dd"')}${pixelGrid(features[0],207,84,15)}
   ${rect(198,159,77,75,'rx="3" fill="#c7e9dd"')}${pixelGrid(features[1],207,168,15)}
   ${rect(327,111,101,95,'rx="6" fill="#275c50"')}
   ${text(377,180,'7','text-anchor="middle" style="font-size:62px;fill:#e9fae6"')}
   ${text(100,260,'MNIST','text-anchor="middle" letter-spacing="1.5"')}
   ${text(236,260,'CONV','text-anchor="middle" letter-spacing="1.5"')}
   ${text(378,260,'ARGMAX','text-anchor="middle" letter-spacing="1.5"')}
 </g>`;
}

export function illustration(type) {
 const uid='vw-'+(++sequence);
 let art='';
 const common=`<defs><pattern id="${uid}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" stroke-width=".5" opacity=".12"/></pattern><pattern id="${uid}-dot" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".5" fill="currentColor" opacity=".22"/></pattern></defs><rect width="480" height="330" fill="url(#${uid}-grid)"/><g opacity=".45" stroke-width=".8"><path d="M25 28h14m-7-7v14M441 28h14m-7-7v14M441 302h14m-7-7v14"/></g>`;
 if(type==='glasses') {
   art=`<g transform="translate(15 5) rotate(-12 225 160)"><path d="M75 125Q75 100 115 98L175 100Q206 103 205 135L200 174Q197 202 158 204L121 200Q86 196 82 170Z" fill="#ffffff30"/><path d="M251 135Q251 105 283 103L343 101Q379 99 378 130L371 174Q365 201 331 203L289 206Q255 205 253 176Z" fill="#ffffff30"/><g stroke-width="1.4" fill="none"><path d="M75 125Q75 100 115 98L175 100Q206 103 205 135L200 174Q197 202 158 204L121 200Q86 196 82 170Z"/><path d="M82 127Q82 108 116 106L173 108Q197 110 197 136L193 171Q190 194 158 196L122 192Q94 190 90 168Z"/><path d="M251 135Q251 105 283 103L343 101Q379 99 378 130L371 174Q365 201 331 203L289 206Q255 205 253 176Z"/><path d="M259 136Q259 113 285 111L341 109Q370 107 370 131L364 171Q359 194 330 195L290 198Q263 198 261 175Z"/><g opacity=".36" stroke-width=".75"><path d="M267 128 290 117 310 139 337 110 357 127 345 151 364 164 339 186 321 162 297 190 274 172 284 147Z M267 128l17 19 26-8 11 23 24-11-8-41m-47 7-6 30 13 43m-13-43 37 15 36-35m-36 35 18 24" fill="none"/></g><path d="M205 136Q225 115 251 136M75 125 51 99 48 72M378 130 403 102 412 77"/><path d="M84 225H199m-115-5v10m115-10v10M400 107v94m-5-94h10m-10 94h10" opacity=".55"/><path d="M141 132v34m-17-17h34M314 133v34m-17-17h34" stroke-dasharray="3 4" opacity=".35"/><path d="M65 86V65h22M389 68h22v20M57 209v22h22M384 231h23v-20" opacity=".5"/></g>${text(120,244,'A / mm')}${text(411,161,'B')}${text(198,58,'PHOTO → MESH','font-size="10" letter-spacing="2"')}<g opacity=".35"><path d="m110 268 39-13 40 13-40 15Z M149 255v28 M130 261l40 14m-20-14-20 14" fill="none"/></g></g>`;
 } else if(type==='wave') {
   let waves='';
   for(let j=0;j<4;j++){
    let d='';
    for(let x=48;x<430;x+=4){const y=94+j*39 + Math.sin(x*.074+j*2)*9+Math.sin(x*.21+j)*3+Math.sin(x*.016)*7;d+=(x===48?'M':'L')+x+' '+y.toFixed(1)+' ';}
    waves+=`<path d="${d}" fill="none" stroke-width="${j===1?1.9:1}" opacity="${j===1?1:.35}"/>`;
   }
   art=`<g>${rect(35,52,410,222,'rx="5" fill="#18211c" stroke="none"')}<g color="#d5f590">${text(52,73,'EEG / REAL-TIME','font-size="8" letter-spacing="1.5"')}${waves}<path d="M287 84v155" stroke-dasharray="3 5" opacity=".45"/>${circle(287,128,5,'fill="#d5f590" stroke="none"')}${rect(313,226,110,28,'rx="3" fill="none" opacity=".4"')}${text(323,244,'c-VEP → VR','font-size="9"')}${text(52,254,'SIGNAL / CLASSIFY / ACT','font-size="7" opacity=".55"')}</g></g>`;
 } else if(type==='cpu') {
   art=pipelineDrawing();
 } else if(type==='fpga') {
   art=displayControllerDrawing();
 } else if(type==='board'||type==='rust') {
   const rows=Array.from({length:11},(_,i)=>circle(105,90+i*14,2.3,'fill="none"')+circle(375,90+i*14,2.3,'fill="none"')).join('');
   const pins=Array.from({length:6},(_,i)=>line(195+i*14,127,195+i*14,137)+line(195+i*14,193,195+i*14,203)).join('');
   art=`<g transform="rotate(-7 240 165)" stroke-width="1">${rect(88,63,305,218,'rx="6" fill="#ffffff25"')}${rows}${rect(183,137,104,56,'rx="2" fill="#29392c"')}${pins}<g fill="none" opacity=".55"><path d="M107 118h34v36h42m-76 21h42v-7h34M287 154h45v-35h41M287 176h23v55h63M208 203v42h-40v35M246 127V94h61V64"/>${rect(133,211,26,20)}${rect(317,79,35,20)}${rect(174,76,31,15)}${rect(334,242,37,18)}<path d="M322 261v7h56v-7"/></g>${text(204,172,type==='rust'?'RUST':'STM32','fill="#eaf0dd" font-size="14"')}${text(123,264,'GPIO   UART   IRQ','font-size="8" letter-spacing="1.3"')}${circle(306,112,5,'fill="currentColor" stroke="none" opacity=".7"')}${circle(306,112,9,'fill="none" opacity=".3"')}</g>`;
 } else if(type==='optimization') {
   const dense=Array.from({length:8},(_,i)=>line(64,93+i*17,186,93+i*17,'opacity="'+(.18+i*.045)+'"')+circle(70+(i*37)%107,93+i*17,2,'fill="currentColor" stroke="none"')).join('');
   art='<g stroke-width="1.1">'+rect(44,67,158,194,'rx="5" fill="#ffffff25"')+rect(280,67,158,194,'rx="5" fill="#ffffff35"')+text(65,91,'MODEL','font-size="9" letter-spacing="1.5"')+'<g transform="translate(0 18)">'+dense+'</g>'+text(300,91,'SIMPLIFY','font-size="9" letter-spacing="1.5"')+'<path d="M298 212 320 129 373 117 420 166 392 225Z" fill="#53673a20"/><path d="M298 212 320 129 373 117 420 166 392 225Z M293 194l129-51 M304 232l114-72" fill="none" stroke-width="1.3"/>'+circle(320,129,5,'fill="currentColor" stroke="none"')+'<path d="M218 162h43m0 0-8-6m8 6-8 6" fill="none" stroke-width="1.6"/>'+text(60,286,'FORMULATION → CONSTRAINTS → COMPUTE','font-size="8" letter-spacing=".9"')+'</g>';
 } else if(type==='network') {
   art=digitDrawing();
 } else if(type==='grid') {
   let cells='';for(let y=0;y<5;y++)for(let x=0;x<5;x++)cells+=rect(140+x*37,58+y*37,32,32,'rx="3" fill="'+((x===1&&y===1)||(x===3&&y===3)?'#27332b38':'#ffffff20')+'" stroke-width=".7" opacity=".75"');
   art=`<g>${cells}<path d="M156 222v-37h37v-37h74v-74h37" fill="none" stroke-width="2.5"/>${circle(156,222,7,'fill="currentColor" stroke="none"')}<path d="m304 65 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="currentColor" stroke="none"/>${text(48,113,'STATE','font-size="8" opacity=".6"')}${text(354,186,'ACTION','font-size="8" opacity=".6"')}${text(155,286,'EXPLORE / LEARN','font-size="9" letter-spacing="1.2"')}<path d="M90 120h36m216 61h34" fill="none" opacity=".3"/></g>`;
 } else if(type==='robot') {
   art=`<g fill="none" stroke-width="1.2">${rect(55,105,95,113,'rx="4" fill="#ffffff30"')}${rect(320,105,105,113,'rx="4" fill="#ffffff30"')}<path d="M65 126h75m190 0h85M150 151h170m-170 25h170M175 146l-6 5 6 5m119 15 6 5-6 5" opacity=".5"/>${rect(208,129,65,65,'rx="8" fill="#ffffff40"')}${circle(227,154,5,'fill="currentColor" stroke="none"')}${circle(254,154,5,'fill="currentColor" stroke="none"')}<path d="M231 176h19m-10-47v-15m-34 40h-10v20h10m69-20h10v20h-10"/>${circle(240,109,4,'fill="currentColor" stroke="none"')}</g>${text(66,119,'CLIENT','font-size="8"')}${text(333,119,'SERVER','font-size="8"')}${text(179,242,'HTTP / SOCKETS','font-size="9" letter-spacing="1"')}`;
 } else if(type==='car') {
   art=`<g transform="rotate(-14 240 175)" fill="none" stroke-width="1.3">${rect(163,108,155,122,'rx="12" fill="#ffffff30"')}${rect(145,116,19,36,'rx="4" fill="currentColor"')}${rect(145,186,19,36,'rx="4" fill="currentColor"')}${rect(317,116,19,36,'rx="4" fill="currentColor"')}${rect(317,186,19,36,'rx="4" fill="currentColor"')}${rect(201,140,77,57,'rx="3" fill="#ffffff40"')}${rect(214,150,28,28,'fill="currentColor"')}${rect(252,148,15,10)}${rect(252,166,15,10)}<path d="M179 116v106m123-106v106M218 88q22-25 44 0m-36-10q14-16 28 0m-17-12q3-5 7 0"/></g>${text(133,277,'WEB → RASPBERRY PI → MOVE','font-size="8" letter-spacing="1"')}`;
 } else if(type==='chat') {
   art=`<g stroke-width="1" fill="none">${rect(65,63,218,64,'rx="8" fill="#ffffff40"')}${rect(157,146,254,64,'rx="8" fill="#ffffff30"')}${rect(97,229,190,40,'rx="8" fill="#ffffff30"')}<path d="M85 85h110m-110 18h163m-72 65h156m-156 18h121m-160 63h93" opacity=".3"/>${circle(312,95,14,'fill="#354d3530" stroke="none"')}${circle(128,179,14,'fill="#354d3518" stroke="none"')}<path d="M305 95h14m-7-7v14M121 179h14M314 248h15m-15 6h15" stroke-width="1.5"/>${text(75,43,'NLP / SENTIMENT','font-size="8" letter-spacing="1.4"')}</g>`;
 } else if(type==='clock') {
   art=`<g stroke-width="1.3" fill="none">${rect(100,88,280,155,'rx="13" fill="#ffffff25"')}${rect(120,109,240,98,'rx="3" fill="#27332b"')}${text(147,177,'07:30','font-size="53" fill="#e9efdb" letter-spacing="3"')}<path d="M120 243v13h36v-13m169 0v13h36v-13M141 87V73h46v14m74 0V73h42v14" opacity=".7"/>${circle(319,225,3,'fill="currentColor" stroke="none"')}${circle(336,225,3,'fill="currentColor" stroke="none"')}${text(185,280,'SET / VERIFY / REPEAT','font-size="8" letter-spacing="1"')}</g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 330" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" preserveAspectRatio="xMidYMid meet">${common}${art}</svg>`;
}
