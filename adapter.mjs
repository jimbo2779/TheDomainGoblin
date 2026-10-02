import { readFile } from 'node:fs/promises';
import { buildQuery } from './public/core.mjs';
const origin = 'https://easyexpireddomains.com';
const confirmed = JSON.parse(await readFile(new URL('./eed-meta.json',import.meta.url),'utf8'));
let cache = { data:confirmed, fetchedAt:'2026-10-02', discoveryAvailable:false };
let lastTry = 0;
export async function metadata() {
  if (Date.now()-lastTry < 3600000) return cache;
  lastTry=Date.now();
  try {
    const res=await fetch(`${origin}/api/v1/meta.php`,{signal:AbortSignal.timeout(8000),redirect:'error'});
    const data=await res.json();
    if (!res.ok || !data.ok || !Array.isArray(data.filters) || !data.limits) throw Error();
    cache={data,fetchedAt:new Date().toISOString(),discoveryAvailable:true};
  } catch { cache={...cache,discoveryAvailable:false}; }
  return cache;
}
export function sanitize(message,key) { return String(message ?? '').split(key || '\0').join('[redacted]').replace(/eed_live_[A-Za-z0-9_-]+/g,'[redacted]').slice(0,2000); }
export function redact(value,key) {
  if(typeof value==='string') return value.split(key || '\0').join('[redacted]').replace(/eed_live_[A-Za-z0-9_-]+/g,'[redacted]');
  if(Array.isArray(value)) return value.map(v=>redact(v,key));
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[redact(k,key),redact(v,key)]));
  return value;
}
export async function search(query,key) {
  if (typeof key !== 'string' || !key.trim() || key.length>1024 || /[\r\n]/.test(key)) throw Object.assign(Error('Enter your EED API key inside the app.'),{status:401});
  const params=buildQuery(query,cache.data);
  let res;
  try { res=await fetch(`${origin}/api/v1/domain-search.php?${params}`,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(25000),redirect:'error'}); }
  catch { throw Object.assign(Error('EED did not respond in time or the network failed. A timed-out search may have consumed usage. Retry manually.'),{status:502}); }
  const requestId=res.headers.get('x-request-id');
  const headers=Object.fromEntries([...res.headers].filter(([name])=>name.startsWith('x-ratelimit-') || name.startsWith('x-eed-daily-') || ['retry-after','x-request-id'].includes(name)));
  let data;
  try { data=await res.json(); } catch { throw Object.assign(Error('EED returned an unreadable response. Please retry later.'),{status:502,requestId}); }
  if (!res.ok || data.ok!==true) {
    const help={401:'Key rejected. Check your key in EED API access.',403:'Access denied. Check Agency eligibility and your key’s IP allowlist.',422:'EED rejected a filter.',429:'Request limit reached. Wait until the returned retry/reset time.',500:'EED encountered an error. Retry manually later.',503:'EED is temporarily unavailable. Retry manually later.'};
    const detail=(data.details ?? []).map(d=>`${d.field}: ${d.message}`).join(' ');
    throw Object.assign(Error(sanitize(`${help[res.status] ?? 'Search failed.'} ${data.message ?? ''} ${detail}`,key)),{status:res.status,requestId:data.requestId ?? requestId,headers,code:sanitize(data.error,key)});
  }
  if (!Array.isArray(data.results) || !data.pagination || !data.credits) throw Object.assign(Error('EED response does not match the implemented contract.'),{status:502,requestId});
  // Defensive redaction keeps secrets out of any upstream error or unexpected response text.
  return redact({data,headers,fetchedAt:new Date().toISOString()},key);
}
