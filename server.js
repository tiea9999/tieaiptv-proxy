import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// ===== CONFIG =====
const BASE_URL = "http://119.59.118.168/live";
const TOKEN = "Ultraman008";
const MAX_CH = 200;

// ===== TEST =====
app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy HYBRID MODE running");
});

// ===== PLAYLIST =====
app.get("/ch/:id", async (req, res) => {
  const chNum = parseInt(req.params.id.replace("ch", ""));

  if (isNaN(chNum) || chNum < 1 || chNum > MAX_CH) {
    return res.status(404).send("Channel not found");
  }

  const playlistUrl = `${BASE_URL}/ch${chNum}/${TOKEN}/index.m3u8`;

  try {
    const r = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE_URL
      }
    });

    if (!r.ok) return res.status(502).send("Source error");

    let text = await r.text();

    // 🔑 rewrite ts ให้ชี้มาที่ proxy
    text = text.replace(
      /^([^#].*\.ts.*)$/gm,
      `/segment/ch${chNum}/$1`
    );

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(text);

  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ===== SEGMENT =====
app.get("/segment/:ch/:seg", async (req, res) => {
  const chNum = req.params.ch.replace("ch", "");
  const seg = req.params.seg;

  const tsUrl = `${BASE_URL}/ch${chNum}/${TOKEN}/${seg}`;

  try {
    const r = await fetch(tsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE_URL,
        "Connection": "keep-alive"
      }
    });

    if (!r.ok) return res.status(502).send("TS error");

    // ⚡ stream ตรง ไม่มี buffer
    res.set("Content-Type", "video/mp2t");
    r.body.pipe(res);

  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ===== START =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("HYBRID IPTV Proxy running on port " + PORT);
});











