import test from 'node:test';
import assert from 'node:assert/strict';
import {createIRQState,advanceIRQ,createAvalonState,requestAvalonPixel,advanceAvalon,setAvalonPixel} from '../hardware-engines.js';
test('EXTI stays pending until the handler acknowledges it; one button press toggles once',()=>{
 let state=createIRQState(),initial=state;state=advanceIRQ(state);assert.equal(state.extiPending,true);assert.equal(state.handler,false);
 state=advanceIRQ(state);assert.equal(state.nvicPending,true);state=advanceIRQ(state);assert.equal(state.handler,true);assert.equal(state.nvicPending,false);assert.equal(state.extiPending,true);
 state=advanceIRQ(state);assert.equal(state.extiPending,false);assert.equal(state.led,true);assert.equal(state.count,1);state=advanceIRQ(state);assert.equal(state.phase,0);assert.equal(state.handler,false);
 for(let i=0;i<5;i++)state=advanceIRQ(state);assert.equal(state.led,false);assert.equal(state.count,2);assert.deepEqual(initial,createIRQState());
});
test('Avalon holds the request through waitrequest and separates acceptance from returned data',()=>{
 const initial=createAvalonState();let state=requestAvalonPixel(initial,3),address=state.address;assert.equal(address,12);
 state=advanceAvalon(state);assert.equal(state.waitrequest,1);assert.equal(state.read,1);assert.equal(state.address,address);assert.equal(state.fifo.length,0);
 state=advanceAvalon(state);assert.equal(state.waitrequest,0);assert.equal(state.read,1);assert.equal(state.readdatavalid,0);
 state=advanceAvalon(state);assert.equal(state.read,0);assert.equal(state.readdatavalid,0);
 state=advanceAvalon(state);assert.equal(state.readdatavalid,1);assert.equal(state.fifo.length,1);assert.equal(state.screen[3],0);
 state=advanceAvalon(state);assert.equal(state.fifo.length,0);assert.equal(state.screen[3],initial.memory[3]);assert.equal(initial.screen[3],0);
});
test('editing a framebuffer word changes the display only after the pixel is read',()=>{
 let state=setAvalonPixel(createAvalonState(),7,0x123456);assert.equal(state.address,28);assert.equal(state.screen[7],0);const original=state;
 state=requestAvalonPixel(state,7);assert.strictEqual(setAvalonPixel(state,0,0),state);
 for(let i=0;i<6;i++)state=advanceAvalon(state);assert.equal(state.phase,0);assert.equal(state.screen[7],0x123456);assert.equal(original.screen[7],0);
 assert.throws(()=>setAvalonPixel(state,16,1),/Pixel/);
});
