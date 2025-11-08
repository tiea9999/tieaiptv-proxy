// server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  try {
    const response = await fetch(url);
    const data = await response.text();
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(data);
  } catch (err) {
    res.status(500).send("Error fetching URL");
  }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
