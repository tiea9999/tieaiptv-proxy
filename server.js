import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// ====== AUTO CHANNEL ch1–ch200 ======
const channels = {};
for (let i = 1; i <= 200; i++) {
  channels[`ch${i}`] = `http://119.59.118.159/live/ch${i}/xxccxgd134/`;
}

// ====== TEST ROUTE ======
app.get("/", (req, res) => {
  res.send("TIEA IPTV Proxy (Node.js) is running");
});

// ====== PLAYLIST PROXY ======
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

    // rewrite segment path
    text = text.replace(/(.*\.ts)/g, (seg) => `/segment/${id}/${seg}`);

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(text);

  } catch (err) {
    res.status(500).send("Fetch Error: " + err.message);
  }
});

// ====== SEGMENT PROXY (.ts) ======
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
      return res.status(500).send("Cannot load segment (Source Error)");
    }

    // Stream TS data
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














