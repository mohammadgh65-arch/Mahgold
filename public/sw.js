const CACHE='mahgold-shell-v5-admin-route-network';
const SHELL=['/','/manifest.webmanifest','/mahgold-app-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mahgold-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith('/rest/')||url.pathname.startsWith('/auth/')||url.pathname.startsWith('/storage/'))return;
 if(request.mode==='navigate'){
  // Admin must never fall back to a cached storefront shell. Fetch the current SPA
  // entry without HTTP cache so /admin keeps its pathname and resolves AdminPanel.
  if(/^\\/admin(?:\\/|$)/.test(url.pathname)){
   event.respondWith(fetch(request,{cache:'no-store'}));
   return;
  }
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/index.html',copy));}return response;}).catch(()=>caches.match('/index.html')));
  return;
 }
 if(['script','style'].includes(request.destination)){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   const cached=await cache.match(request);
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok&&response.type==='basic')cache.put(request,response.clone());
    return response;
   }catch{return cached||Response.error();}
  }));
  return;
 }
 if(['image','font'].includes(request.destination)){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   const cached=await cache.match(request);
   if(cached)return cached;
   const response=await fetch(request);
   if(response.ok&&response.type==='basic')cache.put(request,response.clone());
   return response;
  }));
 }
});