/* அமிர்தம் — offline cache. app கோப்புகள் மட்டும்; தரவு Firestore-ன் சொந்த offline சேமிப்பில்.
 * 0.9.1: புதிய பதிப்பு நிறுவும்போது browser-ன் பழைய HTTP cache-ஐத் தவிர்த்து (cache:'reload') server-லிருந்தே எடுக்கும் —
 *        இல்லையென்றால் GitHub-ல் ஏற்றிய முதல் 10 நிமிடத்தில் பழைய app.js புதிய cache-ல் சேர்ந்துவிடக்கூடும். */
const CACHE = 'amirtham-app-0.9.1';
const FILES = ['./', 'index.html', 'app.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(new Request(f, { cache: 'reload' })).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return c.put(f, r); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('amirtham-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;     // Firebase / Google அழைப்புகள் — நேரடியாக
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res;
  }).catch(() => caches.match('index.html'))));
});
