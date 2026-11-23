/* அமிர்தம் — offline cache. app கோப்புகள் மட்டும்; தரவு Firestore-ன் சொந்த offline சேமிப்பில்.
 * 0.9.1: புதிய பதிப்பு நிறுவும்போது browser-ன் பழைய HTTP cache-ஐத் தவிர்த்து (cache:'reload') server-லிருந்தே எடுக்கும்.
 * 0.10: வரைபடப் படங்கள் (OpenStreetMap / Esri satellite) + வீட்டுப் படங்கள் (Drive thumbnail) தனி cache-ல் — signal இல்லாத இடத்திலும் தெரிய.
 *       இவை பதிப்பு மாறினாலும் அழியாது (\"am-\" பெயர்); அளவு மீறினால் பழையவை நீக்கப்படும். */
const CACHE = 'amirtham-app-0.13';
const TILES = 'am-tiles', PHOTOS = 'am-photos', TILE_MAX = 2500, PHOTO_MAX = 300;
const FILES = ['./', 'index.html', 'app.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(new Request(f, { cache: 'reload' })).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return c.put(f, r); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('amirtham-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
let trimT = {};
function trim(name, max) {
  if (trimT[name]) return; trimT[name] = setTimeout(() => {
    trimT[name] = 0;
    caches.open(name).then(c => c.keys().then(ks => { if (ks.length > max) return Promise.all(ks.slice(0, ks.length - max).map(k => c.delete(k))); }));
  }, 20000);
}
function cacheFirst(e, name, max) {
  e.respondWith(caches.open(name).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { c.put(e.request, r.clone()); trim(name, max); }
    return r;
  }).catch(() => hit || Response.error()))));
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (/(^|\.)tile\.openstreetmap\.org$|^server\.arcgisonline\.com$/.test(u.hostname)) return cacheFirst(e, TILES, TILE_MAX);
  if (u.hostname === 'drive.google.com' && u.pathname === '/thumbnail') return cacheFirst(e, PHOTOS, PHOTO_MAX);
  if (u.origin !== location.origin) return;     // Firebase / Google அழைப்புகள் — நேரடியாக
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res;
  }).catch(() => caches.match('index.html'))));
});
