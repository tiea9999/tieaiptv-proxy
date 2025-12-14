import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// ====== CONFIG ======
const BASE_URL = "http://45.144.165.187:8080/live/playid";
const PLAY_ID = 2535; // ค่าคงที่
const MAX_CH = 200;

// ====== TEST ROUTE ======
app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy (Node.js) is running");
});

// ====== PLAYLIST PROXY ======
app.get("/ch/:id", async (req, res) => {
  const id = req.params.id.replace("ch", "");
  const chNum = parseInt(id);

  if (isNaN(chNum) || chNum < 1 || chNum > MAX_CH) {
    return res.status(404).send("Channel not found!");
  }

  const playlistUrl = `${BASE_URL}/${PLAY_ID}/${chNum}.m3u8`;

  try {
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE_URL,
      }
    });

    if (!response.ok) {
      return res.status(500).send("Cannot load playlist (Source Error)");
    }

    let text = await response.text();

    // rewrite .ts segment
    text = text.replace(/(.*\.ts)/g, (seg) => `/segment/${chNum}/${seg}`);

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(text);

  } catch (err) {
    res.status(500).send("Fetch Error: " + err.message);
  }
});

// ====== SEGMENT PROXY ======
app.get("/segment/:ch/:seg", async (req, res) => {
  const { ch, seg } = req.params;
  const chNum = parseInt(ch);

  if (isNaN(chNum) || chNum < 1 || chNum > MAX_CH) {
    return res.status(404).send("Channel not found!");
  }

  const tsUrl = `${BASE_URL}/${PLAY_ID}/${seg}`;

  try {
    const response = await fetch(tsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE_URL,
      }
    });

    if (!response.ok) {
      return res.status(500).send("Cannot load segment");
    }

    res.set("Content-Type", "video/mp2t");
    response.body.pipe(res);

  } catch (err) {
    res.status(500).send("Segment Fetch Error: " + err.message);
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("TIEA IPTV Proxy running on port " + PORT);
});










