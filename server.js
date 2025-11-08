require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 10000;

const PROXY_KEY = process.env.PROXY_KEY || '';
const ALLOWED_PREFIX = 'https://dookeela2.live/live-tv/';

app.get('/proxy', async (req, res) => {
  try {
    const target = req.query.url;
    const referer = req.query.referer || '';
    const ua = req.query.ua || 'Mozilla/5.0';
    const key = req.query.key || '';

    // ตรวจ key
    if (!PROXY_KEY || key !== PROXY_KEY) return res.status(403).send('Invalid key');

    // ตรวจ URL
    if (!target || !target.startsWith(ALLOWED_PREFIX)) return res.status(403).send('URL not allowed');

    // ดึง manifest ใหม่ทุกครั้ง
    const resp = await fetch(target, { headers: { 'Referer': referer, 'User-Agent': ua } });
    if (!resp.ok) return res.status(resp.status).send(resp.statusText);

    let body = await resp.text();

    // แปลง relative segment เป็น absolute
    const baseUrl = target.substring(0, target.lastIndexOf('/') + 1);
    body = body.replace(/^(.*\.ts)$/gm, baseUrl + '$1');

    // ส่งกลับ client
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(body);

  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).send('Proxy error');
  }
});

app.listen(PORT, () => console.log(`✅ Dynamic Proxy running on port ${PORT}`));




