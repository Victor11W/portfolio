// Small depth-buffered WebGL renderer. Canvas remains the label and fallback layer.
export function createSolidRenderer(canvas) {
 const gl=canvas?.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:true});
 if(!gl)return null;
 function shader(type,source){const value=gl.createShader(type);gl.shaderSource(value,source);gl.compileShader(value);if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(value));return value;}
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec4 a_position; attribute vec4 a_color; varying lowp vec4 v_color; void main(){gl_Position=a_position;v_color=a_color;}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying lowp vec4 v_color; void main(){gl_FragColor=v_color;}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
 const buffer=gl.createBuffer(),position=gl.getAttribLocation(program,'a_position'),color=gl.getAttribLocation(program,'a_color');
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(position);gl.enableVertexAttribArray(color);gl.vertexAttribPointer(position,4,gl.FLOAT,false,32,0);gl.vertexAttribPointer(color,4,gl.FLOAT,false,32,16);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
 canvas.dataset.renderer='webgl-depth';
 function vertex(target,p,width,height,rgba){
  const w=6-p.depth*.08;
  target.push((p.x/width*2-1)*w,(1-p.y/height*2)*w,(21/19)*w-40/19,w,rgba[0]/255,rgba[1]/255,rgba[2]/255,rgba[3]??1);
 }
 function submit(values,primitive){if(!values.length)return;gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.DYNAMIC_DRAW);gl.drawArrays(primitive,0,values.length/8);}
 return {
  resize(width,height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);},
  clear(){gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);},
  draw(faces,fit,width,height,colorForFace,edgeColor=null){
   const opaque=[],transparent=[],edges=[];
   for(const face of faces){
    const rgba=colorForFace(face),target=rgba[3]===undefined||rgba[3]>=.999?opaque:transparent;
    for(let j=1;j<face.indices.length-1;j++)for(const index of [face.indices[0],face.indices[j],face.indices[j+1]])vertex(target,fit.points[index],width,height,face.smoothCenter?colorForFace(face,index):rgba);
    if(edgeColor&&!face.curved){const line=edgeColor(face);for(let j=0;j<face.indices.length;j++){vertex(edges,fit.points[face.indices[j]],width,height,line);vertex(edges,fit.points[face.indices[(j+1)%face.indices.length]],width,height,line);}}
   }
   gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);gl.depthMask(true);submit(opaque,gl.TRIANGLES);
   gl.depthMask(false);submit(transparent,gl.TRIANGLES);gl.depthMask(true);gl.disable(gl.POLYGON_OFFSET_FILL);submit(edges,gl.LINES);
  },
  lines(lines,project,width,height){const values=[];for(const line of lines){vertex(values,project(line.from),width,height,line.color);vertex(values,project(line.to),width,height,line.color);}submit(values,gl.LINES);},
  destroy(){gl.deleteBuffer(buffer);gl.deleteProgram(program);}
 };
}
