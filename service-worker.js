const CACHE_NAME = "inventory-app-v7";

const urlsToCache = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./firebase.js",
    "./manifest.json"
];

// INSTALL
self.addEventListener("install", (event) => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// ACTIVATE
self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }

                })

            );

        })

    );

    self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {

    // ALWAYS FETCH LATEST JS/CSS
    if (
        event.request.url.includes(".js") ||
        event.request.url.includes(".css") ||
        event.request.url.includes("index.html")
    ) {

        event.respondWith(

            fetch(event.request)
                .then(response => {

                    const responseClone = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseClone);
                        });

                    return response;
                })
                .catch(() => caches.match(event.request))

        );

        return;
    }

    // NORMAL CACHE
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});