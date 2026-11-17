/* MBP V4 development shell: distinct cache name prevents stale V3.7 assets during beta tests.
   Never cache, read or transfer local encrypted financial data. */
const CACHE='mon-budget-shell-v4-beta1-offline-1';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mon-budget-shell-v4-')&&k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith(fetch(request).then(response=>{
  if(response.ok&&FILES.some(f=>new URL(f,self.registration.scope).pathname===url.pathname)){
   const copy=response.clone();
   event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));
  }
  return response;
 }).catch(async()=>{
  const cached=await caches.match(request,{ignoreSearch:true});
  if(cached)return cached;
  if(request.mode==='navigate'){
   const fallback=await caches.match(new URL('./index.html',self.registration.scope));
   if(fallback)return fallback;
  }
  return Response.error();
 }));
});
