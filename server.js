import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const BASE = "http://119.59.118.159/live";
const PASS = "xxccxgd134";

const channels = {}; // สร้างเมื่อเจอจริง

// ======= Auto Scan Channel ==========
async function scanChannels(start = 1, end = 200) {
  console.log(`📡 Scanning channels ${start}–${end} ...`);

  for (let i = start; i <= end; i++) {
    const testURL = `${BASE}/ch${i}/${PASS}/index.m3u8`;

    try {
      const resp = await fetch(testURL, { method: "HEAD" });

      if (resp.ok) {
        channels[`ch${i}`] = `${BASE}/ch${i}/${PASS}/`;
        console.log(`✔ Channel ch${i} AVAILABLE`);
      } else {
        console.log(`✖ ch${i} (${resp.status})`);
      }

    } catch (e) {
      console.log(`✖ ch${i} ERROR`);
    }
  }

  console.log(`🎉 Scan complete! Total working: ${Object.keys(channels).length}`);
}

// เริ่มสแกนช่องตอนเปิด server
scanChannels(1, 200);

// ========== ROUTES ==========

// test route
app.get("/", (req, res) => {
  res.send("TIEA Auto IPTV Proxy is running");
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

    // rewrite segment url → proxy
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

// ใช้ PORT ของ Render
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Running on port " + port);
});











