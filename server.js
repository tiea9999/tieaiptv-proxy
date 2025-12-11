import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const BASE = "http://119.59.118.159/live";
const PASS = "xxccxgd134";

const channels = {};  // ช่องที่มีจริง

// ========== Auto scan ==========
async function scanChannels(start = 1, end = 200) {
  console.log(`🔍 Scanning channels ${start}-${end} ...`);

  for (let i = start; i <= end; i++) {
    const testURL = `${BASE}/ch${i}/${PASS}/index.m3u8`;

    try {
      const resp = await fetch(testURL, { method: "HEAD" });

      if (resp.ok) {
        channels[`ch${i}`] = `${BASE}/ch${i}/${PASS}/`;
        console.log(`✔ ch${i} AVAILABLE`);
      } else {
        console.log(`✖ ch${i} NOT FOUND`);
      }

    } catch (e) {
      console.log(`✖ ch${i} ERROR`);
    }
  }

  console.log(`🎉 Scan complete. Working channels: ${Object.keys(channels).length}`);
}

scanChannels(1, 200);

// ========== ROUTES ===========

// test
app.get("/", (req, res) => {
  res.send("TIEA IPTV Auto Proxy is running");
});

// ดึง playlist
app.get("/ch/:id", async (req, res) => {
  const id = req.params.id;

  // ช่องมีจริง
  if (channels[id]) {
    const baseUrl = channels[id];
    const playlistUrl = baseUrl + "index.m3u8";

    try {
      const response = await fetch(playlistUrl, {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": baseUrl }
      });

      if (!response.ok) {
        return res.send(`#EXTM3U\n#EXT-X-ENDLIST`);
      }

      let text = await response.text();

      // rewrite segment
      text = text.replace(/(.*\.ts)/g, seg => `/segment/${id}/${seg}`);

      res.set("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(text);

    } catch (err) {
      return res.send(`#EXTM3U\n#EXT-X-ENDLIST`);
    }
  }

  // ช่องไม่มีจริงใน server — ส่ง playlist เปล่า (ไม่ error)
  return res.send(`#EXTM3U\n#EXTINF:0,Channel Offline\n#EXT-X-ENDLIST`);
});

// Proxy segment
app.get("/segment/:id/:seg", async (req, res) => {
  const { id, seg } = req.params;

  if (!channels[id]) {
    return res.status(404).send("Offline");
  }

  const baseUrl = channels[id];
  const tsUrl = baseUrl + seg;

  try {
    const response = await fetch(tsUrl, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": baseUrl }
    });

    if (!response.ok) return res.status(500).send("Segment Error");

    res.set("Content-Type", "video/mp2t");
    response.body.pipe(res);

  } catch (err) {
    res.status(500).send("Error");
  }
});

// Render port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Running on port " + port));












