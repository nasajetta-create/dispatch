// 點工派遣看板 — Service Worker(V4:HTML 網路優先,根治更新後還看到舊版的問題;v4 換新 App 圖示)
var CACHE = 'dispatch-v4';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS).catch(function(){}); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var isHTML = e.request.mode==='navigate' || (e.request.headers.get('accept')||'').indexOf('text/html')>=0;
  if(isHTML){
    // 網路優先:拿得到新版就用新版並更新快取;離線才退回快取
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(hit){ return hit || caches.match('./index.html'); });
      })
    );
    return;
  }
  // 圖示/manifest:快取優先
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request);
    })
  );
});
