const express = require('express');
const webpush = require('web-push');
const path = require('path');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

// ── VAPID ──
// אחרי שתייצר מפתחות (שלב 4), הדבק אותם כאן:
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC  || 'PASTE_HERE';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'PASTE_HERE';

if (VAPID_PUBLIC !== 'PASTE_HERE') {
  webpush.setVapidDetails('mailto:admin@assemble.app', VAPID_PUBLIC, VAPID_PRIVATE);
}

let subscribers = []; // { sub, name }

// תן את ה-public key ל-client
app.get('/vapidPublicKey', (req, res) => res.send(VAPID_PUBLIC));

// הרשמת מכשיר
app.post('/subscribe', (req, res) => {
  const { subscription, name } = req.body;
  if (!subscription) return res.status(400).json({ error: 'missing subscription' });
  // מחק כפילויות
  subscribers = subscribers.filter(s => s.sub.endpoint !== subscription.endpoint);
  subscribers.push({ sub: subscription, name: name || 'משתמש' });
  console.log(`✅ נרשם: ${name} | סה"כ: ${subscribers.length}`);
  res.json({ ok: true, count: subscribers.length });
});

// שלח ASSEMBLE לכולם
app.post('/assemble', async (req, res) => {
  const { sender, loc } = req.body;
  const payload = JSON.stringify({
    title: '🚨 ASSEMBLE!',
    body: `${sender || 'מישהו'} → ${loc || ''}`,
    sender, loc,
    time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  });

  let sent = 0;
  const dead = [];

  await Promise.all(subscribers.map(async (s, i) => {
    try {
      await webpush.sendNotification(s.sub, payload);
      sent++;
    } catch (err) {
      if ([404, 410].includes(err.statusCode)) dead.push(i);
      else console.error('push error:', err.message);
    }
  }));

  // נקה מנויים מתים
  subscribers = subscribers.filter((_, i) => !dead.includes(i));
  console.log(`📣 נשלח ל-${sent} מכשירים`);
  res.json({ ok: true, sent });
});

// כמה מחוברים
app.get('/count', (req, res) => res.json({ count: subscribers.length }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 ASSEMBLE server פועל על port ${PORT}`));
