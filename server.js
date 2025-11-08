require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // ✅ ใช้เวอร์ชัน 2.6.11
const stream = require('stream');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pump = promisify(pipeline);

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ จำกัดโดเมนที่อนุญาต
const ALLOWED_PREFIX = 'https://dookeela2.live/live-tv/';
const ALLOWED_REFERER = 'https://dookeela2.live/';
const PROXY_KEY = process.env.PROXY_KEY || '';

app.get('/proxy', async (req, res) => {
  try {
    const target = req.query.url;
    const referer = req.query.referer || req.get('referer') || '';
    const ua = req.query.ua || req.get('user-agent') || 'Mozilla/5.0';
    const key = req.query.key || '';

    // ✅ ตรวจ key
    if (!PROXY_KEY) {
      return res.status(500).send('Proxy not configured (missing PROXY_KEY)');
    }
    if (!key || key !== PROXY_KEY) {
      return res.status(403).send('Invalid key');
    }

    if (!target) return res.status(400).send('Missing url');

    // ✅ อนุญาตเฉพาะโดเมนที่กำหนด
    if (!target.startsWith(ALLOWED_PREFIX)) {
      return res.status(403).send('URL not allowed');
    }

    // ✅ ตรวจ referer
    if (!referer || !referer.startsWith(ALLOWED_REFERER)) {
      return res.status(403).send('Invalid referer');
    }

    // ✅ ดึงข้อมูลจากต้นทาง
    const fetchRes = await fetch(target, {
      headers: {
        'Referer': referer,
        'User-Agent': ua,
        'Accept': '*/*'
      },
      redirect: 'follow',
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send(`Upstream error: ${fetchRes.statusText}`);
    }

    // ✅ ส่งต่อ header ที่สำคัญ
    const ct = fetchRes.headers.get('content-type');
    const cl = fetchRes.headers.get('content-length');
    const cc = fetchRes.headers.get('cache-control') || '';

    if (ct) res.set('Content-Type', ct);
    if (cl) res.set('Content-Length', cl);
    if (cc) res.set('Cache-Control', cc);

    // ✅ อนุญาต CORS สำหรับ AppCreator24
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Range,Content-Type');
    res.set('Accept-Ranges', 'bytes');

    const body = fetchRes.body;
    if (!body) return res.status(500).send('No body from upstream');

    await pump(body, res);
  } catch (err) {
    console.error('Proxy error:', err);
    if (!res.headersSent) res.status(500).send('Proxy error');
  }
});

app.listen(PORT, () => console.log(`✅ Proxy listening on port ${PORT}`));


