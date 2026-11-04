// Original vector strokes for the portfolio; no dataset images are distributed.
export function drawDigitExample(ctx,digit) {
 const paths={0:'M 155 45 C 82 35 63 100 69 167 C 75 241 159 257 196 194 C 225 139 211 60 155 45',2:'M 70 83 C 98 20 202 31 207 90 C 209 133 150 155 83 218 L 216 218',7:'M 64 57 L 214 57 L 112 234'};
 ctx.strokeStyle='#fff';ctx.lineWidth=18;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(new Path2D(paths[digit]||paths[7]));
}
