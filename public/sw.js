const SOUND_URL = 'https://www.myinstants.com/media/sounds/avengers_assemble_cap.mp3';

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data.json(); } catch(e) {}

  const options = {
    body: data.body || 'התכנסות מיידית!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 100, 300, 100, 600],
    tag: 'assemble',
    renotify: true,
    requireInteraction: true,
    data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🚨 ASSEMBLE!', options)
      .then(() => {
        // שלח הודעה לחלונות פתוחים שינגנו מוזיקה
        return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
          .then(clients => clients.forEach(c => c.postMessage({ type: 'PLAY_SOUND', data })));
      })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const c of clients) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow('/');
    })
  );
});
