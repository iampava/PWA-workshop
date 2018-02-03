const swPrecache = require('sw-precache');

const options = {
    staticFileGlobs: [
        '/',
        'index.html',
        'common.js',
        'appConfig.js',
        'public/images/icon.png',
        'public/images/icon--flipped.png',
        'public/images/offline.png',
        'public/style.css',
        'public/main.js',
        'public/scripts/app.js',
        'public/scripts/messaging-service.js',
        'public/scripts/messaging-controller.js',
        'public/scripts/pre-data-ui.js',
        'public/scripts/ui.js',
    ],
    skipWaiting: true
};

swPrecache.write('./caching-service-worker.js', options, err => {
    if (err) {
        console.error(err);
    }
});

