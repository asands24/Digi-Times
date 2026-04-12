// Service worker registration for DigiTimes PWA.
// CRA (react-scripts 5) uses Workbox under the hood and generates
// the service-worker.js file during `npm run build`.
//
// Benefits:
// - Caches static assets so the app loads fast on repeat visits
// - Enables offline/poor-connection resilience
// - Required for iOS "Add to Home Screen" full-screen experience

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/)
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Service worker won't work if PUBLIC_URL is on a different origin.
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // Running on localhost — verify service-worker exists, then register.
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[SW] Serving from cache, with network fallback.');
          }
        });
      } else {
        // Not localhost — register service worker directly.
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available — notify app if callback provided.
              config?.onUpdate?.(registration);
            } else {
              // Content cached for offline use.
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SW] Registration failed:', error);
      }
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found — reload without it.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[SW] No internet connection — running in offline mode.');
      }
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error(error.message);
        }
      });
  }
}
