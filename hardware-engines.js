// Small teaching models; they do not execute firmware or HDL.
export function createIRQState(){return {phase:0,extiPending:false,nvicPending:false,handler:false,led:false,count:0};}
export function advanceIRQ(state){
 if(state.phase===0)return {...state,phase:1,extiPending:true};
 if(state.phase===1)return {...state,phase:2,nvicPending:true};
 if(state.phase===2)return {...state,phase:3,nvicPending:false,handler:true};
 if(state.phase===3)return {...state,phase:4,extiPending:false,led:!state.led,count:state.count+1};
 return {...state,phase:0,handler:false,extiPending:false,nvicPending:false};
}
export const FPGA_DEMO_COLORS=[0xd5f590,0xedb38e,0x87cdc3,0];
export function createAvalonState(){return {phase:0,pixel:0,memory:Array.from({length:16},(_,i)=>FPGA_DEMO_COLORS[(i+Math.floor(i/4))%3]),screen:Array(16).fill(0),fifo:[],address:0,read:0,waitrequest:0,readdatavalid:0,data:null,pending:null};}
export function requestAvalonPixel(state,index=state.pixel){
 if(state.phase!==0)return state;
 if(!Number.isInteger(index)||index<0||index>=16)throw new RangeError('Pixel index');
 return {...state,phase:1,pixel:index,address:index*4,read:1,waitrequest:1,readdatavalid:0,data:null,pending:{index,value:state.memory[index]}};
}
export function advanceAvalon(state){
 if(state.phase===0)return requestAvalonPixel(state);
 if(state.phase===1)return {...state,phase:2};
 if(state.phase===2)return {...state,phase:3,waitrequest:0};
 if(state.phase===3)return {...state,phase:4,read:0};
 if(state.phase===4)return {...state,phase:5,readdatavalid:1,data:state.pending.value,fifo:[...state.fifo,state.pending]};
 if(state.phase===5){const [pixel,...fifo]=state.fifo,screen=state.screen.slice();screen[pixel.index]=pixel.value;return {...state,phase:6,readdatavalid:0,fifo,screen};}
 return {...state,phase:0,pending:null,data:null,read:0,waitrequest:0,readdatavalid:0};
}
export function setAvalonPixel(state,index,value){
 if(state.phase!==0)return state;
 if(!Number.isInteger(index)||index<0||index>=16||!Number.isInteger(value)||value<0||value>0xffffff)throw new RangeError('Pixel');
 const memory=state.memory.slice();memory[index]=value;return {...state,memory,pixel:index,address:index*4};
}
