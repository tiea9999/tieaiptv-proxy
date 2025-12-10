import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// สร้างช่อง auto ch9–ch66
const channels = {};
for (let i = 9; i <= 66; i++) {
  channels[`ch${i}`] = `http://119.59.118.159/live/ch${i}/xxccxgd134/`;
}

// test route
app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy (Node.js) is running");
});

// ดึง m3u8 playlist
app.get("/ch/:id", async (req, res) => {
  const id = req.params.id;
  const baseUrl = channels[id];

  if (!baseUrl) return res.status(404).send("Channel not found!");

  const playlistUrl = baseUrl + "index.m3u8";

  try {
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": baseUrl,
      }
    });

    if (!response.ok) {
      return res.status(500).send("Cannot load playlist (Source Error)");
    }

    let text = await response.text();

    // rewrite ให้ segment ผ่าน proxy ของเรา
    text = text.replace(/(.*\.ts)/g, (seg) => `/segment/${id}/${seg}`);

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(text);

  } catch (err) {
    res.status(500).send("Fetch Error: " + err.message);
  }
});

// proxy segment .ts
app.get("/segment/:id/:seg", async (req, res) => {
  const { id, seg } = req.params;
  const baseUrl = channels[id];

  if (!baseUrl) return res.status(404).send("Channel not found!");

  const tsUrl = baseUrl + seg;

  try {
    const response = await fetch(tsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": baseUrl,
      }
    });

    if (!response.ok) {
      return res.status(500).send("Cannot load segment");
    }

    res.set("Content-Type", "video/mp2t");
    response.body.pipe(res);

  } catch (err) {
    res.status(500).send("Segment Error: " + err.message);
  }
});

// Render ใช้ PORT จาก env
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Running on port " + port);
});










