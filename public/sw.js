const CACHE_NAME = 'chess-bot-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-512.png',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/stockfish.js',
  '/stockfish.wasm',
  '/stockfish.wasm.js',
  '/chess_pieces/svg/white_pawn.svg',
  '/chess_pieces/svg/white_rook_1.svg',
  '/chess_pieces/svg/white_knight_1.svg',
  '/chess_pieces/svg/white_bishop_1.svg',
  '/chess_pieces/svg/white_queen.svg',
  '/chess_pieces/svg/white_king.svg',
  '/chess_pieces/svg/black_pawn.svg',
  '/chess_pieces/svg/black_rook_1.svg',
  '/chess_pieces/svg/black_knight_1.svg',
  '/chess_pieces/svg/black_bishop_1.svg',
  '/chess_pieces/svg/black_queen.svg',
  '/chess_pieces/svg/black_king.svg',
  '/chess_pieces/png/white_pawn.png',
  '/chess_pieces/png/white_rook_1.png',
  '/chess_pieces/png/white_knight_1.png',
  '/chess_pieces/png/white_bishop_1.png',
  '/chess_pieces/png/white_queen.png',
  '/chess_pieces/png/white_king.png',
  '/chess_pieces/png/black_pawn.png',
  '/chess_pieces/png/black_rook_1.png',
  '/chess_pieces/png/black_knight_1.png',
  '/chess_pieces/png/black_bishop_1.png',
  '/chess_pieces/png/black_queen.png',
  '/chess_pieces/png/black_king.png',
  '/lotus_chess_set/svg/white_pawn.svg',
  '/lotus_chess_set/svg/white_rook_1.svg',
  '/lotus_chess_set/svg/white_knight_1.svg',
  '/lotus_chess_set/svg/white_bishop_1.svg',
  '/lotus_chess_set/svg/white_queen.svg',
  '/lotus_chess_set/svg/white_king.svg',
  '/lotus_chess_set/svg/black_pawn.svg',
  '/lotus_chess_set/svg/black_rook_1.svg',
  '/lotus_chess_set/svg/black_knight_1.svg',
  '/lotus_chess_set/svg/black_bishop_1.svg',
  '/lotus_chess_set/svg/black_queen.svg',
  '/lotus_chess_set/svg/black_king.svg',
  '/lotus_chess_set/png/white_pawn.png',
  '/lotus_chess_set/png/white_rook_1.png',
  '/lotus_chess_set/png/white_knight_1.png',
  '/lotus_chess_set/png/white_bishop_1.png',
  '/lotus_chess_set/png/white_queen.png',
  '/lotus_chess_set/png/white_king.png',
  '/lotus_chess_set/png/black_pawn.png',
  '/lotus_chess_set/png/black_rook_1.png',
  '/lotus_chess_set/png/black_knight_1.png',
  '/lotus_chess_set/png/black_bishop_1.png',
  '/lotus_chess_set/png/black_queen.png',
  '/lotus_chess_set/png/black_king.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Ignore API requests so they can fallback gracefully in JS
  if (event.request.url.includes('/api/')) return;

  const isCodeOrDocument =
    event.request.mode === 'navigate' ||
    event.request.destination === 'script' ||
    event.request.destination === 'document';

  // Network First for HTML and code bundles so updates take effect immediately
  if (isCodeOrDocument) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Cache First with background refresh for media assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        return caches.match('/');
      });
    })
  );
});
