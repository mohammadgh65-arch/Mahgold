const CACHE='mahgold-shell-v2';
const SHELL=['/','/admin','/manifest.webmanifest','/mahgold-app-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mahgold-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith('/rest/')||url.pathname.startsWith('/auth/')||url.pathname.startsWith('/storage/'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/index.html',copy));}return response;}).catch(()=>caches.match('/index.html')));
  return;
 }
 if(['script','style','image','font'].includes(request.destination)){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   const cached=await cache.match(request);
   const network=fetch(request).then(response=>{if(response.ok&&response.type==='basic')cache.put(request,response.clone());return response;}).catch(()=>null);
   if(cached){event.waitUntil(network);return cached;}
   return (await network)||Response.error();
  }));
 }
});