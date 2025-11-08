require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const stream = require('stream');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pump = promisify(pipeline);

const app = express();
const PORT = process.env.PORT || 10000;

const ALLOWED_PREFIX = 'https://dookeela2.live/live-tv/';
const ALLOWED_REFERER = 'https://dookeela2.live/';
const PROXY_KEY = process.env.PROXY_KEY || '';

app.get('/proxy', async (req, res) => {
  try {
    const target = req.query.url;
    const referer = req.query.referer || req.get('referer') || '';
    const ua = req.query.ua || req.get('user-agent') || 'Mozilla/5.0';
    const key = req.query.key || '';

    if (!PROXY_KEY || key !== PROXY_KEY) {
      return res.status(403).send('Invalid key');
    }

    if (!target || !target.startsWith(ALLOWED_PREFIX)) {
      return res.status(403).send('URL not allowed');
    }

    // Fetch manifest
    const fetchRes = await fetch(target, {
      headers: { 'Referer': referer, 'User-Agent': ua },
      redirect: 'follow'
    });

    if (!fetchRes.ok) return res.status(fetchRes.status).send(fetchRes.statusText);

    let body = await fetchRes.text();

    // 🔹 Rewrite relative .ts paths เป็น absolute
    const baseUrl = target.substring(0, target.lastIndexOf('/') + 1);
    body = body.replace(/^(.*\.ts)$/gm, baseUrl + '$1');

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Accept-Ranges', 'bytes');

    res.send(body);
  } catch (err) {
    console.error('Proxy error:', err);
    if (!res.headersSent) res.status(500).send('Proxy error');
  }
});

app.listen(PORT, () => console.log(`✅ Proxy listening on port ${PORT}`));



