// server.js
require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
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

    // Basic auth (private)
    if (!PROXY_KEY) {
      return res.status(500).send('Proxy not configured (missing PROXY_KEY)');
    }
    if (!key || key !== PROXY_KEY) {
      return res.status(403).send('Invalid key');
    }

    if (!target) return res.status(400).send('Missing url');

    // Allow only specific prefix
    if (!target.startsWith(ALLOWED_PREFIX)) {
      return res.status(403).send('URL not allowed');
    }

    // Optional: require referer matches
    if (!referer || !referer.startsWith(ALLOWED_REFERER)) {
      return res.status(403).send('Invalid referer');
    }

    // Fetch the target
    const fetchRes = await fetch(target, {
      headers: {
        'Referer': referer,
        'User-Agent': ua,
        // Accept anything
      },
      // follow redirects
      redirect: 'follow',
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send(`Upstream error: ${fetchRes.statusText}`);
    }

    // Forward selected headers (content-type, cache-control, etc.)
    const ct = fetchRes.headers.get('content-type');
    const cl = fetchRes.headers.get('content-length');
    const cc = fetchRes.headers.get('cache-control') || '';

    if (ct) res.set('Content-Type', ct);
    if (cl) res.set('Content-Length', cl);
    if (cc) res.set('Cache-Control', cc);

    // Important CORS header so browser can use it in AppCreator24
    // If you want stricter, change '*' to AppCreator24 origin
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Range,Content-Type');
    res.set('Accept-Ranges', 'bytes');

    // Stream body directly
    const body = fetchRes.body;
    if (!body) return res.status(500).send('No body from upstream');

    await pump(body, res);
  } catch (err) {
    console.error('Proxy error:', err);
    if (!res.headersSent) res.status(500).send('Proxy error');
  }
});

app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));

