// 쌤보드 모바일 서비스 워커
// · 홈 화면 추가(설치)를 하려면 크롬이 fetch 처리기를 가진 서비스 워커를 요구한다
// · 화면 구성 파일만 캐시한다. 구글 API 응답은 절대 캐시하지 않는다(개인 자료)

const CACHE = 'ssamboard-m-v2';
const SHELL = ['./m.html', './m-theme.css', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 구글 계정·드라이브 요청은 건드리지 않는다
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('google.com')) return;
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 화면 파일은 새 버전을 먼저 받아 보고, 실패하면 캐시로 (비행기 모드 등)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./m.html')))
  );
});
