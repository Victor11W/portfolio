import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.zip':'application/zip','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
export function createPortfolioServer(directory=projectRoot) {
 const root=path.resolve(directory);
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Cache-Control','no-cache');
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
  if(name.includes('\0')||name.includes('\\')){res.writeHead(400);res.end('Bad request');return;}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  const relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(p=>p.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
  try {
   const real=await fs.realpath(file),rel=path.relative(root,real);
   if(rel.startsWith('..')||path.isAbsolute(rel)){res.writeHead(403);res.end('Forbidden');return;}
   const stat=await fs.stat(real);if(!stat.isFile())throw new Error('Not a file');
   const buffer=await fs.readFile(real);
   res.writeHead(200,{'Content-Type':types[path.extname(real)]||'application/octet-stream','Content-Length':buffer.length});
   res.end(req.method==='HEAD'?undefined:buffer);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Page introuvable / Page not found');}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const dist=process.argv.includes('--dist'),port=Number(process.env.PORT||4173),server=createPortfolioServer(dist?path.join(projectRoot,'dist'):projectRoot);
 server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port+' / '+(dist?'dist':'source')));
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port '+port+' is already in use. Choose another PORT.':e.message);process.exitCode=1;});
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>server.close(()=>process.exit(0)));
}
