

import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", async (req, res) => {
  const target = req.query.u;
  if (!target) {
    return res.status(400).send(`
      <h2 style="font-family:sans-serif;text-align:center;margin-top:40px;color:#333">
        ❗ โปรดใส่ URL เช่น<br>
        <code>?u=https://dookeela2.live/live-tv/hbo</code>
      </h2>
    `);
  }

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Referer": "https://dookeela.live/",
      "Origin": "https://dookeela.live",
      "Accept": "*/*",
      "Connection": "keep-alive"
    };

    const response = await fetch(target, { headers });
    if (!response.ok) throw new Error(`Bad Gateway: ${response.status}`);

    // ตรวจว่าคือ M3U8 หรือ HTML
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/vnd.apple.mpegurl") || target.endsWith(".m3u8")) {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    } else if (contentType.includes("application/dash+xml") || target.endsWith(".mpd")) {
      res.setHeader("Content-Type", "application/dash+xml");
    } else {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).send(`
      <h2 style="font-family:sans-serif;text-align:center;margin-top:40px;color:red">
        ⚠️ Bad gateway fetching stream<br><br>
        ${err.message}
      </h2>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`✅ TIEA IPTV Proxy running on port ${PORT}`);
});
