import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import http from 'node:http';
import {defaults} from '../public/presets.mjs';
import {buildQuery,adapt,mergeRows,canLoad,refine,exportReport,csvReport,printable,validateBackup,safeURL} from '../public/core.mjs';
import {search,redact} from '../adapter.mjs';
import {createServer} from '../server.mjs';
import {row,response} from './fixture.mjs';
const meta=JSON.parse(await readFile(new URL('../eed-meta.json',import.meta.url)));
test('personalised presets map to canonical EED parameters',()=>{
 for(const p of defaults){const query=buildQuery(p.query,meta);assert.equal(query.get('source'),'expiring');assert.equal(query.get('minAge'),'5');assert.equal(query.get('minTF'),'15');assert.equal(query.get('maxNameLength'),'25');assert.equal(query.get('tld'),'com,co.uk,net');assert.equal(query.get('page'),'1');assert.equal(query.get('sort'),'majTF');assert.equal(query.has('keyword'),false);assert.equal(query.has('minQS'),false);}
});
test('contradictory and unsupported filters are rejected rather than discarded',()=>{
 for(const query of [{minQS:50},{source:'expiring',auctionEnd:'today'},{source:'expired',specialOption:'expiring_today'},{minAge:10,maxAge:5},{maxNameLength:64},{pageSize:501},{provider:'invented'},{tld:'.com'},{ttfTopic:'Computers'},{minTF:-1},{page:101,pageSize:100},{source:'expired',registrar:'namecheap.com'}])assert.throws(()=>buildQuery(query,meta));
 assert.equal(buildQuery({maxPrice:0,minTF:0},meta).get('maxPrice'),'0');
});
test('response uses documented nested metrics, listing price and unavailable values',()=>{
 const r=adapt(row);assert.equal(r.tf,22);assert.equal(r.da,30);assert.equal(r.qs,54);assert.equal(r.price,null);assert.equal(r.event,row.expires);assert.equal(r.listingUrl,row.provider.listingUrl);
 const missing=adapt({...row,qualityScore:null,metrics:{majestic:{tf:0},moz:{da:null}}});assert.equal(missing.tf,0);assert.equal(missing.da,null);assert.equal(missing.qs,null);
 assert.equal(adapt({...row,provider:{listingUrl:'javascript:alert(1)'}}).listingUrl,'');assert.equal(safeURL('https://user:password@example.org'),'');
});
test('pagination stops on budget, result window or no-more, preserves distinct listings',()=>{
 const p=response.pagination;assert.equal(canLoad(p,1,3),true);assert.equal(canLoad(p,3,3),false);assert.equal(canLoad({...p,hasMore:false},1,3),false);assert.equal(canLoad({...p,nextPage:101},1,200),false);assert.equal(canLoad({...p,nextPage:1},1,3),false);
 const first=adapt(row),second=adapt({...row,id:'another-listing',provider:{key:'other',name:'Other'}});assert.equal(mergeRows([first],[first,second]).length,2);
});
test('local refinements have page scope and strip multi-part TLD for digits-only',()=>{
 const digit=adapt({...row,domain:'123.co.uk'}),letter=adapt(row);assert.deepEqual(refine([digit,letter],{pattern:'digits'}),[digit]);assert.equal(refine([letter],{minQS:55}).length,0);assert.equal(refine([letter],{maxFullLength:5}).length,0);
});
test('reports escape hostile text and exclude secret properties',()=>{
 const r={...adapt(row),notes:'=HYPERLINK("evil")\n<script>alert(1)</script>',key:'test-secret'};
 const report=exportReport([r],{filters:{...defaults[0].query,apiKey:'test-secret'},key:'test-secret',partial:true});const json=JSON.stringify(report);assert.equal(json.includes('test-secret'),false);assert.equal(report.partial,true);
 assert.match(csvReport(report),/"'=HYPERLINK/);assert.match(printable(report),/&lt;script&gt;/);assert.equal(printable(report).includes('<script>alert'),false);assert.equal(JSON.stringify(redact({message:'test-secret',headers:{foo:'test-secret'}},'test-secret')).includes('test-secret'),false);
});
test('backup validation strips extra fields, validates before replacing and preserves snapshots',()=>{
 const backup=validateBackup({version:1,key:'test-secret',presets:defaults,shortlist:[{domain:row.domain,notes:'my pick',snapshotAt:'2026-10-02T12:00:00Z',listings:[adapt(row)]}]},meta);assert.equal(JSON.stringify(backup).includes('test-secret'),false);assert.equal(backup.shortlist[0].listings[0].price,null);assert.equal(backup.presets[0].id,defaults[0].id);
 assert.throws(()=>validateBackup({version:1,presets:[],shortlist:[{}]},meta));assert.throws(()=>validateBackup({version:1,presets:[{name:'bad',query:{key:'secret'}}],shortlist:[]},meta));
});
test('adapter sends key in header to fixed endpoint; 422 and 429 are actionable without key leaks',async()=>{
 const original=globalThis.fetch;const key='test-secret';let calls=0;
 try{
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(new URL(url).origin,'https://easyexpireddomains.com');assert.equal(new URL(url).pathname,'/api/v1/domain-search.php');assert.equal(String(url).includes(key),false);assert.equal(options.headers.Authorization,`Bearer ${key}`);return new Response(JSON.stringify(response),{status:200,headers:{'x-request-id':'fixture-request','x-eed-daily-remaining':'999'}});};
 const result=await search(defaults[0].query,key);assert.equal(result.data.results[0].qualityScore,54);assert.equal(result.headers['x-eed-daily-remaining'],'999');assert.equal(calls,1);
 globalThis.fetch=async()=>new Response(JSON.stringify({ok:false,message:`Invalid ${key}`,details:[{field:'minTF',message:'out of range'}],error:'validation_failed',requestId:'fixture-request'}),{status:422});
 await assert.rejects(search(defaults[0].query,key),e=>e.status===422&&e.message.includes('minTF')&&!e.message.includes(key));
 globalThis.fetch=async()=>new Response(JSON.stringify({ok:false,message:'Daily allowance exhausted',error:'daily_limit'}),{status:429,headers:{'retry-after':'60'}});
 await assert.rejects(search(defaults[0].query,key),e=>e.status===429&&e.headers['retry-after']==='60');
 globalThis.fetch=async()=>{throw Error(key);};await assert.rejects(search(defaults[0].query,key),e=>e.status===502&&!e.message.includes(key));
 await assert.rejects(search(defaults[0].query,''),e=>e.status===401);
 }finally{globalThis.fetch=original;}
});
test('local server serves allowlisted assets and rejects hostile host/origin and missing key',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const root=`http://127.0.0.1:${server.address().port}`;
 try{
 const index=await fetch(root);assert.equal(index.status,200);assert.match(await index.text(),/The Domain Goblin/);
 for(const path of ['/server.mjs','/eed-meta.json','/.git/config','/%2e%2e/server.mjs','/../adapter.mjs','/styles.css?x=1'])assert.equal((await fetch(root+path)).status,404);
 const hostileHost=await new Promise((resolve,reject)=>{const req=http.get(root,{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(hostileHost,403);
 assert.equal((await fetch(root+'/api/search',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
 const missing=await fetch(root+'/api/search',{method:'POST',headers:{Origin:root,'Content-Type':'application/json'},body:JSON.stringify({query:defaults[0].query})});assert.equal(missing.status,401);assert.equal(missing.headers.get('cache-control'),'no-store');
 for(const asset of ['/styles.css','/app.js','/core.mjs','/presets.mjs'])assert.equal((await fetch(root+asset)).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
