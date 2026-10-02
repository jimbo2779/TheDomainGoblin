import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { metadata,search,redact } from './adapter.mjs';
export function createServer() {
  let searching=false, retryUntil=0;
  const assets=new Map([['/','index.html'],['/index.html','index.html'],['/styles.css','styles.css'],['/app.js','app.js'],['/core.mjs','core.mjs'],['/presets.mjs','presets.mjs']]);
  const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const expected=`127.0.0.1:${req.socket.localPort}`;
    if(req.headers.host!==expected || (req.headers.origin && req.headers.origin!==`http://${expected}`)) return send(res,403,{message:'Use the printed 127.0.0.1 browser address.'});
    try {
      if(req.url==='/api/meta' && req.method==='GET') return send(res,200,await metadata());
      if(req.url==='/api/search' && req.method==='POST') {
        if(req.headers.origin!==`http://${expected}` || req.headers['content-type']!=='application/json') return send(res,403,{message:'Searches must originate from this console.'});
        if(searching) return send(res,409,{message:'A search is already running. Please wait.'});
        if(Date.now()<retryUntil) return send(res,429,{message:'Wait for the EED retry time before another request.',headers:{'retry-after':String(Math.ceil((retryUntil-Date.now())/1000))}});
        let body=''; for await (const chunk of req) {body+=chunk; if(Buffer.byteLength(body)>32768) return send(res,413,{message:'Search request is too large.'});}
        let parsed; try {parsed=JSON.parse(body);} catch {return send(res,400,{message:'Invalid search request.'});}
        searching=true;
        try { return send(res,200,await search(parsed.query,req.headers['x-eed-api-key'])); }
        catch(e) {
          if(e.status===429) {const retry=e.headers?.['retry-after']; const seconds=Number(retry);retryUntil=Number.isFinite(seconds)?Date.now()+Math.max(1,seconds)*1000:Math.max(Date.now()+1000,Date.parse(retry)||0);}
          const safe=redact({message:e.message,requestId:e.requestId,headers:e.headers,code:e.code},req.headers['x-eed-api-key']);
          return send(res,e.status ?? 422,safe);
        } finally {searching=false;}
      }
      if(req.method!=='GET' || !assets.has(req.url)) return send(res,404,{message:'Not found.'});
      const asset=assets.get(req.url),content=await readFile(new URL(`./public/${asset}`,import.meta.url));
      res.writeHead(200,{'Content-Type':asset.endsWith('.html')?'text/html; charset=utf-8':asset.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(content);
    } catch { send(res,500,{message:'The local server could not complete this request.'}); }
  });
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const port=Number(process.env.PORT ?? 8787);
  if(!Number.isInteger(port)||port<1||port>65535) {console.error('PORT must be between 1 and 65535.');process.exit(1);}
  const server=createServer();
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is busy. Close the other console or set PORT to another number (see README).`:'Unable to start the local server.');process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`The Domain Goblin is awake: http://127.0.0.1:${port}\nOpen that address in your browser. Stop with Ctrl+C.`));
}
