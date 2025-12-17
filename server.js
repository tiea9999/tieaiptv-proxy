import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// ====== CONFIG ======
const BASE_URL = "http://119.59.118.159/live";
const TOKEN = "Mariogogo007"; // รหัสโฟลเดอร์ระหว่าง ch และ index.m3u8
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

  const playlistUrl = `${BASE_URL}/ch${chNum}/${TOKEN}/index.m3u8`;

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

    // แก้พาธ segment (.ts)
    text = text.replace(/(.*\.ts)/g, (seg) => `/segment/ch${chNum}/${seg}`);

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(text);

  } catch (err) {
    res.status(500).send("Fetch Error: " + err.message);
  }
});

// ====== SEGMENT PROXY ======
app.get("/segment/:id/:seg", async (req, res) => {
  const { id, seg } = req.params;
  const chNum = id.replace("ch", "");

  const tsUrl = `${BASE_URL}/ch${chNum}/${TOKEN}/${seg}`;

  try {
    const response = await fetch(tsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": BASE_URL,
      }
    });

    if (!response.ok) {
      return res.status(500).send("Cannot load segment (Source Error)");
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











