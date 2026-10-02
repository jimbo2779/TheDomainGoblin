// Shared pure helpers: also exercised by Node's offline tests.
export const numericFilters = ['minTF','maxTF','minCF','maxCF','minBL','minRD','minTTF','minMajEdu','minMajGov','minMajIPs','minDA','maxDA','minPA','maxPA','maxSpam','minMozRank','minMozTrust','minDDLinks','minDDPages','minDDDofollow','minDDEdu','minDDGov','minSemTraffic','minSemRank','maxSemRank','minSemLinks','minSemKeywords','minAge','maxAge','minNameLength','maxNameLength','minPrice','maxPrice','minBids','minAuctionTraffic','minValuation','minRevenue'];
const stringFilters = ['q','source','provider','tld','sort','dir','ttfTopic','containsLetters','containsNumbers','containsHyphen','auctionType','auctionEnd','godaddyListingType','specialOption','registrar','includeRegisterLinks'];
export function buildQuery(input, meta) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Search rules must be an object.');
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (![...numericFilters,...stringFilters,'page','pageSize'].includes(key)) throw Error(`Unsupported filter: ${key}`);
    if (value === '' || value == null) continue;
    if (numericFilters.includes(key) || ['page','pageSize'].includes(key)) {
      if (!['number','string'].includes(typeof value)) throw Error(`Invalid numeric ${key}.`);
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) throw Error(`${key} must be a non-negative number.`);
      if (['page','pageSize','minNameLength','maxNameLength'].includes(key) && (!Number.isInteger(n) || n < 1)) throw Error(`${key} must be a positive whole number.`);
      if (key.includes('NameLength') && n > 63) throw Error('API name length must be between 1 and 63.');
      out[key] = n;
    } else {
      if (typeof value !== 'string' || value.length > (key === 'tld' ? 512 : key === 'ttfTopic' ? 180 : 120)) throw Error(`Invalid ${key}.`);
      out[key] = value.trim();
    }
    if (meta?.filters && !['q','source','sort','dir','page','pageSize','includeRegisterLinks','registrar'].includes(key) && !meta.filters.includes(key)) throw Error(`${key} is unavailable in current metadata.`);
  }
  out.page ??= 1; out.pageSize ??= 100;
  if (out.pageSize > (meta?.limits?.jsonMaximumPageSize ?? 500)) throw Error('Page size exceeds the published JSON limit.');
  if ((out.page - 1) * out.pageSize >= (meta?.limits?.resultWindow ?? 10000)) throw Error('The API result window has been reached.');
  const enums = { source: meta?.sources, provider: meta?.providers, sort: meta?.sorts, dir: meta?.directions, registrar: meta?.registrars, ...meta?.filterValues };
  for (const [key, values] of Object.entries(enums)) if (out[key] && values && !values.includes(out[key])) throw Error(`Unsupported ${key}: ${out[key]}`);
  if (out.includeRegisterLinks && !['1','0','true','false'].includes(out.includeRegisterLinks)) throw Error('Invalid registrar-link option.');
  if (out.tld) {
    const parts = out.tld.toLowerCase().split(',').map(x => x.trim());
    if (parts.length > 50 || parts.some(x => x.length > 253 || !x.split('.').every(s => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s)))) throw Error('Use TLDs such as com,co.uk,net without leading dots.');
    out.tld = parts.join(',');
  }
  for (const min of numericFilters.filter(x => x.startsWith('min'))) { const max = min.replace(/^min/, 'max'); if (out[min] != null && out[max] != null && out[min] > out[max]) throw Error(`${min} cannot exceed ${max}.`); }
  if (out.ttfTopic && out.minTTF == null) throw Error('A topical category requires minTTF.');
  if (out.auctionEnd && !['auction','closeout'].includes(out.source)) throw Error('Auction windows require auction inventory.');
  if (out.specialOption === 'expiring_today' && out.source !== 'expiring') throw Error('Approaching drop requires expiring inventory.');
  if (out.specialOption === 'new_today' && !['auction','expiring','expired'].includes(out.source)) throw Error('New inventory requires auction, expiring, or expired source.');
  if (out.godaddyListingType && (out.provider !== 'godaddy' || !['auction','closeout'].includes(out.source))) throw Error('GoDaddy listing types require GoDaddy auction inventory.');
  if (out.auctionType && !['auction','closeout'].includes(out.source)) throw Error('Auction type requires auction inventory.');
  if (out.registrar && !['1','true'].includes(out.includeRegisterLinks)) throw Error('Registrar requires registration links.');
  if (['1','true'].includes(out.includeRegisterLinks) && out.source !== 'expired') throw Error('Registrar links require expired inventory.');
  const params = new URLSearchParams(out);
  if (new TextEncoder().encode(params.toString()).length > (meta?.limits?.maximumQueryStringBytes ?? 8192)) throw Error('Search rules are too long.');
  return params;
}
export const safeURL = value => { try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
const number = x => typeof x === 'number' && Number.isFinite(x) ? x : null;
export function adapt(row) {
  if (!row || typeof row.domain !== 'string' || !row.domain.includes('.') || /[\s\x00-\x1f\x7f]/.test(row.domain) || row.domain.length > 253) throw Error('Invalid domain row.');
  return { id: String(row.id ?? ''), domain: row.domain.toLowerCase().replace(/\.$/, ''), tld: String(row.tld ?? ''), source: String(row.sourceType ?? row.source ?? ''), provider: String(row.provider?.name ?? ''), providerKey: String(row.provider?.key ?? ''), listingUrl: safeURL(row.provider?.listingUrl), registerUrl: safeURL(row.registerUrl), tf: number(row.metrics?.majestic?.tf), da: number(row.metrics?.moz?.da), qs: number(row.qualityScore), age: number(row.age), price: number(row.price), currency: String(row.priceCurrency ?? ''), event: typeof row.expires === 'string' ? row.expires : null, metrics: row.metrics ?? {}, auction: row.auction ?? {} };
}
export const listingIdentity = r => JSON.stringify([r.id || null,r.domain,r.source,r.providerKey,r.auction?.type ?? '']);
export function mergeRows(oldRows, rows) { const map = new Map(oldRows.map(r => [listingIdentity(r),r])); for (const r of rows) map.set(listingIdentity(r), r); return [...map.values()]; }
export function canLoad(p, pages, budget) { return !!(p?.hasMore && Number.isInteger(p.nextPage) && p.nextPage > p.page && pages < budget && (p.nextPage - 1) * p.pageSize < p.resultWindowMax); }
export function refine(rows, rules = {}) {
  return rows.filter(r => {
    const label = r.tld && r.domain.endsWith(`.${r.tld}`) ? r.domain.slice(0,-r.tld.length-1) : null;
    return (!rules.maxFullLength || r.domain.length <= Number(rules.maxFullLength)) && (rules.minQS === '' || rules.minQS == null || (r.qs != null && r.qs >= Number(rules.minQS))) && (!rules.pattern || (label != null && /^[0-9]+$/.test(label)));
  });
}
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const csvCell = value => { let s = String(value ?? ''); if (/^[\s]*[=+@-]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g,'""')}"`; };
export function exportReport(rows, metadata) {
  // Explicit field allowlist: keys and arbitrary response properties never enter reports.
  const filters=Object.fromEntries(Object.entries(metadata.filters ?? {}).filter(([k])=>[...numericFilters,...stringFilters,'pageSize','page'].includes(k)));
  return { version: 1, title: String(metadata.title ?? 'The Domain Goblin'), source: 'Easy Expired Domains', fetchedAt: metadata.fetchedAt ?? null, filters, refinement: validateRefinement(metadata.refinement), loadedSort: String(metadata.loadedSort ?? ''), scope: String(metadata.scope ?? 'Historical shortlist snapshots'), partial: !!metadata.partial, rows: rows.map(r => ({ domain:r.domain,tld:r.tld,source:r.source,provider:r.provider,tf:r.tf,da:r.da,qs:r.qs,age:r.age,price:r.price,currency:r.currency,event:r.event,notes:String(r.notes ?? ''),snapshotAt:r.snapshotAt ?? metadata.fetchedAt ?? null })) };
}
export function csvReport(report) { const columns = ['domain','tld','source','provider','tf','da','qs','age','price','currency','event','notes','snapshotAt']; return '\uFEFF' + [ ['Report metadata',JSON.stringify({...report,rows:undefined})].map(csvCell).join(','), columns.map(csvCell).join(','), ...report.rows.map(r => columns.map(k => csvCell(r[k])).join(',')) ].join('\r\n'); }
export function printable(report) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHTML(report.title)}</title><style>body{font:16px system-ui;background:#fff;color:#202033;max-width:1000px;margin:40px auto;padding:20px}h1{color:#6724a8}article{break-inside:avoid;border:2px solid #6724a8;border-radius:15px;padding:20px;margin:16px 0}h2{overflow-wrap:anywhere}small{color:#555}pre{white-space:pre-wrap;overflow-wrap:anywhere}button{padding:12px}@media print{button{display:none}}</style><button onclick="window.print()">Print / Save as PDF</button><h1>${escapeHTML(report.title)}</h1><p>Powered by Easy Expired Domains · Historical observations; availability requires a new live search.</p><pre>${escapeHTML(JSON.stringify({...report,rows:undefined},null,2))}</pre>${report.rows.map((r,i)=>`<article><h2>${i+1}. ${escapeHTML(r.domain)}</h2><p>TF ${escapeHTML(r.tf ?? 'Unavailable')} · DA ${escapeHTML(r.da ?? 'Unavailable')} · EED QS ${escapeHTML(r.qs ?? 'Unavailable')} · Age ${escapeHTML(r.age ?? 'Unavailable')} years</p><p>${escapeHTML(r.source)} / ${escapeHTML(r.provider)} · Listing price ${escapeHTML(r.price == null ? 'Unavailable' : `${r.price} ${r.currency}`)}</p><p>Source event (UTC): ${escapeHTML(r.event ?? 'Unavailable')} · Observed ${escapeHTML(r.snapshotAt ?? 'Unavailable')}</p><p>${escapeHTML(r.notes)}</p></article>`).join('')}</html>`;
}
export function validateBackup(data, meta) {
  if (!data || data.version !== 1 || !Array.isArray(data.presets) || !Array.isArray(data.shortlist) || data.presets.length > 100 || data.shortlist.length > 5000) throw Error('Unsupported backup format or size.');
  const presets = data.presets.map((p,i) => {
    if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100) throw Error('Invalid preset name.');
    const query = Object.fromEntries(buildQuery(p.query,meta)); delete query.page;
    const refinement = validateRefinement(p.refinement);
    return { id: typeof p.id==='string' && /^[a-z0-9-]{1,100}$/i.test(p.id)?p.id:`restored-${i}`,name:p.name,purpose:String(p.purpose ?? '').slice(0,500),query,refinement };
  });
  const shortlist = data.shortlist.map(item => {
    if (!item || typeof item.domain !== 'string' || !/^[a-z0-9.-]+$/i.test(item.domain) || !item.domain.includes('.') || item.domain.length > 253 || typeof item.notes !== 'string' || item.notes.length > 10000 || !Number.isFinite(Date.parse(item.snapshotAt))) throw Error('Invalid shortlist entry.');
    if (!Array.isArray(item.listings) || item.listings.length < 1 || item.listings.length > 500) throw Error('Invalid listing snapshots.');
    const listings = item.listings.map(r => {
      if (r.domain !== item.domain || !['expiring','expired','auction','bin'].includes(r.source)) throw Error('Invalid listing domain/source.');
      const clean = { id:String(r.id ?? '').slice(0,200),domain:item.domain.toLowerCase(),metrics:{},auction:{} };
      for (const k of ['tld','source','provider','providerKey','currency']) { if (typeof r[k] !== 'string' || r[k].length > 200) throw Error('Invalid listing text.'); clean[k]=r[k]; }
      for (const k of ['tf','da','qs','age','price']) { if (r[k] != null && (typeof r[k] !== 'number' || !Number.isFinite(r[k]) || r[k]<0)) throw Error('Invalid listing metric.'); clean[k]=r[k] ?? null; }
      clean.event = r.event == null ? null : Number.isFinite(Date.parse(r.event)) ? r.event : null;
      clean.listingUrl=safeURL(r.listingUrl); clean.registerUrl=safeURL(r.registerUrl);
      return clean;
    });
    return { domain:item.domain.toLowerCase(),notes:item.notes,snapshotAt:item.snapshotAt,listings };
  });
  if(new Set(presets.map(p=>p.id)).size!==presets.length || new Set(shortlist.map(s=>s.domain)).size!==shortlist.length) throw Error('Duplicate preset or domain identities in backup.');
  return { version:1,presets,shortlist };
}
export function validateRefinement(r = {}) {
  const clean = { minQS:r.minQS ?? '',maxFullLength:r.maxFullLength ?? '',pattern:r.pattern ?? '' };
  for (const k of ['minQS','maxFullLength']) if (clean[k] !== '' && (!Number.isFinite(Number(clean[k])) || Number(clean[k]) < 0 || Number(clean[k]) > (k === 'maxFullLength' ? 253 : 100000))) throw Error(`Invalid local ${k}.`);
  if (clean.pattern && clean.pattern !== 'digits') throw Error('Unsupported local pattern.');
  return clean;
}
